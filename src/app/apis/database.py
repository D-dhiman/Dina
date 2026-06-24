"""
database.py
-----------
Manages two asyncpg connection pools:
  - dina_pool        → dina database (users, habits, dailies, wellness_assessments, predictions, etc.)
  - rules_pool       → aura_wellness database (rules, prakriti_map, ritu_map, etc.)

Both are initialized at FastAPI startup via the lifespan function in main.py
and stored as app.state so they're accessible to all routes via dependency injection.

.env must contain:
    DATABASE_URL        = postgresql://user:password@host:port/dina
    DATABASE_URL_RULES  = postgresql://user:password@host:port/aura_wellness
"""

import os
import asyncpg
from typing import Optional


# ─────────────────────────────────────────────────────────────────────────────
# POOL SINGLETONS
# Stored here as module-level vars so the lifespan function can set them once
# and get_dina_pool / get_rules_pool can return them cheaply on every request.
# ─────────────────────────────────────────────────────────────────────────────

_dina_pool:  Optional[asyncpg.Pool] = None
_rules_pool: Optional[asyncpg.Pool] = None


# ─────────────────────────────────────────────────────────────────────────────
# STARTUP / SHUTDOWN
# Call these from FastAPI lifespan (see main.py)
# ─────────────────────────────────────────────────────────────────────────────

async def init_pools():
    """
    Creates both connection pools. Called once at app startup.
    Raises RuntimeError immediately if either DATABASE_URL is missing,
    so misconfiguration fails fast at boot rather than on first request.
    """
    global _dina_pool, _rules_pool

    dina_dsn = os.environ.get("DATABASE_URL")
    if not dina_dsn:
        raise RuntimeError(
            "DATABASE_URL not set.\n"
            "Add to .env: DATABASE_URL=postgresql://user:password@host:port/dina"
        )

    rules_dsn = os.environ.get("DATABASE_URL_RULES")
    if not rules_dsn:
        raise RuntimeError(
            "DATABASE_URL_RULES not set.\n"
            "Add to .env: DATABASE_URL_RULES=postgresql://user:password@host:port/aura_wellness"
        )

    _dina_pool = await asyncpg.create_pool(
        dina_dsn,
        min_size=2,
        max_size=10,
        command_timeout=30,
    )

    _rules_pool = await asyncpg.create_pool(
        rules_dsn,
        min_size=1,   # rules DB is read-only — lighter pool
        max_size=5,
        command_timeout=30,
    )

    print("[DB] ✓ dina pool initialized")
    print("[DB] ✓ aura_wellness rules pool initialized")


async def close_pools():
    """Gracefully closes both pools. Called at app shutdown."""
    global _dina_pool, _rules_pool

    if _dina_pool:
        await _dina_pool.close()
        _dina_pool = None
        print("[DB] dina pool closed")

    if _rules_pool:
        await _rules_pool.close()
        _rules_pool = None
        print("[DB] aura_wellness pool closed")


# ─────────────────────────────────────────────────────────────────────────────
# DEPENDENCY GETTERS
# FastAPI routes declare these as Depends() to receive a pool connection.
# ─────────────────────────────────────────────────────────────────────────────

async def get_dina_pool() -> asyncpg.Pool:
    """
    FastAPI dependency — injects the dina pool into a route.

    Usage in a route:
        from database import get_dina_pool
        async def my_route(pool: asyncpg.Pool = Depends(get_dina_pool)): ...
    """
    if _dina_pool is None:
        raise RuntimeError("dina pool not initialized — was init_pools() called at startup?")
    return _dina_pool


async def get_rules_pool() -> asyncpg.Pool:
    """
    FastAPI dependency — injects the aura_wellness rules pool into a route.

    Usage in a route:
        from database import get_rules_pool
        async def my_route(rules_pool: asyncpg.Pool = Depends(get_rules_pool)): ...
    """
    if _rules_pool is None:
        raise RuntimeError("rules pool not initialized — was init_pools() called at startup?")
    return _rules_pool