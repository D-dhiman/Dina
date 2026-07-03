import logging
import json
import re
import os
import urllib.request
import urllib.error
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
import asyncpg

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

# Placeholder objects if these need customization later, or import them from recommendation_engine if available
class RecommendationEngine:
    async def run_async(self, user, current_vata, current_pitta, current_kapha, city):
        # Fallback empty recommendation array if needed
        return []

router = APIRouter()
logger = logging.getLogger("uvicorn.error")
engine = RecommendationEngine()

GROQ_MODEL = "llama-3.3-70b-versatile"

SECTION_META = {
    "digestion": {"name": "Digestion & Metabolism", "ayurveda": "Agni", "weight": 0.35, "questions": range(1, 5)},
    "vitality": {"name": "Physical Body & Vitality", "ayurveda": "Sharirika Bala", "weight": 0.30, "questions": range(5, 9)},
    "mind": {"name": "Mind, Mood & Emotions", "ayurveda": "Manasika", "weight": 0.20, "questions": range(9, 12)},
    "senses": {"name": "Senses, Skin & Speech", "ayurveda": "Indriya", "weight": 0.15, "questions": range(12, 16)},
}

def get_score_label(score: float) -> str:
    if score >= 85: return "Excellent"
    if score >= 70: return "Good"
    if score >= 50: return "Fair"
    return "Poor"

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
# GROQ LLM CALL  (Async-friendly via threadpool)
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
# PROMPT BUILDERS / HELPERS
# ─────────────────────────────────────────────────────────────────────────────

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
            
    return result