"""
mock_db.py
----------
Mock database using Neena Gupta's real AYUSH Prakriti data (Registration ID: 373)
plus realistic synthetic daily logs based on her profile.

Real data from PDF:
  - Prakriti: Pitta-Vata (Dwandaj) — Pitta=36.75%, Vata=34.38%, Kapha=28.86%
  - Age 27, Female, Bikaner Rajasthan, desk job
  - Medical: cardiovascular illness, skin allergy, knee replacement surgery
  - Vitals: pulse 78, BP 85/95 (low systolic), body temp 95F (low)
  - Key physical: tall (Vata), dry skin/hair (Vata), profuse sweating + warm skin (Pitta),
    lax muscles (Pitta), small eyes (Vata), curly hair (Kapha), broad forehead (Kapha)
  - Psychological: delayed comprehension (Kapha), fickle friendships (Vata),
    soft spoken (Kapha), prefers cold food/drinks (Pitta)

Synthetic data:
  - Daily logs: 14 days showing realistic Pitta-Vata imbalance pattern
    (Pitta elevated due to desk stress + summer season, Kapha below baseline)
  - Medications: started Shatavari on day 8 for Pitta
  - Conditions: skin allergy flare, stress-related hypertension (diastolic elevated)
"""

from datetime import date, timedelta
from typing import Optional

_today = date.today()

# ─────────────────────────────────────────────────────────────────────────────
# STATIC PATIENT DATA  (mirrors public.users)
# ─────────────────────────────────────────────────────────────────────────────
MOCK_USERS = {
    "PT_NEENA_373": {
        "prakriti_id":    "PT_NEENA_373",
        "name":           "Neena Gupta",
        "email":          "neena16@gmail.com",
        "date_of_birth":  "1999-01-14",
        "gender":         "F",
        "dosha_vata":     34.38,
        "dosha_pitta":    36.75,
        "dosha_kapha":    28.86,
        "primary_dosha":  "Pitta-Vata",
        "timezone":       "Asia/Kolkata",
        "location":       "Bikaner, Rajasthan, India",
        # Patient history from AYUSH PDF (registration ID 373, CARI New Delhi)
        "patient_history": {
            "registration_id":       "373",
            "assessment_centre":     "CARI New Delhi",
            "assessment_date":       "2026-01-05",
            "occupation":            "desk",
            "education":             "PhD",
            "marital_status":        "married",
            "diet":                  "vegetarian",
            "bmi":                   24.65,
            "bmi_impression":        "Normal built",
            "height_cm":             156,
            "height_impression":     "Tall height (Vata)",
            "weight_kg":             60,
            "pulse_rate":            78,
            "bp_systolic":           85,
            "bp_diastolic":          95,
            "body_temp_f":           95,
            "chronic_illness":       "cardiovascular illness",
            "surgery_history":       "knee replacement",
            "allergies":             "skin",
            "infectious_disease":    "pathogens virus",
            "prone_to_illness":      True,
            "confounding_factors":   ["Accident/Injury", "Skin disease"],
            # Key physical findings from the assessment
            "vata_traits":  ["tall height", "dry skin", "dry hair", "dusky hair",
                             "small eyes", "dull white eyes", "unsteady gaze",
                             "dry rough teeth", "small thin nails", "quick gait",
                             "fickle friendships", "unpleasant voice"],
            "pitta_traits": ["moles/freckles", "warm skin", "lax muscles",
                             "thin eyelashes", "eyes redden in anger",
                             "profuse sweating", "strong body odour",
                             "prefers cold food", "frequent appetite",
                             "immediate thirst response"],
            "kapha_traits": ["delicate appearance", "broad forehead",
                             "gold/lotus skin colour", "curly hair",
                             "delayed comprehension", "slow task initiation",
                             "soft spoken", "polite in stress",
                             "less food quantity", "can skip meals"],
        }
    }
}

# ─────────────────────────────────────────────────────────────────────────────
# DAILY LOGS  (mirrors public.daily_logs)
# 14 days of realistic logs for Neena
# Context: summer season in Bikaner (very hot), desk job stress elevating Pitta,
# skin allergy flare since day 3, Shatavari started day 8
#
# _raw_logs tuple layout (19 fields):
# index:  0     1     2      3      4       5          6        7       8     9
# field: day, vata, pitta, kapha, health, deviation, sleep_q, stress, mood, energy,
# index: 10           11             12   13     14       15           16
# field: digestion, exercise_min, meditation, steps, water_L, compliance, notes,
# index: 17               18
# field: habits_completed, season
# ─────────────────────────────────────────────────────────────────────────────

# Baseline: Pitta=36.75, Vata=34.38, Kapha=28.86
# Pattern: Pitta climbing due to summer heat + work stress, Vata also up (irregular schedule)
# Kapha dropping (skipping meals, reduced water)

_raw_logs = [
    # day  vata   pitta  kapha  health dev    slp  str  mood enrg digestion          exer  medit steps  water comp   notes                                                                          habits_completed                                                                                   season
    (0,  35.5, 38.2, 26.3, 85.0, 12.0, 3.5, 2, 4, 4, "good",       30, 15, 5200, 2.5, 0.85, "Feeling okay, work meeting today",                        {"ccf_tea":True, "morning_walk":True,  "meditation":True,  "cold_compress":False}, "summer"),
    (1,  36.0, 39.0, 25.0, 82.0, 15.0, 3.0, 3, 3, 4, "good",       20, 10, 4800, 2.2, 0.75, "Slight acidity after lunch",                              {"ccf_tea":True, "morning_walk":True,  "meditation":False, "cold_compress":False}, "summer"),
    (2,  36.5, 39.8, 23.7, 79.0, 18.0, 2.5, 3, 3, 3, "acidity",    0,  10, 3900, 2.0, 0.6,  "Skin itching started, skipped walk",                      {"ccf_tea":True, "morning_walk":False, "meditation":False, "cold_compress":False}, "summer"),
    (3,  37.2, 40.5, 22.3, 75.0, 22.0, 2.5, 4, 3, 3, "acidity",    0,  5,  3500, 1.8, 0.5,  "Skin allergy flaring — red patches on arms. Work very stressful.", {"ccf_tea":False,"morning_walk":False, "meditation":False, "cold_compress":True},  "summer"),
    (4,  38.0, 41.3, 20.7, 71.0, 26.5, 2.0, 4, 2, 2, "acidity",    0,  0,  3200, 1.5, 0.35, "Itching worse. Missed meals. BP felt high.",              {"ccf_tea":False,"morning_walk":False, "meditation":False, "cold_compress":True},  "summer"),
    (5,  38.5, 42.0, 19.5, 68.0, 30.0, 2.0, 5, 2, 2, "irregular",  0,  0,  2800, 1.4, 0.3,  "Very fatigued. Skipped dinner. Skin very hot and irritated.", {"ccf_tea":False,"morning_walk":False, "meditation":False, "cold_compress":True},  "summer"),
    (6,  39.0, 42.5, 18.5, 65.0, 33.5, 2.5, 4, 3, 2, "irregular",  15, 5,  3100, 1.6, 0.45, "Weekend — slightly better. Skin still bad.",              {"ccf_tea":True, "morning_walk":False, "meditation":False, "cold_compress":True},  "summer"),
    (7,  39.2, 43.0, 17.8, 63.0, 36.0, 2.0, 4, 2, 2, "irregular",  0,  0,  2700, 1.5, 0.3,  "Saw doctor today. Started Shatavari and coconut water routine. Skin allergy diagnosed.", {"ccf_tea":False,"morning_walk":False, "meditation":False, "cold_compress":True},  "summer"),
    # Day 8: Shatavari started
    (8,  39.0, 42.8, 18.2, 64.0, 35.5, 2.5, 4, 3, 3, "irregular",  10, 5,  3000, 1.8, 0.5,  "First day on Shatavari. Trying to drink more water.",     {"ccf_tea":True, "morning_walk":False, "meditation":True,  "cold_compress":True},  "summer"),
    (9,  38.5, 42.3, 19.2, 66.0, 33.0, 3.0, 3, 3, 3, "irregular",  15, 10, 3400, 2.0, 0.6,  "Slight improvement in skin. Acidity a bit less.",         {"ccf_tea":True, "morning_walk":True,  "meditation":True,  "cold_compress":True},  "summer"),
    (10, 38.0, 41.5, 20.5, 69.0, 29.5, 3.0, 3, 3, 3, "good",       20, 10, 4000, 2.2, 0.7,  "Better energy. Eating on time today. Skin less red.",     {"ccf_tea":True, "morning_walk":True,  "meditation":True,  "cold_compress":False}, "summer"),
    (11, 37.5, 40.8, 21.7, 72.0, 26.5, 3.5, 3, 4, 4, "good",       25, 15, 4500, 2.3, 0.8,  "Good day. Sleep improving. Appetite better.",             {"ccf_tea":True, "morning_walk":True,  "meditation":True,  "cold_compress":False}, "summer"),
    (12, 37.0, 40.2, 22.8, 75.0, 23.0, 3.5, 2, 4, 4, "good",       30, 15, 5000, 2.4, 0.85, "Much better. Skin almost clear. Less sweating.",          {"ccf_tea":True, "morning_walk":True,  "meditation":True,  "cold_compress":False}, "summer"),
    (13, 36.5, 39.5, 24.0, 78.0, 20.0, 4.0, 2, 4, 4, "good",       30, 20, 5200, 2.5, 0.9,  "Feeling close to normal. Still on Shatavari. Work stress manageable.", {"ccf_tea":True, "morning_walk":True,  "meditation":True,  "cold_compress":False}, "summer"),
]

MOCK_DAILY_LOGS = {
    "PT_NEENA_373": [
        {
            "id":                   f"log_{i:03d}",
            "user_id":              "PT_NEENA_373",
            "log_date":             str(_today - timedelta(days=13 - day)),
            "current_vata":         vata,
            "current_pitta":        pitta,
            "current_kapha":        kapha,
            "health_score":         health,
            "deviation_score":      deviation,
            "wake_time":            "07:00",
            "sleep_time":           "23:30",
            "sleep_quality":        sleep_q,
            "habits_completed":     habits,
            "dailies_completed":    {},
            "meal_details":         {"diet": "vegetarian"},
            "water_intake":         water,
            "exercise_duration":    exercise_min,
            "exercise_type":        "walk" if exercise_min > 0 else None,
            "meditation_duration":  meditation,
            "mood_score":           mood,
            "energy_level":         energy,        # FIX: was missing from stored dict
            "digestion":            digestion,     # FIX: was missing from stored dict
            "steps":                steps,         # FIX: was missing from stored dict
            "stress_level":         stress,
            "compliance_score":     compliance,
            "season":               season,
            "aqi":                  95,            # Bikaner — dusty, moderate AQI
            "notes":                notes,
        }
        for (day, vata, pitta, kapha, health, deviation,
             sleep_q, stress, mood, energy, digestion,
             exercise_min, meditation, steps, water, compliance,
             notes, habits, season), i
        in zip(_raw_logs, range(len(_raw_logs)))
    ]
}

# ─────────────────────────────────────────────────────────────────────────────
# MEDICATIONS  (mirrors public.medications)
# ─────────────────────────────────────────────────────────────────────────────
MOCK_MEDICATIONS = {
    "PT_NEENA_373": [
        {
            "id":            "med_001",
            "user_id":       "PT_NEENA_373",
            "name":          "Shatavari",
            "type":          "ayurvedic",
            "dose":          "500mg",
            "form":          "tablet",
            "target_dosha":  "pitta",
            "frequency":     "twice_daily",
            "prescribed_by": "ayurvedic_doctor",
            "started_on":    str(_today - timedelta(days=6)),  # day 8
            "ended_on":      None,
            "active":        True,
            "notes":         "For Pitta pacification, skin inflammation, cooling",
        },
        {
            "id":            "med_002",
            "user_id":       "PT_NEENA_373",
            "name":          "Amlaki (Amla)",
            "type":          "ayurvedic",
            "dose":          "300mg",
            "form":          "powder",
            "target_dosha":  "pitta",
            "frequency":     "once_daily",
            "prescribed_by": "ayurvedic_doctor",
            "started_on":    str(_today - timedelta(days=6)),
            "ended_on":      None,
            "active":        True,
            "notes":         "Vitamin C, anti-inflammatory, balances Pitta and Vata",
        },
        {
            "id":            "med_003",
            "user_id":       "PT_NEENA_373",
            "name":          "Amlodipine",
            "type":          "allopathic",
            "dose":          "5mg",
            "form":          "tablet",
            "target_dosha":  None,
            "frequency":     "once_daily",
            "prescribed_by": "allopathic",
            "started_on":    str(_today - timedelta(days=90)),
            "ended_on":      None,
            "active":        True,
            "notes":         "For cardiovascular condition / BP management (pre-existing)",
        },
    ]
}

# ─────────────────────────────────────────────────────────────────────────────
# CONDITIONS  (mirrors public.conditions)
# ─────────────────────────────────────────────────────────────────────────────
MOCK_CONDITIONS = {
    "PT_NEENA_373": [
        {
            "id":                       "cond_001",
            "user_id":                  "PT_NEENA_373",
            "name":                     "Skin allergy",
            "severity":                 "moderate",
            "ayurvedic_classification": "Pitta disorder (Kushtha)",
            "dosha_affected":           ["pitta"],
            "diagnosed_on":             str(_today - timedelta(days=10)),
            "resolved_on":              None,
            "active":                   True,
            "notes":                    "Contact dermatitis type — red inflamed patches on arms, worsens in heat",
        },
        {
            "id":                       "cond_002",
            "user_id":                  "PT_NEENA_373",
            "name":                     "Cardiovascular illness (pre-existing)",
            "severity":                 "mild",
            "ayurvedic_classification": "Vata-Pitta disorder (Hridaya Roga)",
            "dosha_affected":           ["vata", "pitta"],
            "diagnosed_on":             str(_today - timedelta(days=365)),
            "resolved_on":              None,
            "active":                   True,
            "notes":                    "Managed with Amlodipine. Diastolic BP elevated (95 mmHg). Low systolic noted in AYUSH assessment.",
        },
        {
            "id":                       "cond_003",
            "user_id":                  "PT_NEENA_373",
            "name":                     "Acidity / hyperacidity",
            "severity":                 "mild",
            "ayurvedic_classification": "Pitta disorder (Amlapitta)",
            "dosha_affected":           ["pitta"],
            "diagnosed_on":             str(_today - timedelta(days=11)),
            "resolved_on":              None,
            "active":                   True,
            "notes":                    "Worsened during stress peak (days 3-7). Improving with diet corrections.",
        },
    ]
}

# ─────────────────────────────────────────────────────────────────────────────
# HABITS  (mirrors public.habits)
# ─────────────────────────────────────────────────────────────────────────────
MOCK_HABITS = {
    "PT_NEENA_373": [
        {
            "id":              "hab_001",
            "user_id":         "PT_NEENA_373",
            "habit_name":      "CCF tea (Coriander Cumin Fennel)",
            "category":        "ahara",
            "target_dosha":    "pitta",
            "prescribed_time": "16:00",
            "frequency":       "daily",
            "streak_count":    6,
            "longest_streak":  8,
            "details":         "Cooling digestive tea — reduces Pitta heat and acidity",
        },
        {
            "id":              "hab_002",
            "user_id":         "PT_NEENA_373",
            "habit_name":      "Morning walk (cool hours)",
            "category":        "vihara",
            "target_dosha":    "vata",
            "prescribed_time": "06:30",
            "frequency":       "daily",
            "streak_count":    4,
            "longest_streak":  7,
            "details":         "Walk before 7am to avoid Bikaner heat — grounding for Vata, avoids Pitta aggravation",
        },
        {
            "id":              "hab_003",
            "user_id":         "PT_NEENA_373",
            "habit_name":      "Meditation / pranayama",
            "category":        "vihara",
            "target_dosha":    "pitta",
            "prescribed_time": "07:00",
            "frequency":       "daily",
            "streak_count":    6,
            "longest_streak":  6,
            "details":         "Sheetali pranayama (cooling breath) — reduces Pitta stress response",
        },
        {
            "id":              "hab_004",
            "user_id":         "PT_NEENA_373",
            "habit_name":      "Cold compress on skin",
            "category":        "vihara",
            "target_dosha":    "pitta",
            "prescribed_time": "20:00",
            "frequency":       "daily",
            "streak_count":    0,
            "longest_streak":  7,
            "details":         "For active skin allergy — cooling compress on affected areas",
        },
    ]
}


# ─────────────────────────────────────────────────────────────────────────────
# DB FUNCTIONS  (same interface — swap bodies for real DB when ready)
# ─────────────────────────────────────────────────────────────────────────────

def get_user(patient_id: str) -> Optional[dict]:
    """
    REAL DB:
        SELECT prakriti_id, name, dosha_vata, dosha_pitta, dosha_kapha,
               primary_dosha, gender, location, patient_history
        FROM users WHERE prakriti_id = %s
    """
    return MOCK_USERS.get(patient_id)


def get_daily_logs(patient_id: str, last_n_days: int = 30) -> list:
    """
    REAL DB:
        SELECT * FROM daily_logs
        WHERE user_id = %s AND log_date >= CURRENT_DATE - INTERVAL '%s days'
        ORDER BY log_date ASC
    """
    logs = MOCK_DAILY_LOGS.get(patient_id, [])
    cutoff = date.today() - timedelta(days=last_n_days)
    return [l for l in logs if date.fromisoformat(l["log_date"]) >= cutoff]


def get_active_medications(patient_id: str) -> list:
    """
    REAL DB:
        SELECT * FROM medications
        WHERE user_id = %s AND active = true
        ORDER BY started_on ASC
    """
    return [m for m in MOCK_MEDICATIONS.get(patient_id, []) if m["active"]]


def get_active_conditions(patient_id: str) -> list:
    """
    REAL DB:
        SELECT * FROM conditions
        WHERE user_id = %s AND active = true
        ORDER BY diagnosed_on ASC
    """
    return [c for c in MOCK_CONDITIONS.get(patient_id, []) if c["active"]]


def get_habits(patient_id: str) -> list:
    """
    REAL DB:
        SELECT * FROM habits WHERE user_id = %s ORDER BY prescribed_time ASC
    """
    return MOCK_HABITS.get(patient_id, [])


def get_latest_log(patient_id: str) -> Optional[dict]:
    """
    REAL DB:
        SELECT * FROM daily_logs
        WHERE user_id = %s ORDER BY log_date DESC LIMIT 1
    """
    logs = MOCK_DAILY_LOGS.get(patient_id, [])
    return sorted(logs, key=lambda l: l["log_date"])[-1] if logs else None


def save_prediction(patient_id: str, prediction_dict: dict) -> str:
    """
    REAL DB:
        INSERT INTO predictions (user_id, forecast_date, current_health_score,
            current_vata, current_pitta, current_kapha, predictions_json,
            primary_driver, main_risk, dosha_trend_summary,
            doctor_referral, doctor_referral_reason,
            habits_json, dailies_json,
            model_used, raw_llm_response)
        VALUES (...) RETURNING id
    """
    import json
    print(f"\n[MOCK SAVE] Prediction for {patient_id} on {prediction_dict.get('forecast_date')}:")
    print(json.dumps({k: v for k, v in prediction_dict.items() if k != 'raw_llm_response'}, indent=2))
    return "mock-prediction-id-neena-001"


# ─────────────────────────────────────────────────────────────────────────────
# FORM SUBMISSIONS  (mirrors public.form_submissions)
# Separate from daily_logs — populated by the health score API.
# Each row = one form fill. Multiple per day allowed (up to user).
# Stored in ascending order so trend reads oldest→newest.
#
# Simulates Neena filling the form 5 times over the 14-day window:
#   - Day 0  : baseline just before flare was obvious (high scores)
#   - Day 5  : peak of flare (lowest scores)
#   - Day 8  : same day she started Shatavari (slight uptick)
#   - Day 11 : mid-recovery
#   - Day 13 : near-recovery (today)
# ─────────────────────────────────────────────────────────────────────────────

MOCK_FORM_SUBMISSIONS = {
    "PT_NEENA_373": [
        {
            "id":           "fs_001",
            "user_id":      "PT_NEENA_373",
            "submitted_at": str(_today - timedelta(days=13)) + "T09:15:00",
            "health_score": 72.5,
            "section_scores": {
                "Digestion & Metabolism":      3.5,
                "Physical Body & Vitality":    3.8,
                "Senses, Skin & Speech":       3.3,
                "Mind, Mood & Emotions":       3.5,
            },
            "answers": {
                "q01": 4, "q02": 4, "q03": 3, "q04": 4,   # digestion: mostly good
                "q05": 4, "q06": 4, "q07": 4, "q08": 4, "q09": 4, "q10": 3,
                "q11": 3, "q12": 3, "q13": 4,
                "q14": 4, "q15": 3,
            },
            "weak_questions": ["q10"],
            "dosha_signals":  {"vata": 0, "pitta": 1, "kapha": 0, "ama": 0},
            "label":         "Good",
            "notes":         "Feeling generally okay, some skin sensitivity starting",
            "assessor":      "self",
        },
        {
            "id":           "fs_002",
            "user_id":      "PT_NEENA_373",
            "submitted_at": str(_today - timedelta(days=8)) + "T08:30:00",
            "health_score": 31.3,
            "section_scores": {
                "Digestion & Metabolism":      2.0,
                "Physical Body & Vitality":    1.8,
                "Senses, Skin & Speech":       1.7,
                "Mind, Mood & Emotions":       1.5,
            },
            "answers": {
                "q01": 2, "q02": 2, "q03": 2, "q04": 2,   # digestion: poor
                "q05": 2, "q06": 2, "q07": 1, "q08": 2, "q09": 2, "q10": 1,
                "q11": 2, "q12": 1, "q13": 2,
                "q14": 2, "q15": 1,
            },
            "weak_questions": ["q01","q02","q03","q04","q05","q06","q07","q08","q09","q10","q11","q12","q13","q14","q15"],
            "dosha_signals":  {"vata": 5, "pitta": 6, "kapha": 1, "ama": 1},
            "label":         "Critical",
            "notes":         "Skin allergy peak, exhausted, no appetite, very stressed",
            "assessor":      "self",
        },
        {
            "id":           "fs_003",
            "user_id":      "PT_NEENA_373",
            "submitted_at": str(_today - timedelta(days=6)) + "T20:00:00",
            "health_score": 37.5,
            "section_scores": {
                "Digestion & Metabolism":      2.3,
                "Physical Body & Vitality":    2.0,
                "Senses, Skin & Speech":       2.0,
                "Mind, Mood & Emotions":       2.5,
            },
            "answers": {
                "q01": 2, "q02": 2, "q03": 3, "q04": 2,
                "q05": 2, "q06": 2, "q07": 1, "q08": 2, "q09": 2, "q10": 2,
                "q11": 2, "q12": 2, "q13": 2,
                "q14": 3, "q15": 2,
            },
            "weak_questions": ["q01","q02","q04","q05","q06","q07","q08","q09","q10","q11","q12","q13","q15"],
            "dosha_signals":  {"vata": 4, "pitta": 5, "kapha": 1, "ama": 1},
            "label":         "Poor",
            "notes":         "Started Shatavari today. Slightly more hopeful.",
            "assessor":      "self",
        },
        {
            "id":           "fs_004",
            "user_id":      "PT_NEENA_373",
            "submitted_at": str(_today - timedelta(days=3)) + "T09:00:00",
            "health_score": 56.3,
            "section_scores": {
                "Digestion & Metabolism":      3.0,
                "Physical Body & Vitality":    2.8,
                "Senses, Skin & Speech":       2.7,
                "Mind, Mood & Emotions":       3.5,
            },
            "answers": {
                "q01": 3, "q02": 3, "q03": 3, "q04": 3,
                "q05": 3, "q06": 3, "q07": 2, "q08": 3, "q09": 3, "q10": 2,
                "q11": 3, "q12": 2, "q13": 3,
                "q14": 4, "q15": 3,
            },
            "weak_questions": ["q07","q10","q12"],
            "dosha_signals":  {"vata": 1, "pitta": 2, "kapha": 0, "ama": 0},
            "label":         "Fair",
            "notes":         "Good improvement. Skin clearing. Energy better.",
            "assessor":      "self",
        },
        {
            "id":           "fs_005",
            "user_id":      "PT_NEENA_373",
            "submitted_at": str(_today) + "T08:45:00",
            "health_score": 65.0,
            "section_scores": {
                "Digestion & Metabolism":      3.5,
                "Physical Body & Vitality":    3.2,
                "Senses, Skin & Speech":       3.0,
                "Mind, Mood & Emotions":       3.5,
            },
            "answers": {
                "q01": 4, "q02": 3, "q03": 4, "q04": 3,
                "q05": 3, "q06": 3, "q07": 3, "q08": 3, "q09": 3, "q10": 3,
                "q11": 3, "q12": 3, "q13": 3,
                "q14": 4, "q15": 3,
            },
            "weak_questions": [],
            "dosha_signals":  {"vata": 0, "pitta": 0, "kapha": 0, "ama": 0},
            "label":         "Fair",
            "notes":         "Feeling much better. Nearly back to normal.",
            "assessor":      "self",
        },
    ]
}


# ─────────────────────────────────────────────────────────────────────────────
# NEW DB FUNCTIONS for form_submissions
# ─────────────────────────────────────────────────────────────────────────────

def save_form_submission(patient_id: str, submission: dict) -> str:
    """
    Called by the health score API after calculating score from form answers.
    Appends a new submission to the in-memory store (mock).

    REAL DB:
        INSERT INTO form_submissions (
            user_id, submitted_at, health_score, section_scores,
            answers, weak_questions, dosha_signals, label, notes, assessor
        ) VALUES (...) RETURNING id
    """
    import json as _json
    submissions = MOCK_FORM_SUBMISSIONS.setdefault(patient_id, [])
    new_id = f"fs_{len(submissions)+1:03d}"
    submission["id"]      = new_id
    submission["user_id"] = patient_id
    submissions.append(submission)
    print(f"\n[MOCK SAVE] Form submission {new_id} for {patient_id}:")
    print(_json.dumps({k: v for k, v in submission.items() if k != "answers"}, indent=2))
    return new_id


def get_form_submissions(patient_id: str, last_n: int = 5) -> list:
    """
    Returns the last N form submissions for a patient, oldest-first within that window.
    Used by run_twin.py to build the LLM trend block.

    REAL DB:
        SELECT id, submitted_at, health_score, section_scores,
               weak_questions, dosha_signals, label, notes
        FROM form_submissions
        WHERE user_id = %s
        ORDER BY submitted_at DESC
        LIMIT %s
    Then reverse in Python so oldest→newest for the LLM prompt.
    """
    submissions = MOCK_FORM_SUBMISSIONS.get(patient_id, [])
    # Sort all by submitted_at descending, take last_n, then reverse to oldest-first
    sorted_desc = sorted(submissions, key=lambda s: s["submitted_at"], reverse=True)
    window      = sorted_desc[:last_n]
    return list(reversed(window))   # oldest → newest for prompt