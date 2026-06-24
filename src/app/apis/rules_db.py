"""
rules_db.py
-----------
Postgres-backed rule fetching for the recommendation engine, connecting to
the aura_wellness database (separate from the main dina DB).

Tables used: rules, prakriti_map, ritu_map, age_map, advice_type_map,
             city_zone_map, zone_map, climate_zone_ritu_map.

Climate zone resolution chain:
    patient city → city_zone_map → zone_id → climate_zone_ritu_map (zone_id + ritu_id)
    → gives temp_avg / rain_avg / humidity_avg for the current season in that zone

.env must contain:
    DATABASE_URL_RULES=postgresql://user:password@host:port/aura_wellness
"""

import os
import asyncpg
from datetime import date
from typing import List, Dict, Optional


# Month → ritu_id fallback — used only if city/zone can't be resolved
MONTH_TO_RITU_FALLBACK = {
    1: "shis", 2: "shis",
    3: "vas",  4: "vas",
    5: "gree", 6: "gree",
    7: "var",  8: "var",
    9: "shar", 10: "shar",
    11: "hem", 12: "hem",
}

# ─────────────────────────────────────────────────────────────────────────────
# RULES DB CONNECTION POOL  (aura_wellness — separate from main dina pool)
# ─────────────────────────────────────────────────────────────────────────────

_rules_pool: asyncpg.Pool | None = None


async def get_rules_pool() -> asyncpg.Pool:
    """
    Returns the shared aura_wellness connection pool, creating it on first call.
    Call once at app startup (FastAPI lifespan) — don't create per request.

    Reads DATABASE_URL_RULES from environment (loaded from .env by run_twin.py
    or FastAPI app startup).
    """
    global _rules_pool
    if _rules_pool is None:
        dsn = os.environ.get("DATABASE_URL_RULES")
        if not dsn:
            raise RuntimeError(
                "DATABASE_URL_RULES not set. Add it to your .env, e.g.\n"
                "  DATABASE_URL_RULES=postgresql://user:password@localhost:5432/aura_wellness"
            )
        _rules_pool = await asyncpg.create_pool(dsn, min_size=1, max_size=5)
    return _rules_pool


async def close_rules_pool():
    """Call on app shutdown to cleanly close all aura_wellness connections."""
    global _rules_pool
    if _rules_pool is not None:
        await _rules_pool.close()
        _rules_pool = None


async def resolve_climate_zone(pool: asyncpg.Pool, city: Optional[str]) -> Optional[str]:
    """
    Looks up zone_id for a given city via city_zone_map.
    pool must be the aura_wellness pool (from get_rules_pool()).
    Returns None if city is unknown/unmapped — callers fall back to
    ritu-only rule matching (zone_id IS NULL rules still apply).
    """
    if not city:
        return None
    row = await pool.fetchrow(
        "SELECT zone_id FROM city_zone_map WHERE city = $1", city
    )
    return row["zone_id"] if row else None


async def get_current_ritu_id(pool: asyncpg.Pool, zone_id: Optional[str] = None) -> str:
    """
    Determines current ritu_id via month-based mapping.
    pool is accepted for future use (zone-specific season boundary overrides)
    but not used yet — month mapping is accurate enough for all zones.
    pool must be the aura_wellness pool (from get_rules_pool()).
    """
    return MONTH_TO_RITU_FALLBACK.get(date.today().month, "gree")


async def get_climate_context(pool: asyncpg.Pool, zone_id: Optional[str], ritu_id: str) -> Optional[dict]:
    """
    Returns temp_avg / rain_avg / humidity_avg for this zone + season,
    useful as extra context for the LLM prompt (not used in rule filtering
    directly, but enriches the prompt's environmental section).
    """
    if not zone_id:
        return None
    row = await pool.fetchrow(
        """
        SELECT czrm.temp_avg, czrm.rain_avg, czrm.humidity_avg, zm.zone_name
        FROM climate_zone_ritu_map czrm
        JOIN zone_map zm ON zm.zone_id = czrm.zone_id
        WHERE czrm.zone_id = $1 AND czrm.ritu_id = $2
        """,
        zone_id, ritu_id,
    )
    return dict(row) if row else None


async def fetch_rules(
    pool: asyncpg.Pool,
    prakriti_id: str,
    ritu_id: str,
    age_id: str,
    gender: str,
    climate_zone_id: Optional[str] = None,
) -> List[Dict]:
    """
    Real DB version of recommendation_engine.mock_fetch_rules().

    Matches rules where each filter column is either NULL (applies to
    everyone) or equals the patient's value — same logic the mock
    docstring described, now actually executed.

    ORDER BY puts the most specific rules (matching the most filters) first,
    so when we cap results with top_n later, the most targeted advice wins.
    """
    rows = await pool.fetch(
        """
        SELECT r.rule_id, r.rule, r.advice_id, r.extra_constraints,
               atm.advice_type
        FROM rules r
        LEFT JOIN advice_type_map atm ON r.advice_id = atm.advice_id
        WHERE (r.prakriti_id = $1 OR r.prakriti_id IS NULL)
          AND (r.ritu_id = $2 OR r.ritu_id IS NULL)
          AND (r.age_id = $3 OR r.age_id IS NULL)
          AND (r.gender = $4 OR r.gender IS NULL)
          AND (r.climate_zone_id = $5 OR r.climate_zone_id IS NULL)
        ORDER BY
          (r.prakriti_id IS NOT NULL)::int +
          (r.ritu_id IS NOT NULL)::int +
          (r.age_id IS NOT NULL)::int +
          (r.gender IS NOT NULL)::int +
          (r.climate_zone_id IS NOT NULL)::int
          DESC
        """,
        prakriti_id, ritu_id, age_id, gender, climate_zone_id,
    )
    return [dict(r) for r in rows]


async def get_prakriti_id_for_dosha(pool: asyncpg.Pool, primary_dosha: str) -> str:
    """
    Looks up prakriti_id from the real prakriti_map table by matching name.
    Falls back to 'sama' (balanced) if no match — handles AYUSH terms like
    'Pitta-Vata (Dwandaj)' by trying progressively looser matches.
    """
    cleaned = primary_dosha.strip()

    # Exact match first
    row = await pool.fetchrow(
        "SELECT prakriti_id FROM prakriti_map WHERE LOWER(name) = LOWER($1)", cleaned
    )
    if row:
        return row["prakriti_id"]

    # Strip parenthetical suffix e.g. "(Dwandaj)" and retry
    base = cleaned.split("(")[0].strip()
    row = await pool.fetchrow(
        "SELECT prakriti_id FROM prakriti_map WHERE LOWER(name) = LOWER($1)", base
    )
    if row:
        return row["prakriti_id"]

    # Try reversed dual-dosha order e.g. "Pitta-Vata" → "Vata-Pitta"
    if "-" in base:
        parts = [p.strip() for p in base.split("-")]
        if len(parts) == 2:
            reversed_name = f"{parts[1]}-{parts[0]}"
            row = await pool.fetchrow(
                "SELECT prakriti_id FROM prakriti_map WHERE LOWER(name) = LOWER($1)", reversed_name
            )
            if row:
                return row["prakriti_id"]

    # Fallback: balanced/tridoshic
    row = await pool.fetchrow(
        "SELECT prakriti_id FROM prakriti_map WHERE LOWER(name) LIKE '%sama%' OR LOWER(name) LIKE '%tridosh%' LIMIT 1"
    )
    return row["prakriti_id"] if row else "sama"


def get_age_id_sync(age: int, brackets_and_ids: list) -> str:
    """
    Maps an age to age_id using the real age_map table's brackets
    (fetched separately since it's just lookup data, cached per request).
    brackets_and_ids: list of (age_range_lower, age_id) tuples, sorted ascending.
    """
    matched = "0"
    for lower, age_id in brackets_and_ids:
        if age >= lower:
            matched = age_id
        else:
            break
    return matched


async def get_age_brackets(pool: asyncpg.Pool) -> list:
    """Fetches all age brackets from age_map, sorted ascending by lower bound."""
    rows = await pool.fetch(
        "SELECT age_range_lower, age_id FROM age_map ORDER BY age_range_lower ASC"
    )
    return [(r["age_range_lower"], r["age_id"]) for r in rows]