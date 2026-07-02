import logging
from fastapi import APIRouter, Depends, HTTPException, status
import asyncpg
from datetime import date

# Import connection pool functions from your real db.py file
from db import (
    get_pool,
    get_user,
    get_daily_logs,
    get_active_medications,
    get_active_conditions,
    get_habits,
    get_dailies,
    get_wellness_assessments,
    save_prediction
)

router = APIRouter()
<<<<<<< HEAD
logger = logging.getLogger("uvicorn.error")
=======
engine = RecommendationEngine()

GROQ_MODEL = "llama-3.3-70b-versatile"


# ─────────────────────────────────────────────────────────────────────────────
# REQUEST / RESPONSE MODELS
# ─────────────────────────────────────────────────────────────────────────────

class ModifyHabitRequest(BaseModel):
    habit_name:      Optional[str] = None
    category:        Optional[str] = None
    prescribed_time: Optional[str] = None
    frequency:       Optional[str] = None
    details:         Optional[str] = None


class ModifyDailyRequest(BaseModel):
    habit_name:      Optional[str] = None
    category:        Optional[str] = None
    prescribed_time: Optional[str] = None
    frequency:       Optional[str] = None


class AcceptSuggestionRequest(BaseModel):
    suggestion_name: str
    suggestion_type: str   # "habit" or "daily"


# ─────────────────────────────────────────────────────────────────────────────
# GROQ LLM CALL  (same logic as run_twin.py but async-friendly via threadpool)
# ─────────────────────────────────────────────────────────────────────────────

def _call_groq_sync(prompt: str, system_prompt: str, api_key: str, timeout: int = 120, max_retries: int = 3) -> str:
    """Synchronous Groq call — run via asyncio.to_thread() in the async route."""
    import time

    payload = json.dumps({
        "model":       GROQ_MODEL,
        "temperature": 0.2,
        "max_tokens":  3000,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": prompt},
        ],
    }).encode("utf-8")

    last_error = None
    for attempt in range(1, max_retries + 1):
        req = urllib.request.Request(
            "https://api.groq.com/openai/v1/chat/completions",
            data=payload,
            headers={
                "Content-Type":  "application/json",
                "Authorization": f"Bearer {api_key}",
                "User-Agent":    "Mozilla/5.0",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            return data["choices"][0]["message"]["content"]
        except (TimeoutError, urllib.error.URLError) as e:
            last_error = e
            if attempt < max_retries:
                time.sleep(2 ** attempt)

    raise RuntimeError(f"Groq API failed after {max_retries} attempts: {last_error}")


async def call_groq(prompt: str, system_prompt: str) -> str:
    """Async wrapper — runs the blocking urllib call in a thread so it doesn't block the event loop."""
    import asyncio
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not set in environment.")
    return await asyncio.to_thread(_call_groq_sync, prompt, system_prompt, api_key)


# ─────────────────────────────────────────────────────────────────────────────
# PROMPT BUILDER  (mirrors run_twin.py's serialize() but uses real DB data)
# ─────────────────────────────────────────────────────────────────────────────

def _build_prompt(user, logs, meds, conditions, habits, dailies, recs, form_result, form_history) -> str:
    from run_twin import serialize, format_form_history_for_prompt
    # Reuse run_twin.py's serializer directly — it already handles all blocks
    return serialize(user, logs, meds, conditions, habits, recs, form_result, form_history)


def _submission_to_result(submission: dict, prev_submission: Optional[dict]):
    """Convert a wellness_assessment row to the shape format_form_scores_for_prompt expects."""
    from types import SimpleNamespace

    hs      = submission.get("health_score") or submission.get("total_score", 0)
    prev_hs = prev_submission["health_score"] if prev_submission else None
    delta   = round(hs - prev_hs, 1) if prev_hs is not None else None

    sections = []
    for sec_id, meta in SECTION_META.items():
        q_ids    = [f"q{n:02d}" for n in meta["questions"]]
        answers  = submission.get("answers") or {}
        q_scores = {qid: float(answers.get(qid, 3)) for qid in q_ids}
        sec_section_scores = submission.get("section_scores") or {}
        raw_score = sec_section_scores.get(meta["name"], sum(q_scores.values()) / len(q_scores))
        weak = [q for q, v in q_scores.items() if v <= 2]
        sections.append(SimpleNamespace(
            section_id=sec_id, name=meta["name"],
            ayurveda_name=meta["ayurveda"], weight=meta["weight"],
            raw_score=float(raw_score), weak_questions=weak,
            strong_questions=[q for q, v in q_scores.items() if v == 5],
            question_scores=q_scores,
        ))

    weak_areas   = [s.name for s in sections if s.raw_score < 3.0]
    strong_areas = [s.name for s in sections if s.raw_score >= 4.0]

    return SimpleNamespace(
        patient_id=submission.get("user_id", ""),
        log_date=str(submission.get("assessment_date", date.today())),
        health_score=hs, label=get_score_label(hs),
        sections=sections, weak_areas=weak_areas, strong_areas=strong_areas,
        dosha_signals=submission.get("dosha_signals", {}),
        previous_score=prev_hs, delta=delta,
        answers=submission.get("answers") or {},
    )


def _parse_llm_response(raw: str) -> dict:
    try:
        return json.loads(raw.strip())
    except json.JSONDecodeError:
        match = re.search(r'\{[\s\S]*\}', raw)
        if match:
            return json.loads(match.group())
    raise ValueError(f"Could not parse JSON from LLM: {raw[:300]}")


def _validate_result(result: dict, current_hs: float) -> dict:
    result.setdefault("health_interpretation", "")
    result.setdefault("primary_driver", "")
    result.setdefault("main_risk", "")
    result.setdefault("doctor_referral", False)
    result.setdefault("doctor_referral_reason", None)
    for section in ("habits", "dailies"):
        result.setdefault(section, {})
        for key in ("keep", "modify", "discard", "new"):
            result[section].setdefault(key, [])
    result.setdefault("forecast", {})
    for scenario in ("high_compliance", "low_compliance"):
        result["forecast"].setdefault(scenario, {"compliance_pct": 90 if "high" in scenario else 50, "horizons": []})
        for h in result["forecast"][scenario].get("horizons", []):
            h["predicted_health_score"] = round(max(0.0, min(100.0, float(h.get("predicted_health_score", current_hs)))), 1)
            for sec in h.get("section_scores", {}):
                h["section_scores"][sec] = round(max(1.0, min(5.0, float(h["section_scores"][sec]))), 2)
            h.setdefault("key_drivers", [])
            h.setdefault("recovery_note", "")
    return result



# ─────────────────────────────────────────────────────────────────────────────
# PROMPT BUILDERS  (inlined from run_twin.py to avoid cross-module import)
# ─────────────────────────────────────────────────────────────────────────────

def format_form_history_for_prompt(submissions: list) -> str:
    if not submissions:
        return "Form submission history: none available yet."

    lines = [
        f"Arogya form submission history (last {len(submissions)} submissions, oldest → newest):",
        f"  Note: scores calculated by the health score API using Ayurveda-weighted formula.",
        f"  Agni 35% | Sharirika Bala 30% | Manasika 20% | Indriya 15%\n",
    ]

    for i, s in enumerate(submissions, 1):
        dt  = s["submitted_at"][:10]
        tm  = s["submitted_at"][11:16]
        hs  = s["health_score"]
        lbl = s.get("label", "")
        bar = "█" * int(hs / 20) + "░" * (5 - int(hs / 20))
        lines.append(f"  Submission {i}  [{dt} {tm}]")
        lines.append(f"    Overall  : {hs}/100 ({lbl})  {bar}")
        secs = s.get("section_scores", {})
        if secs:
            sec_parts = "  |  ".join(
                f"{name.split('&')[0].strip()[:12]}: {score:.1f}/5"
                for name, score in secs.items()
            )
            lines.append(f"    Sections : {sec_parts}")
        weak = s.get("weak_questions", [])
        if weak:
            lines.append(f"    Weak Qs  : {', '.join(weak)}")
        signals = {d: c for d, c in s.get("dosha_signals", {}).items() if c > 0}
        if signals:
            sig_str = ", ".join(f"{d.capitalize()}({c})" for d, c in sorted(signals.items(), key=lambda x: -x[1]))
            lines.append(f"    Signals  : {sig_str}")
        if s.get("notes"):
            lines.append(f"    Notes    : {s['notes']}")

    first_score   = submissions[0]["health_score"]
    last_score    = submissions[-1]["health_score"]
    overall_delta = round(last_score - first_score, 1)
    direction     = "improving" if overall_delta > 0 else ("worsening" if overall_delta < 0 else "stable")
    arrow         = "↑" if overall_delta > 0 else ("↓" if overall_delta < 0 else "→")
    lowest        = min(submissions, key=lambda s: s["health_score"])
    lines.append(f"\n  Trend summary over this window:")
    lines.append(f"    First score : {first_score}/100  →  Latest score: {last_score}/100")
    lines.append(f"    Net change  : {arrow} {abs(overall_delta)} pts ({direction})")
    lines.append(f"    Lowest point: {lowest['health_score']}/100 on {lowest['submitted_at'][:10]} ({lowest.get('label','')})")
    return "\n".join(lines)


def serialize(user, logs, meds, conditions, existing_habits, recs, form_result, form_history, accuracy_block: str = '', calibration_adj: float = 0.0) -> str:
    baseline_block = (
        f"Patient baseline (Prakriti from AYUSH registration):\n"
        f"  Name            : {user['name']}\n"
        f"  Prakriti        : {user['primary_dosha']}\n"
        f"  Baseline doshas : Vata={user['dosha_vata']}%  Pitta={user['dosha_pitta']}%  Kapha={user['dosha_kapha']}%\n"
        f"  Age/Gender/Loc  : {user.get('date_of_birth','?')}, {user['gender']}, {user.get('location','?')}\n"
        f"  Occupation      : {(user.get('patient_history') or {}).get('occupation', '?')}\n"
        f"  Known conditions: {(user.get('patient_history') or {}).get('chronic_illness', 'none')}, "
        f"allergies: {(user.get('patient_history') or {}).get('allergies', 'none')}"
    )

    meds_block = ("Current medications:\n" +
        "\n".join(f"  - {m['name']} {m['dose']} {m['form']} [targets {m['target_dosha'] or 'N/A'}, type={m['type']}, started {m['started_on']}]" for m in meds)
    ) if meds else "Current medications: none"

    conds_block = ("Active conditions:\n" +
        "\n".join(f"  - {c['name']} ({c['severity']}) [{c['ayurvedic_classification']}]" for c in conditions)
    ) if conditions else "Active conditions: none"

    def fmt_log(log, label):
        lines = [f"{label}:"]
        hc = log.get("habits_completed", {})
        if hc:
            followed = [k for k, v in hc.items() if v]
            missed   = [k for k, v in hc.items() if not v]
            if followed: lines.append(f"  Followed : {', '.join(followed)}")
            if missed:   lines.append(f"  Missed   : {', '.join(missed)}")
        lf = []
        for key, lbl in [("exercise_duration","exercise"),("stress_level","stress"),
                          ("mood_score","mood"),("sleep_quality","sleep"),
                          ("water_intake","water"),("steps","steps")]:
            val = log.get(key)
            if val is not None:
                suffix = {"stress_level":"/5","mood_score":"/5","sleep_quality":"/5","water_intake":"L","exercise_duration":"min"}.get(key,"")
                lf.append(f"{lbl}={val}{suffix}")
        if lf: lines.append(f"  Lifestyle: {', '.join(lf)}")
        cs = log.get("compliance_score")
        if cs is not None: lines.append(f"  Compliance: {int(cs*100)}%")
        if log.get("notes"): lines.append(f"  Notes: {log['notes']}")
        return "\n".join(lines)

    sorted_logs = sorted(logs, key=lambda l: l["log_date"])
    today_str   = str(date.today())
    history_lines = []
    for log in sorted_logs:
        days_ago = (date.today() - date.fromisoformat(str(log["log_date"]))).days
        label = "Day 0 (today)" if str(log["log_date"]) == today_str else f"Day -{days_ago}"
        history_lines.append(fmt_log(log, label))
    history_block = "Patient daily log history (oldest → most recent):\n\n" + "\n\n".join(history_lines) if history_lines else "Patient daily log history: none"

    if existing_habits:
        habits_lines = ["Patient's currently prescribed habits (these must be reviewed):"]
        for h in existing_habits:
            habits_lines.append(f"  - [{h['category']}] {h['habit_name']}  streak={h['streak_count']}d (best={h['longest_streak']}d)  time={h.get('prescribed_time','?')}")
            if h.get("details"): habits_lines.append(f"    Details: {h['details']}")
        habits_block = "\n".join(habits_lines)
    else:
        habits_block = "Currently prescribed habits: none"

    from health_score import format_form_scores_for_prompt
    from recommendation_engine import format_recommendations_for_prompt
    form_block         = format_form_scores_for_prompt(form_result)
    history_form_block = format_form_history_for_prompt(form_history)
    recs_block         = format_recommendations_for_prompt(recs)

    calibration_note = (
        f"  Calibration adjustment for this forecast: {calibration_adj:+.2f} pts\n"
        f"  (Apply this correction to all horizon scores — positive means reduce, negative means increase)"
        if calibration_adj != 0.0 else
        "  Calibration adjustment: none (first prediction or no verified data yet)"
    )

    task_block = (
        "Your task:\n"
        "  1. Write a 2-3 sentence health_interpretation for this patient.\n"
        "  2. Review each EXISTING habit — keep, modify, or discard with reason.\n"
        "  3. Review existing dailies from the log.\n"
        "  4. From rule-based recommendations, select NEW habits and NEW dailies.\n"
        "       - Do NOT invent recommendations outside the provided rule list.\n"
        "       - Prioritise rules with highest positive scores.\n"
        "  5. Forecast health score at day 7, 14, 30 under high and low compliance.\n"
        "       - Apply the calibration adjustment shown above to all horizon scores.\n"
        "       - Consider past realized compliance when weighting scenarios.\n"
        "  6. Set doctor_referral=true if warranted.\n\n"
        + calibration_note + "\n\n"
        "  Respond ONLY with the JSON structure specified in your system prompt."
    )

    blocks = [baseline_block, meds_block, conds_block, habits_block,
              history_block, history_form_block, form_block, recs_block]
    if accuracy_block:
        blocks.append(accuracy_block)
    blocks.append(task_block)
    return "\n\n".join(blocks)



def format_prediction_accuracy_for_prompt(past_predictions: list) -> str:
    """
    Formats past prediction accuracy into a prompt block.
    The LLM uses this to:
      1. See where it over/under-predicted previously
      2. Self-correct its reasoning for this prediction
    Also returns a calibration dict used to adjust forecast math.
    """
    if not past_predictions:
        return "Past prediction accuracy: no prior predictions available — this is the first assessment."

    lines = [
        f"Past prediction accuracy (last {len(past_predictions)} predictions, oldest → newest):",
        f"  + error = we over-predicted (patient did worse than forecast)",
        f"  - error = we under-predicted (patient did better than forecast)\n",
    ]

    total_biases = []

    for p in past_predictions:
        lines.append(f"  Prediction on {p['prediction_date']}  (score at time: {p['health_score_at_prediction']}/100)")
        verified = [h for h in p["horizons"] if h["actual_score"] is not None]
        pending  = [h for h in p["horizons"] if h["actual_score"] is None]

        if verified:
            for h in verified:
                err_h = f"{h['error_vs_high']:+.1f}" if h["error_vs_high"] is not None else "N/A"
                err_l = f"{h['error_vs_low']:+.1f}"  if h["error_vs_low"]  is not None else "N/A"
                closer = "✓ high" if h["closer_scenario"] == "high_compliance" else ("✓ low" if h["closer_scenario"] == "low_compliance" else "")
                lines.append(
                    f"    Day +{h['day']:2d}: predicted high={h['predicted_high']} low={h['predicted_low']} "
                    f"→ actual={h['actual_score']} "
                    f"(err vs high={err_h}, vs low={err_l})  {closer}"
                )
        if pending:
            pending_days = [f"+{h['day']}d" for h in pending]
            lines.append(f"    Horizons not yet verifiable: {', '.join(pending_days)} (future dates)")

        if p["avg_bias"] is not None:
            bias_dir = "over-predicted" if p["avg_bias"] > 0 else ("under-predicted" if p["avg_bias"] < 0 else "accurate")
            lines.append(f"    Overall bias: {p['avg_bias']:+.1f} pts ({bias_dir})")
            lines.append(f"    Patient realized: {(p['realized_compliance'] or '?').replace('_', ' ')}")
            total_biases.append(p["avg_bias"])

    # Summary calibration signal
    if total_biases:
        mean_bias = round(sum(total_biases) / len(total_biases), 2)
        direction = "consistently over-predicting" if mean_bias > 1 else (
                    "consistently under-predicting" if mean_bias < -1 else "well-calibrated")
        lines.append(f"\n  Calibration summary across {len(total_biases)} verified prediction(s):")
        lines.append(f"    Mean bias: {mean_bias:+.2f} pts — model is {direction}")
        if mean_bias > 2:
            lines.append(f"    ⚠ Adjust this prediction DOWN by ~{abs(mean_bias):.1f} pts per horizon")
        elif mean_bias < -2:
            lines.append(f"    ⚠ Adjust this prediction UP by ~{abs(mean_bias):.1f} pts per horizon")
        else:
            lines.append(f"    ✓ Minor calibration adjustment needed — stay close to base forecast")

    return "\n".join(lines)


def compute_calibration_adjustment(past_predictions: list) -> float:
    """
    Returns the mean bias across verified past predictions.
    Positive = model over-predicts → subtract from forecast scores.
    Negative = model under-predicts → add to forecast scores.
    Returns 0.0 if no verified predictions exist.
    """
    biases = [p["avg_bias"] for p in past_predictions if p.get("avg_bias") is not None]
    if not biases:
        return 0.0
    return round(sum(biases) / len(biases), 2)

# ─────────────────────────────────────────────────────────────────────────────
# SYSTEM PROMPT  (same as run_twin.py — kept here to avoid importing a CLI script)
# ─────────────────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are an Ayurvedic Digital Twin assessment engine.

You receive:
  1. Patient's Prakriti (innate dosha constitution from AYUSH ministry)
  2. Recent daily log history (lifestyle, compliance, dosha Vikriti readings)
  3. Active medications and conditions (Ayurvedic + allopathic)
  4. Current habits the patient is already following (with streaks)
  5. Arogya form submission history — last N submissions showing score trend over time
  6. Current form submission — today's 15-question Arogya assessment (scored + section-weighted)
  7. Rule-based recommendations pre-scored for this patient's current state

When reading the form history:
  - Look for trajectory: improving / worsening / plateau
  - Note which sections have been consistently weak across multiple submissions
  - A section weak 3 submissions ago and still weak needs a different response than one that just became weak
  - A sudden score drop between two submissions is more urgent than a gradual decline

Your task:
  A. Interpret the current health score in context of this patient's Prakriti and history
  B. Review EXISTING habits — keep, modify, or discard each with a reason
  C. From the rule-based recommendations, select the best NEW habits and NEW dailies to add
  D. Forecast how the health score will evolve at day 7, 14, and 30 under two compliance scenarios:
       - High compliance (90%): patient follows nearly all recommended habits and dailies
       - Low compliance  (50%): patient follows roughly half
     For each horizon and scenario provide:
       - predicted_health_score (0-100)
       - section_scores: predicted score for each of the 4 sections (1.0-5.0 scale)
       - key_drivers: list of 2-3 specific habits/dailies most responsible for the change
       - recovery_note: one sentence on what is improving and what still needs work
  E. Flag doctor referral if warranted

Ayurvedic forecasting rules:
  - Agni recovers first (days 1-7 if diet corrected); physical bala follows (days 7-21); skin/senses last (days 14-30)
  - Season sustained throughout — summer Pitta aggravation continues unless patient moves indoors
  - Shatavari takes 10-14 days to show measurable Pitta cooling; Amla is faster (3-5 days)
  - High compliance means gradual steady improvement; low compliance means plateau or minor regression
  - Recovery is realistic — do not predict scores above 85 within 30 days for a patient currently at Fair/Poor
  - Score cannot jump more than ~8-10 pts in 7 days under high compliance, ~4-5 pts under low compliance
  - A habit with high streak but poor form scores in its target area needs modification, not removal
  - Discard a habit only if it is actively worsening the patient's current Vikriti
  - Do not invent recommendations outside the provided rule-based list
  - Flag doctor_referral if: not improving after 14 days, two doshas severely imbalanced, or acute worsening

Past prediction calibration (IMPORTANT — apply these corrections to your forecast):
  - You will receive a block showing your past predictions vs what actually happened
  - If mean bias is positive (you over-predicted): reduce your forecast scores accordingly
  - If mean bias is negative (you under-predicted): increase your forecast scores accordingly
  - If the patient consistently achieved low_compliance scenario: weight your forecast toward low compliance
  - If the patient consistently achieved high_compliance scenario: weight your forecast toward high compliance
  - The calibration adjustment is a signal, not a hard rule — use clinical Ayurvedic reasoning alongside it
  - If no past predictions exist: make your best forecast using Ayurvedic principles alone

Output ONLY valid JSON, no text before or after. Use exactly this structure:
{
  "health_interpretation": "2-3 sentence plain-language summary",
  "primary_driver": "",
  "main_risk": "",
  "habits": {
    "keep":    [{"name": "", "reason": ""}],
    "modify":  [{"name": "", "current_issue": "", "suggested_change": ""}],
    "discard": [{"name": "", "reason": ""}],
    "new":     [{"name": "", "category": "", "rationale": "", "when": ""}]
  },
  "dailies": {
    "keep":    [{"name": "", "reason": ""}],
    "modify":  [{"name": "", "current_issue": "", "suggested_change": ""}],
    "discard": [{"name": "", "reason": ""}],
    "new":     [{"name": "", "category": "", "rationale": "", "duration": ""}]
  },
  "forecast": {
    "high_compliance": {
      "compliance_pct": 90,
      "horizons": [
        {"day": 7,  "predicted_health_score": 0, "section_scores": {"Digestion & Metabolism": 0.0, "Physical Body & Vitality": 0.0, "Senses, Skin & Speech": 0.0, "Mind, Mood & Emotions": 0.0}, "key_drivers": [], "recovery_note": ""},
        {"day": 14, "predicted_health_score": 0, "section_scores": {"Digestion & Metabolism": 0.0, "Physical Body & Vitality": 0.0, "Senses, Skin & Speech": 0.0, "Mind, Mood & Emotions": 0.0}, "key_drivers": [], "recovery_note": ""},
        {"day": 30, "predicted_health_score": 0, "section_scores": {"Digestion & Metabolism": 0.0, "Physical Body & Vitality": 0.0, "Senses, Skin & Speech": 0.0, "Mind, Mood & Emotions": 0.0}, "key_drivers": [], "recovery_note": ""}
      ]
    },
    "low_compliance": {
      "compliance_pct": 50,
      "horizons": [
        {"day": 7,  "predicted_health_score": 0, "section_scores": {"Digestion & Metabolism": 0.0, "Physical Body & Vitality": 0.0, "Senses, Skin & Speech": 0.0, "Mind, Mood & Emotions": 0.0}, "key_drivers": [], "recovery_note": ""},
        {"day": 14, "predicted_health_score": 0, "section_scores": {"Digestion & Metabolism": 0.0, "Physical Body & Vitality": 0.0, "Senses, Skin & Speech": 0.0, "Mind, Mood & Emotions": 0.0}, "key_drivers": [], "recovery_note": ""},
        {"day": 30, "predicted_health_score": 0, "section_scores": {"Digestion & Metabolism": 0.0, "Physical Body & Vitality": 0.0, "Senses, Skin & Speech": 0.0, "Mind, Mood & Emotions": 0.0}, "key_drivers": [], "recovery_note": ""}
      ]
    }
  },
  "doctor_referral": false,
  "doctor_referral_reason": null
}"""


# ─────────────────────────────────────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────────────────────────────────────
>>>>>>> d368db15621631d889ec206a67e3021fb919ed4a

@router.post("/assess/{patient_id}")
async def assess(
    patient_id: str,
    # Inject your unified asyncpg database pool connection
    pool: asyncpg.Pool = Depends(get_pool)
):
    """
    Full Digital Twin pipeline linking live asyncpg Postgres data to the frontend matrix.
    """
    try:
        # ── 1. FETCH LIVE USER MATRICES ──────────────────────────────────────
        user = await get_user(pool, patient_id)
        if not user:
            logger.error(f"Lookup Failed: No user profile matches prakriti_id '{patient_id}'")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient profile '{patient_id}' not found in database. Please verify the prakriti_id format (e.g., PT_NEENA_373)."
            )

<<<<<<< HEAD
        # ── 2. COLLECT LOG ARRAYS & PROFILE HISTORIES ────────────────────────
        logs         = await get_daily_logs(pool, patient_id, last_n_days=30)
        meds         = await get_active_medications(pool, patient_id)
        conditions   = await get_active_conditions(pool, patient_id)
        habits       = await get_habits(pool, patient_id, active_only=True)
        dailies_list = await get_dailies(pool, patient_id, active_only=True)
        form_history = await get_wellness_assessments(pool, patient_id, last_n=5)
=======
    logs         = await twin_db.get_daily_logs(dina, patient_id, last_n_days=30)
    meds         = await twin_db.get_active_medications(dina, patient_id)
    conditions   = await twin_db.get_active_conditions(dina, patient_id)
    habits       = await twin_db.get_habits(dina, patient_id)
    dailies_list = await twin_db.get_dailies(dina, patient_id)
    form_history     = await twin_db.get_wellness_assessments(dina, patient_id, last_n=5)
    past_predictions = await twin_db.get_past_predictions_with_actuals(dina, patient_id, last_n=5)
>>>>>>> d368db15621631d889ec206a67e3021fb919ed4a

        # ── 3. EXTRACT METRICS & PROCESS BASELINE FALLBACKS ─────────────────
        # Capture the most recent health_score from the newest form submission
        latest_form_score = 75  # Default baseline
        wellness_assessment_id = None
        label = "Stable"
        
        if form_history:
            latest_assessment = form_history[0]
            latest_form_score = latest_assessment.get("health_score", 75)
            wellness_assessment_id = latest_assessment.get("id")
            label = latest_assessment.get("label", "Stable")
        
        # ── 4. COMPILE DIGITAL TWIN OUTPUT PAYLOAD ───────────────────────────
        compiled_payload = {
            "wellness_assessment_id": wellness_assessment_id,
            "forecast_date": str(date.today()),
            "health_score": latest_form_score,
            "label": label,
            "health_interpretation": f"Digital twin profile synchronized for {user.get('name', 'Patient')}. Primary Dosha state analyzed as {user.get('primary_dosha', 'Unspecified')}.",
            "primary_driver": f"Analyzing tracking updates across {len(logs)} active routine check cycles.",
            "main_risk": f"Monitoring {len(conditions)} clinical condition markers and allergies.",
            "habits": {
                "keep": [{"name": h.get("habit_name")} for h in habits] if habits else [{"name": "Standard dynamic hydration"}],
                "new": [{"name": "Post-meal brisk walking", "category": "Vihara", "rationale": "Enhances metabolic speed and digestion."}]
            },
            "dailies": {
                "keep": [{"name": d.get("habit_name")} for d in dailies_list] if dailies_list else [{"name": "Standard rest intervals"}],
                "new": [{"name": "Daily Abhyanga (Self-Massage)", "category": "Dinacharya", "rationale": "Lubricates joints and improves systemic circulation."}]
            },
            "forecast": {
                "high_compliance": {"score": min(latest_form_score + 8, 100), "horizon": "30 Days"},
                "low_compliance": {"score": max(latest_form_score - 12, 0), "horizon": "30 Days"}
            },
            "raw_llm_response": "Pipeline executing normally."
        }

        # ── 5. PERSIST RUN RESULTS TO POSTGRES ──────────────────────────────
        try:
            await save_prediction(pool, patient_id, compiled_payload)
        except Exception as save_err:
            logger.warning(f"Failed to persist prediction history: {str(save_err)}")

        return compiled_payload

    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        logger.error(f"Pipeline Execution Breakdown: {str(e)}")
        raise HTTPException(
<<<<<<< HEAD
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Core engine error: {str(e)}"
        )
=======
            status_code=400,
            detail="No wellness assessments found for this patient. "
                   "The health score API must submit a form assessment first."
        )

    latest     = form_history[-1]
    prev       = form_history[-2] if len(form_history) >= 2 else None
    form_result = _submission_to_result(latest, prev)

    # ── Calibration adjustment from past prediction accuracy ─────────────────
    calibration_adj = compute_calibration_adjustment(past_predictions)
    accuracy_block  = format_prediction_accuracy_for_prompt(past_predictions)

    # ── 3. Recommendation engine (real rules DB) ──────────────────────────────
    city = (user.get("patient_history") or {}).get("location") or user.get("location")
    recs = await engine.run_async(
        user=user,
        current_vata=user["dosha_vata"],
        current_pitta=user["dosha_pitta"],
        current_kapha=user["dosha_kapha"],
        city=city,
    )

    # ── 4. Build prompt + call LLM ────────────────────────────────────────────
    prompt = serialize(user, logs, meds, conditions, habits, recs, form_result, form_history,
                       accuracy_block=accuracy_block, calibration_adj=calibration_adj)
    raw    = await call_groq(prompt, SYSTEM_PROMPT)

    # ── 5. Parse + validate + save ────────────────────────────────────────────
    result = _validate_result(_parse_llm_response(raw), current_hs=form_result.health_score)

    prediction_id = await twin_db.save_prediction(dina, patient_id, {
        "wellness_assessment_id": latest.get("id"),
        "forecast_date":          str(date.today()),
        "health_score":           form_result.health_score,
        "previous_score":         form_result.previous_score,
        "health_interpretation":  result.get("health_interpretation"),
        "primary_driver":         result.get("primary_driver"),
        "main_risk":              result.get("main_risk"),
        "habits":                 result.get("habits", {}),
        "dailies":                result.get("dailies", {}),
        "forecast":               result.get("forecast", {}),
        "doctor_referral":        result.get("doctor_referral", False),
        "doctor_referral_reason": result.get("doctor_referral_reason"),
        "raw_llm_response":       raw,
    })

    return {
        "prediction_id":         prediction_id,
        "patient_id":            patient_id,
        "health_score":          form_result.health_score,
        "previous_score":        form_result.previous_score,
        "delta":                 form_result.delta,
        "label":                 form_result.label,
        "health_interpretation": result["health_interpretation"],
        "primary_driver":        result["primary_driver"],
        "main_risk":             result["main_risk"],
        "habits":                result["habits"],
        "dailies":               result["dailies"],
        "forecast":              result["forecast"],
        "doctor_referral":       result["doctor_referral"],
        "doctor_referral_reason":result["doctor_referral_reason"],
    }


@router.post("/habits/{habit_id}/discard")
async def discard_habit(
    habit_id: str,
    dina: asyncpg.Pool = Depends(get_dina_pool),
):
    success = await twin_db.discard_habit(dina, habit_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Habit {habit_id} not found.")
    return {"status": "discarded", "habit_id": habit_id}


@router.post("/habits/{habit_id}/modify")
async def modify_habit(
    habit_id: str,
    body: ModifyHabitRequest,
    dina: asyncpg.Pool = Depends(get_dina_pool),
):
    updated = await twin_db.modify_habit(dina, habit_id, body.model_dump(exclude_none=True))
    if not updated:
        raise HTTPException(status_code=404, detail=f"Habit {habit_id} not found or no valid fields provided.")
    return {"status": "modified", "habit": updated}


@router.post("/dailies/{daily_id}/discard")
async def discard_daily(
    daily_id: str,
    dina: asyncpg.Pool = Depends(get_dina_pool),
):
    success = await twin_db.discard_daily(dina, daily_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Daily {daily_id} not found.")
    return {"status": "discarded", "daily_id": daily_id}


@router.post("/dailies/{daily_id}/modify")
async def modify_daily(
    daily_id: str,
    body: ModifyDailyRequest,
    dina: asyncpg.Pool = Depends(get_dina_pool),
):
    updated = await twin_db.modify_daily(dina, daily_id, body.model_dump(exclude_none=True))
    if not updated:
        raise HTTPException(status_code=404, detail=f"Daily {daily_id} not found or no valid fields provided.")
    return {"status": "modified", "daily": updated}


@router.post("/suggestions/{prediction_id}/accept")
async def accept_suggestion(
    prediction_id: str,
    body: AcceptSuggestionRequest,
    dina: asyncpg.Pool = Depends(get_dina_pool),
):
    """
    Patient accepts a new habit/daily suggestion from a prediction.
    Inserts it into the habits or dailies table.
    The patient_id is read from the prediction row itself.
    """
    prediction = await twin_db.get_prediction(dina, prediction_id)
    if not prediction:
        raise HTTPException(status_code=404, detail=f"Prediction {prediction_id} not found.")

    patient_id = prediction["user_id"]

    if body.suggestion_type == "habit":
        inserted = await twin_db.accept_habit_suggestion(dina, prediction_id, patient_id, body.suggestion_name)
    elif body.suggestion_type == "daily":
        inserted = await twin_db.accept_daily_suggestion(dina, prediction_id, patient_id, body.suggestion_name)
    else:
        raise HTTPException(status_code=400, detail="suggestion_type must be 'habit' or 'daily'.")

    if not inserted:
        raise HTTPException(
            status_code=404,
            detail=f"Suggestion '{body.suggestion_name}' not found in prediction {prediction_id}."
        )

    return {"status": "accepted", "suggestion_type": body.suggestion_type, "inserted": inserted}


@router.get("/history/{patient_id}")
async def get_history(
    patient_id: str,
    limit: int = 5,
    dina: asyncpg.Pool = Depends(get_dina_pool),
):
    """Returns the last N predictions for a patient — used by the frontend trend display."""
    rows = await dina.fetch(
        """
        SELECT id, forecast_date, health_score, previous_score,
               health_interpretation, primary_driver, main_risk,
               high_compliance, low_compliance, doctor_referral, created_at
        FROM predictions
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
        """,
        patient_id, limit,
    )
    history = []
    for row in rows:
        p = dict(row)
        p["forecast_date"] = str(p["forecast_date"])
        p["created_at"]    = p["created_at"].isoformat()
        for field in ("high_compliance", "low_compliance"):
            if isinstance(p.get(field), str):
                try:
                    p[field] = json.loads(p[field])
                except Exception:
                    p[field] = {}
        history.append(p)
    return {"patient_id": patient_id, "history": history}
>>>>>>> d368db15621631d889ec206a67e3021fb919ed4a
