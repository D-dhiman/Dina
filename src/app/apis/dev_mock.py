from fastapi import FastAPI, HTTPException
from typing import List, Dict, Any
import json

# Lightweight mock server for frontend development when real DB/GROQ are unavailable.
# Uses the existing mock_db module to return realistic payloads for /twin/* endpoints.

import mock_db

app = FastAPI(title="Dina Dev Mock API")


@app.get("/twin/assess/{patient_id}")
async def assess(patient_id: str):
    user = mock_db.MOCK_USERS.get(patient_id)
    if not user:
        raise HTTPException(status_code=404, detail="Patient not found in mock DB")

    existing_habits = mock_db.MOCK_HABITS.get(patient_id, [])
    # Create a simple dailies list derived from habits (for UI) if mock doesn't provide dailies
    existing_dailies = [
        {"id": f"d_{h['id']}", "user_id": h['user_id'], "habit_name": h['habit_name'], "category": h.get('category','routine'), "prescribed_time": h.get('prescribed_time')}
        for h in existing_habits[:3]
    ]

    # Simple simulated LLM verdicts (keep first, suggest new one)
    habits_verdict = {
        "keep": [{"name": existing_habits[0]['habit_name'], "reason": "Good effect on digestion"}] if existing_habits else [],
        "modify": [],
        "discard": [],
        "new": [{"name": "Gentle evening walk", "category": "vihara", "rationale": "Improve circulation", "when": "Evening"}]
    }
    dailies_verdict = {"keep": [], "modify": [], "discard": [], "new": []}

    resp = {
        "prediction_id": "mock_pred_001",
        "patient_id": patient_id,
        "user": {"name": user.get('name'), "date_of_birth": user.get('date_of_birth'), "gender": user.get('gender'), "health_score": 72},
        "health_score": 72,
        "previous_score": 68,
        "delta": 4,
        "label": "Fair",
        "health_interpretation": "Mock interpretation: patient showing mild Pitta aggravation; cooling diet recommended.",
        "primary_driver": "Diet",
        "main_risk": "Skin allergy",
        "habits_verdict": habits_verdict,
        "dailies_verdict": dailies_verdict,
        "forecast": {},
        "doctor_referral": False,
        "doctor_referral_reason": None,
        "existing_habits": existing_habits,
        "existing_dailies": existing_dailies,
        "analytics": {"risk_block": "Mock risk summary", "preventive": "Mock preventive guidance", "interpretation": "Mock interpretation block"}
    }
    return resp


@app.post("/dailies/sync")
async def sync_dailies(payload: Dict[str, Any]):
    patient_id = payload.get('patient_id')
    prescriptions = payload.get('prescriptions', []) or []
    results = []
    for item in prescriptions:
        action = (item.get('system_action') or '').lower()
        item_id = item.get('id')
        name = item.get('name') or item.get('habit_name')
        try:
            if action in ('new',):
                # return a pseudo-inserted object
                inserted = {**item, 'id': item.get('id') or f"mock_d_{len(results)+1}"}
                results.append({"action": "inserted", "daily": inserted})
            elif action in ('delete', 'del'):
                if item_id:
                    results.append({"action": "discarded", "id": item_id, "ok": True})
                else:
                    results.append({"action": "skipped", "reason": "no id for delete", "item": item})
            elif action in ('modified', 'mod'):
                if item_id:
                    updated = {**item}
                    results.append({"action": "modified", "daily": updated})
                else:
                    results.append({"action": "skipped", "reason": "no id for modify", "item": item})
            else:
                results.append({"action": "skipped", "reason": "unknown action", "item": item})
        except Exception as e:
            results.append({"action": "error", "error": str(e), "item": item})
    return {"patient_id": patient_id, "results": results}


@app.post("/habits/sync")
async def sync_habits(payload: Dict[str, Any]):
    patient_id = payload.get('patient_id')
    prescriptions = payload.get('prescriptions', []) or []
    results = []
    for item in prescriptions:
        action = (item.get('system_action') or '').lower()
        item_id = item.get('id')
        name = item.get('name') or item.get('habit_name')
        try:
            if action in ('new',):
                inserted = {**item, 'id': item.get('id') or f"mock_h_{len(results)+1}"}
                results.append({"action": "inserted", "habit": inserted})
            elif action in ('delete', 'del'):
                if item_id:
                    results.append({"action": "discarded", "id": item_id, "ok": True})
                else:
                    results.append({"action": "skipped", "reason": "no id for delete", "item": item})
            elif action in ('modified', 'mod'):
                if item_id:
                    updated = {**item}
                    results.append({"action": "modified", "habit": updated})
                else:
                    results.append({"action": "skipped", "reason": "no id for modify", "item": item})
            else:
                results.append({"action": "skipped", "reason": "unknown action", "item": item})
        except Exception as e:
            results.append({"action": "error", "error": str(e), "item": item})
    return {"patient_id": patient_id, "results": results}


@app.get("/twin/history/{patient_id}")
async def get_history(patient_id: str, limit: int = 5):
    # Return a minimal history payload
    return {"patient_id": patient_id, "history": [{"id": "mock_pred_001", "forecast_date": "2026-07-01", "health_score": 72, "previous_score": 68, "health_interpretation": "Mocked", "primary_driver": "Diet", "main_risk": "Skin allergy", "created_at": "2026-07-01T12:00:00"}]}
