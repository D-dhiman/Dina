"""
db.py
-----
Real Postgres database layer for the Ayurveda Digital Twin, using asyncpg.

Replaces mock_db.py — same function names/signatures wherever possible so
run_twin.py needs minimal changes, but everything here is now async and
hits the real `dina` database.

Setup:
    pip install asyncpg python-dotenv

    .env must contain:
        DATABASE_URL=postgresql://user:password@host:port/dina

Usage pattern (FastAPI):
    from db import get_pool
    pool = await get_pool()
    user = await get_user(pool, "PT_NEENA_373")
"""

import os
import json
from datetime import date, timedelta
from typing import Optional

import asyncpg

# ─────────────────────────────────────────────────────────────────────────────
# CONNECTION POOL
# ─────────────────────────────────────────────────────────────────────────────

_pool: Optional[asyncpg.Pool] = None


async def get_pool() -> asyncpg.Pool:
    """
    Returns a shared connection pool, creating it on first call.
    Call this once at app startup (e.g. FastAPI lifespan) and reuse it —
    don't create a new pool per request.
    """
    global _pool
    if _pool is None:
        dsn = os.environ.get("DATABASE_URL")
        if not dsn:
            raise RuntimeError(
                "DATABASE_URL not set. Add it to your .env, e.g.\n"
                "  DATABASE_URL=postgresql://user:password@localhost:5432/dina"
            )
        _pool = await asyncpg.create_pool(dsn, min_size=2, max_size=10)
    return _pool


async def close_pool():
    """Call on app shutdown to cleanly close all connections."""
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


# ─────────────────────────────────────────────────────────────────────────────
# USER + CONDITIONS  (conditions live inside users.patient_history jsonb)
# ─────────────────────────────────────────────────────────────────────────────

async def get_user(pool: asyncpg.Pool, patient_id: str) -> Optional[dict]:
    row = await pool.fetchrow(
        """
        SELECT prakriti_id, name, email, date_of_birth, gender,
               dosha_vata, dosha_pitta, dosha_kapha, primary_dosha,
               timezone, patient_history, weight, height, blood_type,
               diet_type, allergies, dietary_restrictions,
               health_goals, preferences, day_streak, days_active
        FROM users
        WHERE prakriti_id = $1
        """,
        patient_id,
    )
    if row is None:
        return None

    user = dict(row)
    # asyncpg returns jsonb columns as str by default unless a codec is set —
    # parse defensively in case it comes back as a string.
    for jsonb_field in ("patient_history", "health_goals", "preferences"):
        if isinstance(user.get(jsonb_field), str):
            try:
                user[jsonb_field] = json.loads(user[jsonb_field])
            except (json.JSONDecodeError, TypeError):
                user[jsonb_field] = {}
        elif user.get(jsonb_field) is None:
            user[jsonb_field] = {}

    # Surface location-ish fields the LLM prompt expects (no dedicated
    # location column exists yet — fall back gracefully)
    user.setdefault("location", user["patient_history"].get("location", "unknown"))

    return user


async def get_active_conditions(pool: asyncpg.Pool, patient_id: str) -> list:
    """
    Conditions are NOT a separate table — they're derived from
    users.patient_history jsonb. We normalize the known fields
    (chronic_illness, allergies, surgery_history, confounding_factors)
    into the same shape the old mock_db conditions list used, so
    run_twin.py's serializer doesn't need to change.
    """
    user = await get_user(pool, patient_id)
    if not user:
        return []

    history = user.get("patient_history", {}) or {}
    conditions = []

    if history.get("chronic_illness"):
        conditions.append({
            "name": history["chronic_illness"],
            "severity": "unspecified",
            "ayurvedic_classification": "unspecified",
            "active": True,
            "notes": "From AYUSH patient history",
        })

    allergies = user.get("allergies") or history.get("allergies")
    if allergies:
        conditions.append({
            "name": f"Allergy: {allergies}",
            "severity": "unspecified",
            "ayurvedic_classification": "Pitta disorder (suspected — allergy)",
            "active": True,
            "notes": "From patient profile / AYUSH history",
        })

    if history.get("surgery_history"):
        conditions.append({
            "name": f"Past surgery: {history['surgery_history']}",
            "severity": "resolved",
            "ayurvedic_classification": "unspecified",
            "active": True,
            "notes": "Surgical history from AYUSH assessment",
        })

    confounding = history.get("confounding_factors") or []
    for factor in confounding:
        conditions.append({
            "name": factor,
            "severity": "unspecified",
            "ayurvedic_classification": "unspecified",
            "active": True,
            "notes": "Confounding factor noted in AYUSH assessment",
        })

    return conditions


# ─────────────────────────────────────────────────────────────────────────────
# DAILY LOGS
# ─────────────────────────────────────────────────────────────────────────────

async def get_daily_logs(pool: asyncpg.Pool, patient_id: str, last_n_days: int = 30) -> list:
    cutoff = date.today() - timedelta(days=last_n_days)
    rows = await pool.fetch(
        """
        SELECT id, user_id, log_date, wake_time, sleep_time, sleep_quality,
               habits_completed, dailies_completed, meal_details,
               water_intake, exercise_duration, exercise_type,
               meditation_duration, mood_score, stress_level,
               compliance_score, notes, steps
        FROM daily_logs
        WHERE user_id = $1 AND log_date >= $2
        ORDER BY log_date ASC
        """,
        patient_id, cutoff,
    )
    logs = []
    for row in rows:
        log = dict(row)
        log["log_date"] = str(log["log_date"])
        for jsonb_field in ("habits_completed", "dailies_completed", "meal_details"):
            if isinstance(log.get(jsonb_field), str):
                try:
                    log[jsonb_field] = json.loads(log[jsonb_field])
                except (json.JSONDecodeError, TypeError):
                    log[jsonb_field] = {}
            elif log.get(jsonb_field) is None:
                log[jsonb_field] = {}
        logs.append(log)
    return logs


async def get_latest_log(pool: asyncpg.Pool, patient_id: str) -> Optional[dict]:
    logs = await get_daily_logs(pool, patient_id, last_n_days=3650)
    return logs[-1] if logs else None


# ─────────────────────────────────────────────────────────────────────────────
# MEDICATIONS
# ─────────────────────────────────────────────────────────────────────────────

async def get_active_medications(pool: asyncpg.Pool, patient_id: str) -> list:
    rows = await pool.fetch(
        """
        SELECT id, user_id, name, type, dose, form, target_dosha,
               frequency, prescribed_by, started_on, ended_on,
               active, notes, consumption_time
        FROM medications
        WHERE user_id = $1 AND active = true
        ORDER BY started_on ASC
        """,
        patient_id,
    )
    meds = []
    for row in rows:
        m = dict(row)
        m["started_on"] = str(m["started_on"]) if m["started_on"] else None
        m["ended_on"]   = str(m["ended_on"]) if m["ended_on"] else None
        meds.append(m)
    return meds


# ─────────────────────────────────────────────────────────────────────────────
# HABITS  (target_dosha + active added via migration_001)
# ─────────────────────────────────────────────────────────────────────────────

async def get_habits(pool: asyncpg.Pool, patient_id: str, active_only: bool = True) -> list:
    query = """
        SELECT id, user_id, habit_name, category, prescribed_time,
               frequency, streak_count, longest_streak, details,
               active
        FROM habits
        WHERE user_id = $1
    """
    if active_only:
        query += " AND active = true"
    query += " ORDER BY prescribed_time ASC"

    rows = await pool.fetch(query, patient_id)
    return [dict(r) for r in rows]


async def discard_habit(pool: asyncpg.Pool, habit_id: str) -> bool:
    """Soft-delete: sets active=false. Used when the LLM verdict is 'discard'."""
    result = await pool.execute(
        "UPDATE habits SET active = false WHERE id = $1", habit_id
    )
    return result.endswith("1")


async def modify_habit(pool: asyncpg.Pool, habit_id: str, updates: dict) -> Optional[dict]:
    """
    Applies a partial update to a habit row. `updates` keys must be a subset
    of: habit_name, category, prescribed_time, frequency, details, target_dosha.
    Used when the LLM verdict is 'modify'.
    """
    allowed = {"habit_name", "category", "prescribed_time", "frequency", "details"}
    fields = {k: v for k, v in updates.items() if k in allowed}
    if not fields:
        return None

    set_clause = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(fields))
    values = list(fields.values())

    row = await pool.fetchrow(
        f"UPDATE habits SET {set_clause} WHERE id = $1 RETURNING *",
        habit_id, *values,
    )
    return dict(row) if row else None


async def insert_habit(pool: asyncpg.Pool, patient_id: str, habit: dict) -> dict:
    """
    Inserts a brand new habit. Used by the accept-suggestion endpoint when
    a patient approves an LLM 'new' habit recommendation.
    """
    row = await pool.fetchrow(
        """
        INSERT INTO habits (user_id, habit_name, category, prescribed_time,
                             frequency, details, active)
        VALUES ($1, $2, $3, $4, $5, $6, true)
        RETURNING *
        """,
        patient_id,
        habit.get("name") or habit.get("habit_name"),
        habit.get("category"),
        habit.get("prescribed_time"),
        habit.get("frequency", "daily"),
        habit.get("rationale") or habit.get("details"),
    )
    return dict(row)


# ─────────────────────────────────────────────────────────────────────────────
# DAILIES  (separate table from habits — target_dosha + active added via migration)
# ─────────────────────────────────────────────────────────────────────────────

async def get_dailies(pool: asyncpg.Pool, patient_id: str, active_only: bool = True) -> list:
    query = """
        SELECT id, user_id, habit_name, category, prescribed_time,
               last_time_to_do, frequency, streak_count, longest_streak,
               active
        FROM dailies
        WHERE user_id = $1
    """
    if active_only:
        query += " AND active = true"
    query += " ORDER BY prescribed_time ASC"

    rows = await pool.fetch(query, patient_id)
    return [dict(r) for r in rows]


async def discard_daily(pool: asyncpg.Pool, daily_id: str) -> bool:
    result = await pool.execute(
        "UPDATE dailies SET active = false WHERE id = $1", daily_id
    )
    return result.endswith("1")


async def modify_daily(pool: asyncpg.Pool, daily_id: str, updates: dict) -> Optional[dict]:
    allowed = {"habit_name", "category", "prescribed_time", "frequency"}
    fields = {k: v for k, v in updates.items() if k in allowed}
    if not fields:
        return None

    set_clause = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(fields))
    values = list(fields.values())

    row = await pool.fetchrow(
        f"UPDATE dailies SET {set_clause} WHERE id = $1 RETURNING *",
        daily_id, *values,
    )
    return dict(row) if row else None


async def insert_daily(pool: asyncpg.Pool, patient_id: str, daily: dict) -> dict:
    row = await pool.fetchrow(
        """
        INSERT INTO dailies (user_id, habit_name, category, prescribed_time,
                              frequency, active)
        VALUES ($1, $2, $3, $4, $5, true)
        RETURNING *
        """,
        patient_id,
        daily.get("name") or daily.get("habit_name"),
        daily.get("category"),
        daily.get("prescribed_time"),
        daily.get("frequency", "daily"),
    )
    return dict(row)


# ─────────────────────────────────────────────────────────────────────────────
# WELLNESS ASSESSMENTS  (replaces mock form_submissions)
# ─────────────────────────────────────────────────────────────────────────────

async def get_wellness_assessments(pool: asyncpg.Pool, patient_id: str, last_n: int = 5) -> list:
    """
    Returns the last N wellness assessments, oldest-first (matches the
    ordering run_twin.py's format_form_history_for_prompt expects).
    """
    rows = await pool.fetch(
        """
        SELECT id, user_id, assessment_date, answers, total_score, section_scores, created_at
        FROM wellness_assessments
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
        """,
        patient_id, last_n,
    )
    assessments = []
    for row in reversed(rows):   # reverse to oldest-first
        a = dict(row)
        a["assessment_date"] = str(a["assessment_date"])
        a["submitted_at"]    = a["created_at"].strftime("%Y-%m-%dT%H:%M:%S")
        a["health_score"]    = a.pop("total_score")

        for jsonb_field in ("answers", "section_scores"):
            if isinstance(a.get(jsonb_field), str):
                try:
                    a[jsonb_field] = json.loads(a[jsonb_field])
                except (json.JSONDecodeError, TypeError):
                    a[jsonb_field] = {}

        # Derive label + weak_questions + dosha_signals on the fly since
        # wellness_assessments doesn't store these directly — recompute
        # from health_score.py's helpers for consistency.
        from health_score import get_score_label
        a["label"] = get_score_label(a["health_score"])

        weak_questions = []
        for qid, val in (a.get("answers") or {}).items():
            try:
                if float(val) <= 2:
                    weak_questions.append(qid)
            except (TypeError, ValueError):
                continue
        a["weak_questions"] = weak_questions

        try:
            from health_score import QUESTION_DOSHA_SIGNAL
            signals = {"vata": 0, "pitta": 0, "kapha": 0, "ama": 0}
            for qid in weak_questions:
                sig = QUESTION_DOSHA_SIGNAL.get(qid, "vata")
                if sig in signals:
                    signals[sig] += 1
            a["dosha_signals"] = signals
        except ImportError:
            a["dosha_signals"] = {}

        a["notes"] = ""   # wellness_assessments has no notes column currently
        assessments.append(a)

    return assessments


async def save_wellness_assessment(
    pool: asyncpg.Pool, patient_id: str,
    answers: dict, total_score: float, section_scores: dict,
) -> dict:
    """
    Called by the health score API after scoring a submitted form.
    NOTE: this lives here for completeness, but in practice the health
    score API (a separate service per your setup) likely owns this insert.
    """
    row = await pool.fetchrow(
        """
        INSERT INTO wellness_assessments (user_id, answers, total_score, section_scores)
        VALUES ($1, $2::jsonb, $3, $4::jsonb)
        RETURNING *
        """,
        patient_id, json.dumps(answers), total_score, json.dumps(section_scores),
    )
    return dict(row)


# ─────────────────────────────────────────────────────────────────────────────
# PREDICTIONS  (new table — stores LLM forecast + habit/daily verdicts)
# ─────────────────────────────────────────────────────────────────────────────


async def get_past_predictions_with_actuals(
    pool: asyncpg.Pool, patient_id: str, last_n: int = 5
) -> list:
    """
    Fetches the last N predictions for a patient and, for each one,
    finds the wellness assessment whose date is closest to each predicted
    horizon (day 7, 14, 30) to compute actual vs predicted accuracy.

    Returns a list of dicts, each containing:
        - prediction metadata (date, health_score at time of prediction)
        - per-horizon accuracy: predicted_score, actual_score, error, days_off
        - realized_compliance: estimate of which scenario was closer to reality
    """
    # Fetch last N predictions oldest-first
    pred_rows = await pool.fetch(
        """
        SELECT id, forecast_date, health_score, high_compliance, low_compliance,
               created_at
        FROM predictions
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
        """,
        patient_id, last_n,
    )
    if not pred_rows:
        return []

    # Fetch all wellness assessments for this patient (for actual score lookup)
    assessment_rows = await pool.fetch(
        """
        SELECT assessment_date, total_score, section_scores
        FROM wellness_assessments
        WHERE user_id = $1
        ORDER BY assessment_date ASC
        """,
        patient_id,
    )

    def find_closest_assessment(target_date, assessments):
        """Find assessment with date closest to target_date."""
        if not assessments:
            return None
        closest = min(
            assessments,
            key=lambda a: abs((a["assessment_date"] - target_date).days)
        )
        days_off = abs((closest["assessment_date"] - target_date).days)
        # Only use if within 7 days of the target — otherwise too stale
        return (closest, days_off) if days_off <= 7 else None

    results = []
    for pred in reversed(pred_rows):   # oldest first
        forecast_date = pred["forecast_date"]

        # Parse compliance scenarios
        high = pred["high_compliance"] or {}
        low  = pred["low_compliance"]  or {}
        if isinstance(high, str):
            try: high = json.loads(high)
            except: high = {}
        if isinstance(low, str):
            try: low = json.loads(low)
            except: low = {}

        horizons_data = []
        total_error   = 0.0
        n_horizons    = 0
        high_error    = 0.0
        low_error     = 0.0

        for horizon in [7, 14, 30]:
            target_date = forecast_date + __import__("datetime").timedelta(days=horizon)

            # Get predicted scores for this horizon
            high_pred = next((h["predicted_health_score"] for h in high.get("horizons", []) if h["day"] == horizon), None)
            low_pred  = next((h["predicted_health_score"] for h in low.get("horizons",  []) if h["day"] == horizon), None)

            # Find actual score closest to this date
            match = find_closest_assessment(target_date, assessment_rows)
            if match:
                actual_assessment, days_off = match
                actual_score = actual_assessment["total_score"]

                error_vs_high = (high_pred - actual_score) if high_pred is not None else None
                error_vs_low  = (low_pred  - actual_score) if low_pred  is not None else None

                # Overall error uses whichever scenario was closer to actual
                if high_pred is not None and low_pred is not None:
                    if abs(error_vs_high) <= abs(error_vs_low):
                        best_error = error_vs_high
                        closer_scenario = "high_compliance"
                    else:
                        best_error = error_vs_low
                        closer_scenario = "low_compliance"
                elif high_pred is not None:
                    best_error = error_vs_high
                    closer_scenario = "high_compliance"
                else:
                    best_error = None
                    closer_scenario = None

                if best_error is not None:
                    total_error += best_error
                    n_horizons  += 1
                if error_vs_high is not None: high_error += abs(error_vs_high)
                if error_vs_low  is not None: low_error  += abs(error_vs_low)

                horizons_data.append({
                    "day":             horizon,
                    "target_date":     str(target_date),
                    "actual_date":     str(actual_assessment["assessment_date"]),
                    "days_off":        days_off,
                    "predicted_high":  round(high_pred, 1) if high_pred is not None else None,
                    "predicted_low":   round(low_pred,  1) if low_pred  is not None else None,
                    "actual_score":    round(actual_score, 1),
                    "error_vs_high":   round(error_vs_high, 1) if error_vs_high is not None else None,
                    "error_vs_low":    round(error_vs_low,  1) if error_vs_low  is not None else None,
                    "closer_scenario": closer_scenario,
                })
            else:
                # No assessment close enough to this horizon yet
                horizons_data.append({
                    "day":            horizon,
                    "target_date":    str(target_date),
                    "actual_date":    None,
                    "days_off":       None,
                    "predicted_high": round(high_pred, 1) if high_pred is not None else None,
                    "predicted_low":  round(low_pred,  1) if low_pred  is not None else None,
                    "actual_score":   None,
                    "error_vs_high":  None,
                    "error_vs_low":   None,
                    "closer_scenario": None,
                })

        # Bias: positive = we over-predicted, negative = under-predicted
        avg_bias = round(total_error / n_horizons, 2) if n_horizons > 0 else None

        # Realized compliance: whichever scenario had lower total absolute error
        if n_horizons > 0:
            realized_compliance = "high_compliance" if high_error <= low_error else "low_compliance"
        else:
            realized_compliance = None

        results.append({
            "prediction_id":      str(pred["id"]),
            "prediction_date":    str(forecast_date),
            "health_score_at_prediction": round(pred["health_score"], 1) if pred["health_score"] else None,
            "horizons":           horizons_data,
            "avg_bias":           avg_bias,   # + = over-predicted, - = under-predicted
            "realized_compliance": realized_compliance,
            "n_horizons_verified": n_horizons,
        })

    return results

async def save_prediction(pool: asyncpg.Pool, patient_id: str, prediction: dict) -> str:
    """
    Persists one LLM run. `new` habit/daily suggestions stay inside
    habits_verdict/dailies_verdict as jsonb until accepted via
    accept_habit_suggestion / accept_daily_suggestion below.
    """
    row = await pool.fetchrow(
        """
        INSERT INTO predictions (
            user_id, wellness_assessment_id, forecast_date,
            health_score, previous_score, health_interpretation,
            primary_driver, main_risk,
            habits_verdict, dailies_verdict,
            high_compliance, low_compliance,
            doctor_referral, doctor_referral_reason,
            raw_llm_response
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11::jsonb, $12::jsonb, $13, $14, $15)
        RETURNING id
        """,
        patient_id,
        prediction.get("wellness_assessment_id"),
        prediction.get("forecast_date", date.today()) if isinstance(prediction.get("forecast_date"), date)
        else date.fromisoformat(prediction.get("forecast_date", str(date.today()))),
        prediction.get("health_score"),
        prediction.get("previous_score"),
        prediction.get("health_interpretation"),
        prediction.get("primary_driver"),
        prediction.get("main_risk"),
        json.dumps(prediction.get("habits", {})),
        json.dumps(prediction.get("dailies", {})),
        json.dumps(prediction.get("forecast", {}).get("high_compliance", {})),
        json.dumps(prediction.get("forecast", {}).get("low_compliance", {})),
        prediction.get("doctor_referral", False),
        prediction.get("doctor_referral_reason"),
        prediction.get("raw_llm_response"),
    )
    return str(row["id"])


async def get_prediction(pool: asyncpg.Pool, patient_id_or_prediction_id: str) -> Optional[dict]:
    """
    If given a UUID, fetches that specific prediction.
    If given a patient_id (non-UUID), fetches the most recent prediction for that patient.
    This dual behaviour lets the fallback in twin.py call get_prediction(pool, patient_id)
    without needing a separate function.
    """
    import re as _re
    is_uuid = bool(_re.match(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
                             patient_id_or_prediction_id, _re.I))
    if is_uuid:
        row = await pool.fetchrow(
            "SELECT * FROM predictions WHERE id = $1", patient_id_or_prediction_id
        )
    else:
        # Treat as patient_id — return most recent prediction
        row = await pool.fetchrow(
            "SELECT * FROM predictions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
            patient_id_or_prediction_id
        )
    if not row:
        return None
    p = dict(row)
    for jsonb_field in ("habits_verdict", "dailies_verdict", "high_compliance", "low_compliance"):
        if isinstance(p.get(jsonb_field), str):
            try:
                p[jsonb_field] = json.loads(p[jsonb_field])
            except (json.JSONDecodeError, TypeError):
                p[jsonb_field] = {}
    return p


async def accept_habit_suggestion(pool: asyncpg.Pool, prediction_id: str, patient_id: str, suggestion_name: str) -> Optional[dict]:
    """
    Finds the named suggestion inside predictions.habits_verdict['new'],
    inserts it as a real row in habits. Used by the frontend's
    "accept suggestion" action.
    """
    prediction = await get_prediction(pool, prediction_id)
    if not prediction:
        return None

    new_suggestions = (prediction.get("habits_verdict") or {}).get("new", [])
    match = next((s for s in new_suggestions if s.get("name") == suggestion_name), None)
    if not match:
        return None

    return await insert_habit(pool, patient_id, match)


async def accept_daily_suggestion(pool: asyncpg.Pool, prediction_id: str, patient_id: str, suggestion_name: str) -> Optional[dict]:
    prediction = await get_prediction(pool, prediction_id)
    if not prediction:
        return None

    new_suggestions = (prediction.get("dailies_verdict") or {}).get("new", [])
    match = next((s for s in new_suggestions if s.get("name") == suggestion_name), None)
    if not match:
        return None

    return await insert_daily(pool, patient_id, match)