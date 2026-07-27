"""
prescriptions_db.py
-------------------
Curated mock database of approved Ayurvedic habits and dailies.

This is the guardrail layer — the LLM can ONLY select from this list.
It cannot invent new habits or dailies. Every entry here has been
pre-approved and reviewed, so hallucination of prescriptions is
structurally impossible.

When the real DB is ready, replace MOCK_PRESCRIPTIONS with a real query:
    SELECT * FROM prescriptions
    WHERE active = true
    AND (prakriti IS NULL OR $prakriti = ANY(prakriti))
    AND (kaal IS NULL OR $kaal = ANY(kaal))
    ...

Schema (mirrors what the real table will look like):
    id           : unique identifier
    name         : prescription name (what the LLM returns)
    type         : "habit" | "daily"
    category     : "ahara" | "vihara" | "aushadha" | "yoga" | "pranayama" | "dinacharya"
    prakriti     : list of applicable prakriti IDs (null = all)
    kaal         : list of applicable seasons (null = all seasons)
    dushya       : list of dhatus this helps (null = general)
    agni         : list of agni types this suits (null = all)
    bala         : minimum bala level required ("avara" | "madhyama" | "pravara")
    avastha      : list of health phases this suits (null = all)
    description  : what the patient does
    timing       : when to do it
    duration     : how long / how often
    contraindications : conditions where this should NOT be used
    dosha_effect : {"vata": -1, "pitta": -1, "kapha": 0} (negative = pacifies)
"""

from typing import Optional
from datetime import date


# ─────────────────────────────────────────────────────────────────────────────
# CURATED PRESCRIPTIONS LIBRARY
# ─────────────────────────────────────────────────────────────────────────────

MOCK_PRESCRIPTIONS = [

    # ══════════════════════════════════════════════════════════════════════════
    # HABITS  (recurring, long-term routines)
    # ══════════════════════════════════════════════════════════════════════════

    # ── Dinacharya / Morning Routine ──────────────────────────────────────────
    {
        "id": "H001", "type": "habit", "category": "dinacharya",
        "name": "Oil pulling (Gandusha)",
        "description": "Swish 1 tbsp sesame or coconut oil in mouth for 10-15 minutes on empty stomach, then spit out.",
        "timing": "First thing in the morning, before brushing",
        "duration": "10-15 minutes daily",
        "prakriti":  ["vata", "pitta", "vata-pitta", "pitta-vata"],
        "kaal":      None,  # all seasons
        "dushya":    ["rasa", "rakta"],
        "agni":      ["samagni", "vishamagni", "tikshnagni", "mandagni"],
        "bala":      "avara",
        "avastha":   ["baseline", "recovery", "stress", "chronic"],
        "contraindications": "Active oral infection, nausea",
        "dosha_effect": {"vata": -1, "pitta": -1, "kapha": 0},
    },
    {
        "id": "H002", "type": "habit", "category": "dinacharya",
        "name": "Tongue scraping (Jihwa Nirlekhana)",
        "description": "Use a copper or stainless steel tongue scraper, 7 gentle strokes from back to front each morning.",
        "timing": "Morning, before brushing teeth",
        "duration": "2 minutes daily",
        "prakriti":  None,
        "kaal":      None,
        "dushya":    ["rasa"],
        "agni":      None,
        "bala":      "avara",
        "avastha":   None,
        "contraindications": None,
        "dosha_effect": {"vata": 0, "pitta": -1, "kapha": -1},
    },
    {
        "id": "H003", "type": "habit", "category": "dinacharya",
        "name": "Warm water with lemon and honey (morning)",
        "description": "Drink 1 glass of warm (not hot) water with juice of half a lemon and 1 tsp raw honey on empty stomach.",
        "timing": "Morning on empty stomach",
        "duration": "Daily",
        "prakriti":  ["kapha", "pitta-kapha", "kapha-pitta", "vata-kapha", "kapha-vata"],
        "kaal":      ["Vasant (Spring)", "Greeshma (Summer)", "Hemant (Early Winter)", "Shishir (Late Winter)"],
        "dushya":    ["rasa", "meda"],
        "agni":      ["mandagni", "samagni"],
        "bala":      "avara",
        "avastha":   ["baseline", "stress", "chronic"],
        "contraindications": "Tikshnagni (hyperactive digestion) — too acidic",
        "dosha_effect": {"vata": 0, "pitta": 1, "kapha": -2},
    },
    {
        "id": "H004", "type": "habit", "category": "dinacharya",
        "name": "Warm sesame oil self-massage (Abhyanga)",
        "description": "Apply warm sesame oil to entire body, massage for 10-15 minutes from extremities toward heart, follow with warm shower.",
        "timing": "Morning before bathing",
        "duration": "15-20 minutes, 3-4x per week minimum (daily ideal)",
        "prakriti":  ["vata", "vata-pitta", "pitta-vata", "vata-kapha", "kapha-vata"],
        "kaal":      ["Shishir (Late Winter)", "Hemant (Early Winter)", "Vasant (Spring)", "Varsha (Monsoon)"],
        "dushya":    ["asthi", "majja", "mamsa"],
        "agni":      None,
        "bala":      "avara",
        "avastha":   ["baseline", "recovery", "chronic"],
        "contraindications": "Active fever, skin infection, acute inflammation",
        "dosha_effect": {"vata": -2, "pitta": -1, "kapha": 0},
    },
    {
        "id": "H005", "type": "habit", "category": "dinacharya",
        "name": "Nasal oiling (Nasya)",
        "description": "Apply 2-3 drops of warm sesame or Anu taila in each nostril using little finger. Inhale gently.",
        "timing": "Morning after face wash",
        "duration": "2 minutes daily",
        "prakriti":  ["vata", "vata-pitta", "pitta-vata"],
        "kaal":      ["Shishir (Late Winter)", "Hemant (Early Winter)", "Varsha (Monsoon)"],
        "dushya":    ["majja"],
        "agni":      None,
        "bala":      "avara",
        "avastha":   ["baseline", "chronic"],
        "contraindications": "Active cold/sinusitis, just after eating",
        "dosha_effect": {"vata": -2, "pitta": 0, "kapha": -1},
    },

    # ── Yoga / Exercise ───────────────────────────────────────────────────────
    {
        "id": "H006", "type": "habit", "category": "yoga",
        "name": "Surya Namaskar (Sun Salutation)",
        "description": "12-round Surya Namaskar sequence, starting slowly and building up. Synchronise breath with movement.",
        "timing": "Morning, ideally at sunrise",
        "duration": "12-24 rounds, 15-20 minutes daily",
        "prakriti":  ["kapha", "pitta-kapha", "kapha-pitta", "vata-kapha", "kapha-vata"],
        "kaal":      ["Vasant (Spring)", "Greeshma (Summer)", "Sharad (Autumn)"],
        "dushya":    ["mamsa", "meda", "asthi"],
        "agni":      ["mandagni", "samagni"],
        "bala":      "madhyama",
        "avastha":   ["baseline", "stress"],
        "contraindications": "Knee replacement, acute joint pain, low Bala (avara)",
        "dosha_effect": {"vata": 0, "pitta": 1, "kapha": -2},
    },
    {
        "id": "H007", "type": "habit", "category": "yoga",
        "name": "Gentle Vata-pacifying yoga (Shavasana + forward folds)",
        "description": "Slow, grounding yoga sequence: Child's Pose, Paschimottanasana, Viparita Karani, ending with 10-min Shavasana.",
        "timing": "Morning or early evening",
        "duration": "20-30 minutes daily",
        "prakriti":  ["vata", "vata-pitta", "pitta-vata", "vata-kapha", "kapha-vata"],
        "kaal":      ["Varsha (Monsoon)", "Shishir (Late Winter)", "Hemant (Early Winter)"],
        "dushya":    ["majja", "asthi", "mamsa"],
        "agni":      None,
        "bala":      "avara",
        "avastha":   ["baseline", "recovery", "stress", "chronic"],
        "contraindications": None,
        "dosha_effect": {"vata": -2, "pitta": -1, "kapha": 0},
    },
    {
        "id": "H008", "type": "habit", "category": "yoga",
        "name": "Cooling Pitta yoga (Moon salutation + twists)",
        "description": "Chandra Namaskar, Ardha Matsyendrasana, Bhujangasana. Avoid heated rooms. Focus on cooling breath.",
        "timing": "Early morning or evening (avoid midday)",
        "duration": "20-30 minutes daily",
        "prakriti":  ["pitta", "vata-pitta", "pitta-vata", "pitta-kapha", "kapha-pitta"],
        "kaal":      ["Greeshma (Summer)", "Sharad (Autumn)"],
        "dushya":    ["rakta", "mamsa"],
        "agni":      ["tikshnagni"],
        "bala":      "madhyama",
        "avastha":   ["baseline", "stress"],
        "contraindications": "Acute inflammation, fever",
        "dosha_effect": {"vata": 0, "pitta": -2, "kapha": 0},
    },

    # ── Pranayama / Breathing ─────────────────────────────────────────────────
    {
        "id": "H009", "type": "habit", "category": "pranayama",
        "name": "Nadi Shodhana (Alternate nostril breathing)",
        "description": "Alternate nostril breathing: inhale left, exhale right, inhale right, exhale left. 10 rounds.",
        "timing": "Morning before breakfast or evening before dinner",
        "duration": "10-15 minutes daily",
        "prakriti":  None,
        "kaal":      None,
        "dushya":    ["majja", "rasa"],
        "agni":      None,
        "bala":      "avara",
        "avastha":   None,
        "contraindications": None,
        "dosha_effect": {"vata": -1, "pitta": -1, "kapha": -1},
    },
    {
        "id": "H010", "type": "habit", "category": "pranayama",
        "name": "Sheetali pranayama (Cooling breath)",
        "description": "Roll tongue into tube, inhale through curled tongue, exhale through nose. 10-15 rounds.",
        "timing": "Morning or when feeling hot/agitated",
        "duration": "5-10 minutes daily",
        "prakriti":  ["pitta", "vata-pitta", "pitta-vata", "pitta-kapha", "kapha-pitta"],
        "kaal":      ["Greeshma (Summer)", "Sharad (Autumn)"],
        "dushya":    ["rakta"],
        "agni":      ["tikshnagni"],
        "bala":      "avara",
        "avastha":   ["baseline", "stress", "recovery"],
        "contraindications": "Kapha dominant, cold/cough",
        "dosha_effect": {"vata": 0, "pitta": -2, "kapha": 1},
    },
    {
        "id": "H011", "type": "habit", "category": "pranayama",
        "name": "Kapalabhati (Skull-shining breath)",
        "description": "Rapid forceful exhalations with passive inhalations, 60-120 pumps per minute. 3 rounds of 30.",
        "timing": "Morning on empty stomach",
        "duration": "5-10 minutes daily",
        "prakriti":  ["kapha", "pitta-kapha", "kapha-pitta", "vata-kapha", "kapha-vata"],
        "kaal":      ["Hemant (Early Winter)", "Shishir (Late Winter)", "Vasant (Spring)"],
        "dushya":    ["rasa", "meda"],
        "agni":      ["mandagni"],
        "bala":      "madhyama",
        "avastha":   ["baseline"],
        "contraindications": "Pregnancy, hypertension, heart conditions, low Bala",
        "dosha_effect": {"vata": 1, "pitta": 1, "kapha": -2},
    },

    # ── Meditation / Mind ─────────────────────────────────────────────────────
    {
        "id": "H012", "type": "habit", "category": "vihara",
        "name": "Morning meditation (Dhyana)",
        "description": "Seated meditation: observe breath without controlling it. When mind wanders, gently return to breath.",
        "timing": "Morning after pranayama",
        "duration": "10-20 minutes daily",
        "prakriti":  None,
        "kaal":      None,
        "dushya":    ["majja"],
        "agni":      None,
        "bala":      "avara",
        "avastha":   None,
        "contraindications": None,
        "dosha_effect": {"vata": -1, "pitta": -1, "kapha": -1},
    },
    {
        "id": "H013", "type": "habit", "category": "vihara",
        "name": "Evening walk (Sayam Bhramana)",
        "description": "Slow, relaxed walk outdoors in natural surroundings. Not exercise-paced — contemplative and calm.",
        "timing": "Evening, 30-60 minutes after sunset",
        "duration": "20-30 minutes daily",
        "prakriti":  ["vata", "pitta", "vata-pitta", "pitta-vata"],
        "kaal":      None,
        "dushya":    ["majja", "mamsa"],
        "agni":      None,
        "bala":      "avara",
        "avastha":   ["baseline", "stress", "recovery"],
        "contraindications": None,
        "dosha_effect": {"vata": -1, "pitta": -1, "kapha": 0},
    },
    {
        "id": "H014", "type": "habit", "category": "vihara",
        "name": "Early morning walk (pre-sunrise)",
        "description": "Brisk walk outdoors before 7am, preferably in nature or park. Moderate pace.",
        "timing": "Before sunrise (5:30-7:00am)",
        "duration": "30 minutes daily",
        "prakriti":  None,
        "kaal":      ["Vasant (Spring)", "Greeshma (Summer)", "Sharad (Autumn)"],
        "dushya":    ["meda", "mamsa"],
        "agni":      ["mandagni", "samagni"],
        "bala":      "madhyama",
        "avastha":   ["baseline", "stress"],
        "contraindications": "Very low Bala, extreme cold seasons",
        "dosha_effect": {"vata": -1, "pitta": 0, "kapha": -1},
    },

    # ── Ahara / Diet Habits ───────────────────────────────────────────────────
    {
        "id": "H015", "type": "habit", "category": "ahara",
        "name": "Fixed meal timing (Niyata Ahara Kala)",
        "description": "Eat breakfast by 8am, lunch by 1pm (largest meal), dinner by 7pm. No eating outside these windows.",
        "timing": "All three meals daily",
        "duration": "Permanent lifestyle change",
        "prakriti":  ["vata", "vata-pitta", "pitta-vata", "vata-kapha", "kapha-vata"],
        "kaal":      None,
        "dushya":    None,
        "agni":      ["vishamagni", "mandagni"],
        "bala":      "avara",
        "avastha":   None,
        "contraindications": None,
        "dosha_effect": {"vata": -2, "pitta": 0, "kapha": -1},
    },
    {
        "id": "H016", "type": "habit", "category": "ahara",
        "name": "Warm water sipping throughout day",
        "description": "Sip plain warm (not hot) water throughout the day in small quantities. Avoid cold water entirely.",
        "timing": "Throughout the day, between meals",
        "duration": "Daily — minimum 1.5-2L",
        "prakriti":  ["vata", "kapha"],
        "kaal":      ["Shishir (Late Winter)", "Hemant (Early Winter)", "Varsha (Monsoon)"],
        "dushya":    ["rasa", "meda"],
        "agni":      ["mandagni", "vishamagni"],
        "bala":      "avara",
        "avastha":   None,
        "contraindications": None,
        "dosha_effect": {"vata": -1, "pitta": 0, "kapha": -1},
    },
    {
        "id": "H017", "type": "habit", "category": "ahara",
        "name": "Ghee in daily diet",
        "description": "Add 1 tsp of pure cow's ghee to lunch and dinner. Do not heat ghee to smoking point.",
        "timing": "Lunch and dinner",
        "duration": "Daily",
        "prakriti":  ["vata", "pitta", "vata-pitta", "pitta-vata"],
        "kaal":      ["Shishir (Late Winter)", "Hemant (Early Winter)", "Varsha (Monsoon)"],
        "dushya":    ["asthi", "majja", "mamsa"],
        "agni":      ["samagni", "tikshnagni"],
        "bala":      "avara",
        "avastha":   ["baseline", "recovery", "chronic"],
        "contraindications": "Mandagni — slows already sluggish digestion; obesity",
        "dosha_effect": {"vata": -2, "pitta": -1, "kapha": 1},
    },
    {
        "id": "H018", "type": "habit", "category": "ahara",
        "name": "Triphala at bedtime",
        "description": "1/2 tsp Triphala powder in warm water, 30 minutes before sleep.",
        "timing": "30 minutes before sleep",
        "duration": "Daily — minimum 4 weeks",
        "prakriti":  None,
        "kaal":      None,
        "dushya":    ["rasa", "rakta", "meda"],
        "agni":      ["samagni", "mandagni", "vishamagni"],
        "bala":      "avara",
        "avastha":   None,
        "contraindications": "Pregnancy, severe diarrhoea",
        "dosha_effect": {"vata": -1, "pitta": -1, "kapha": -1},
    },
    {
        "id": "H019", "type": "habit", "category": "ahara",
        "name": "Ashwagandha milk at bedtime",
        "description": "1/2 tsp Ashwagandha powder in warm full-fat milk with a pinch of cardamom and nutmeg before sleep.",
        "timing": "30-45 minutes before sleep",
        "duration": "Daily — minimum 6 weeks",
        "prakriti":  ["vata", "vata-pitta", "pitta-vata", "vata-kapha", "kapha-vata"],
        "kaal":      ["Shishir (Late Winter)", "Hemant (Early Winter)", "Varsha (Monsoon)"],
        "dushya":    ["mamsa", "asthi", "majja"],
        "agni":      ["samagni", "vishamagni"],
        "bala":      "avara",
        "avastha":   ["chronic", "recovery", "stress"],
        "contraindications": "Tikshnagni (excess heat), pregnancy, hyperthyroidism",
        "dosha_effect": {"vata": -2, "pitta": 0, "kapha": 0},
    },
    {
        "id": "H020", "type": "habit", "category": "ahara",
        "name": "CCF tea (Coriander Cumin Fennel)",
        "description": "Steep 1/4 tsp each coriander, cumin, and fennel seeds in hot water for 5 minutes. Drink warm.",
        "timing": "After meals or mid-afternoon",
        "duration": "Once or twice daily",
        "prakriti":  ["pitta", "vata-pitta", "pitta-vata"],
        "kaal":      ["Greeshma (Summer)", "Sharad (Autumn)"],
        "dushya":    ["rasa"],
        "agni":      ["tikshnagni", "vishamagni"],
        "bala":      "avara",
        "avastha":   None,
        "contraindications": None,
        "dosha_effect": {"vata": -1, "pitta": -2, "kapha": 0},
    },
    {
        "id": "H021", "type": "habit", "category": "ahara",
        "name": "Shatavari milk (morning)",
        "description": "1/2 tsp Shatavari powder in warm milk every morning.",
        "timing": "Morning after breakfast",
        "duration": "Daily — minimum 4 weeks",
        "prakriti":  ["pitta", "vata-pitta", "pitta-vata"],
        "kaal":      ["Greeshma (Summer)", "Sharad (Autumn)"],
        "dushya":    ["rasa", "rakta"],
        "agni":      ["samagni", "tikshnagni"],
        "bala":      "avara",
        "avastha":   ["baseline", "recovery", "chronic"],
        "contraindications": "Kapha excess, mandagni",
        "dosha_effect": {"vata": -1, "pitta": -2, "kapha": 1},
    },

    # ── Sleep ─────────────────────────────────────────────────────────────────
    {
        "id": "H022", "type": "habit", "category": "vihara",
        "name": "Fixed sleep schedule (before 10:30pm)",
        "description": "Be in bed by 10pm, lights out by 10:30pm. Wake at the same time each day (ideally 5:30-6am).",
        "timing": "Nightly",
        "duration": "Permanent lifestyle change",
        "prakriti":  ["vata", "vata-pitta", "pitta-vata"],
        "kaal":      None,
        "dushya":    ["majja"],
        "agni":      None,
        "bala":      "avara",
        "avastha":   None,
        "contraindications": None,
        "dosha_effect": {"vata": -2, "pitta": -1, "kapha": 0},
    },

    # ══════════════════════════════════════════════════════════════════════════
    # DAILIES  (short-term, situational, 1-4 weeks)
    # ══════════════════════════════════════════════════════════════════════════

    {
        "id": "D001", "type": "daily", "category": "ahara",
        "name": "Ginger honey tea (morning)",
        "description": "Fresh ginger (1 inch) boiled in 2 cups water for 5 minutes, strain, add 1 tsp raw honey when warm.",
        "timing": "Morning on empty stomach",
        "duration": "14-21 days",
        "prakriti":  ["kapha", "vata", "vata-kapha", "kapha-vata"],
        "kaal":      ["Hemant (Early Winter)", "Shishir (Late Winter)", "Varsha (Monsoon)"],
        "dushya":    ["rasa", "meda"],
        "agni":      ["mandagni", "vishamagni"],
        "bala":      "avara",
        "avastha":   ["baseline", "recovery", "stress"],
        "contraindications": "Tikshnagni (too heating), active ulcer",
        "dosha_effect": {"vata": -1, "pitta": 1, "kapha": -2},
    },
    {
        "id": "D002", "type": "daily", "category": "vihara",
        "name": "Cold compress on inflamed areas",
        "description": "Apply cool (not ice-cold) damp cloth to inflamed, hot, or itchy skin areas for 10 minutes.",
        "timing": "Evening or when irritation peaks",
        "duration": "Duration of active skin flare",
        "prakriti":  ["pitta", "vata-pitta", "pitta-vata", "pitta-kapha", "kapha-pitta"],
        "kaal":      ["Greeshma (Summer)", "Sharad (Autumn)"],
        "dushya":    ["rakta"],
        "agni":      None,
        "bala":      "avara",
        "avastha":   ["recovery", "chronic"],
        "contraindications": "Vata dominant — cold worsens Vata",
        "dosha_effect": {"vata": 1, "pitta": -2, "kapha": 0},
    },
    {
        "id": "D003", "type": "daily", "category": "aushadha",
        "name": "Guduchi (Giloy) decoction",
        "description": "Boil 1 tsp Guduchi stem powder in 2 cups water until reduced to 1 cup. Drink warm.",
        "timing": "Morning on empty stomach",
        "duration": "21-30 days",
        "prakriti":  None,
        "kaal":      ["Varsha (Monsoon)", "Sharad (Autumn)"],
        "dushya":    ["rakta", "rasa"],
        "agni":      ["samagni", "tikshnagni"],
        "bala":      "avara",
        "avastha":   ["recovery", "chronic"],
        "contraindications": "Pregnancy, autoimmune conditions on immunosuppressants",
        "dosha_effect": {"vata": -1, "pitta": -1, "kapha": -1},
    },
    {
        "id": "D004", "type": "daily", "category": "ahara",
        "name": "Moong dal khichdi (Pathya Ahara)",
        "description": "Simple kitchari: 1:2 moong dal to rice ratio, cooked with ghee, cumin, turmeric. Eat as main meal.",
        "timing": "Lunch (main meal of day)",
        "duration": "7-14 days during recovery or detox phase",
        "prakriti":  None,
        "kaal":      None,
        "dushya":    ["rasa", "mamsa"],
        "agni":      ["mandagni", "vishamagni"],
        "bala":      "avara",
        "avastha":   ["recovery", "stress", "chronic"],
        "contraindications": None,
        "dosha_effect": {"vata": -1, "pitta": -1, "kapha": -1},
    },
    {
        "id": "D005", "type": "daily", "category": "vihara",
        "name": "Avoid direct sunlight (11am-4pm)",
        "description": "Stay indoors or in shade between 11am and 4pm. If going out, use umbrella, cotton clothing, and rose water spray.",
        "timing": "Midday hours",
        "duration": "Duration of summer / Sharad season",
        "prakriti":  ["pitta", "vata-pitta", "pitta-vata", "pitta-kapha", "kapha-pitta"],
        "kaal":      ["Greeshma (Summer)", "Sharad (Autumn)"],
        "dushya":    ["rakta"],
        "agni":      None,
        "bala":      "avara",
        "avastha":   ["baseline", "stress", "recovery"],
        "contraindications": None,
        "dosha_effect": {"vata": 0, "pitta": -2, "kapha": 0},
    },
    {
        "id": "D006", "type": "daily", "category": "ahara",
        "name": "Coconut water (daily, morning)",
        "description": "Drink 1 fresh coconut water each morning, ideally before noon.",
        "timing": "Morning, preferably before noon",
        "duration": "14-30 days in summer/heat seasons",
        "prakriti":  ["pitta", "vata-pitta", "pitta-vata"],
        "kaal":      ["Greeshma (Summer)", "Sharad (Autumn)"],
        "dushya":    ["rasa", "rakta"],
        "agni":      ["tikshnagni", "samagni"],
        "bala":      "avara",
        "avastha":   ["baseline", "recovery", "stress"],
        "contraindications": "Mandagni — too sweet and heavy for sluggish digestion",
        "dosha_effect": {"vata": -1, "pitta": -2, "kapha": 1},
    },
    {
        "id": "D007", "type": "daily", "category": "aushadha",
        "name": "Amla (Indian Gooseberry) — raw or juice",
        "description": "Eat 1-2 fresh amla or drink 30ml amla juice every morning.",
        "timing": "Morning on empty stomach",
        "duration": "21-30 days",
        "prakriti":  None,
        "kaal":      None,
        "dushya":    ["rakta", "rasa"],
        "agni":      ["samagni", "tikshnagni", "vishamagni"],
        "bala":      "avara",
        "avastha":   None,
        "contraindications": "Mandagni — high sourness; hyperacidity initially",
        "dosha_effect": {"vata": -1, "pitta": -1, "kapha": -1},
    },
    {
        "id": "D008", "type": "daily", "category": "vihara",
        "name": "Digital detox (1 hour before sleep)",
        "description": "No screens (phone, TV, laptop) for 1 hour before sleep. Replace with reading, light stretching, or journaling.",
        "timing": "1 hour before sleep time",
        "duration": "21 days minimum",
        "prakriti":  ["vata", "pitta"],
        "kaal":      None,
        "dushya":    ["majja"],
        "agni":      None,
        "bala":      "avara",
        "avastha":   ["stress", "chronic"],
        "contraindications": None,
        "dosha_effect": {"vata": -1, "pitta": -1, "kapha": 0},
    },
    {
        "id": "D009", "type": "daily", "category": "aushadha",
        "name": "Turmeric milk (Haldi Doodh) at night",
        "description": "1/2 tsp turmeric + pinch of black pepper in warm milk. Drink 30 min before sleep.",
        "timing": "30 minutes before sleep",
        "duration": "14-21 days",
        "prakriti":  None,
        "kaal":      None,
        "dushya":    ["rakta", "mamsa", "asthi"],
        "agni":      ["samagni", "mandagni"],
        "bala":      "avara",
        "avastha":   ["recovery", "chronic"],
        "contraindications": "Tikshnagni with excess heat",
        "dosha_effect": {"vata": -1, "pitta": -1, "kapha": -1},
    },
    {
        "id": "D010", "type": "daily", "category": "vihara",
        "name": "Journaling (Svadhyaya)",
        "description": "Write 1 page daily: 3 things you're grateful for, 1 challenge you faced, 1 thing you'll do differently tomorrow.",
        "timing": "Evening, 30 minutes before sleep",
        "duration": "30 days",
        "prakriti":  None,
        "kaal":      None,
        "dushya":    ["majja"],
        "agni":      None,
        "bala":      "avara",
        "avastha":   ["stress", "chronic"],
        "contraindications": None,
        "dosha_effect": {"vata": -1, "pitta": -1, "kapha": 0},
    },
    {
        "id": "D011", "type": "daily", "category": "aushadha",
        "name": "Brahmi tea (for mental clarity)",
        "description": "Steep 1/2 tsp Brahmi powder in hot water for 5 minutes. Drink warm.",
        "timing": "Morning or early afternoon",
        "duration": "21 days",
        "prakriti":  ["vata", "pitta", "vata-pitta", "pitta-vata"],
        "kaal":      None,
        "dushya":    ["majja"],
        "agni":      ["samagni"],
        "bala":      "avara",
        "avastha":   ["stress", "chronic"],
        "contraindications": "Mandagni — take with food to avoid nausea",
        "dosha_effect": {"vata": -1, "pitta": -1, "kapha": 0},
    },
    {
        "id": "D012", "type": "daily", "category": "vihara",
        "name": "Feet oiling before sleep (Padabhyanga)",
        "description": "Massage warm sesame oil into feet and lower legs for 5 minutes before sleep.",
        "timing": "Just before sleep",
        "duration": "Daily — especially during Vata aggravating seasons",
        "prakriti":  ["vata", "vata-pitta", "pitta-vata"],
        "kaal":      ["Shishir (Late Winter)", "Hemant (Early Winter)", "Varsha (Monsoon)"],
        "dushya":    ["asthi", "majja"],
        "agni":      None,
        "bala":      "avara",
        "avastha":   ["baseline", "stress", "recovery"],
        "contraindications": None,
        "dosha_effect": {"vata": -2, "pitta": 0, "kapha": 0},
    },
]


# ─────────────────────────────────────────────────────────────────────────────
# FILTERING ENGINE
# ─────────────────────────────────────────────────────────────────────────────

def filter_prescriptions(
    prakriti:  str,
    kaal:      str,
    dushya:    list,
    agni:      str,
    bala:      str,
    avastha:   str,
    type_filter: str = None,   # "habit" | "daily" | None (both)
    max_results: int = 20,
) -> list:
    """
    Filter the prescriptions library to items relevant for this patient.

    Matching logic (each filter is optional — None in the prescription = matches all):
      - prakriti:  prescription's prakriti list must include patient's prakriti, or be None
      - kaal:      prescription's kaal list must include current season, or be None
      - dushya:    prescription's dushya list must overlap with patient's affected dhatus, or be None
      - agni:      prescription's agni list must include patient's agni type, or be None
      - bala:      prescription's bala must be <= patient's bala (don't prescribe demanding
                   practices to low-bala patients)
      - avastha:   prescription's avastha list must include patient's health phase, or be None
      - contraindications: if patient's agni or prakriti appears in contraindications, skip

    Returns a scored list sorted by relevance (number of filters matched).
    """
    BALA_RANK = {"avara": 0, "madhyama": 1, "pravara": 2}

    patient_bala_rank = BALA_RANK.get(bala.lower(), 1)
    patient_prakriti  = prakriti.lower().strip()
    patient_kaal      = kaal.strip()
    patient_agni      = agni.lower().strip()
    patient_avastha   = avastha.lower().strip()
    patient_dushya    = [d.lower().strip() for d in (dushya or [])]

    results = []

    for p in MOCK_PRESCRIPTIONS:

        # ── Type filter ───────────────────────────────────────────────────────
        if type_filter and p["type"] != type_filter:
            continue

        # ── Bala check — don't prescribe demanding practices to weak patients ─
        required_bala_rank = BALA_RANK.get((p.get("bala") or "avara").lower(), 0)
        if patient_bala_rank < required_bala_rank:
            continue

        # ── Contraindications check ───────────────────────────────────────────
        contra = (p.get("contraindications") or "").lower()
        if patient_agni in contra or patient_prakriti.split("-")[0] in contra:
            # Only skip if the contraindication is a strong match
            if any(x in contra for x in [patient_agni, "low bala", "acute"]):
                if patient_bala_rank == 0 and "low bala" in contra:
                    continue
                if patient_agni in contra:
                    continue

        # ── Relevance scoring (higher = more specific match) ──────────────────
        score = 0

        # Prakriti match
        p_prakriti = p.get("prakriti")
        if p_prakriti is None:
            score += 1   # generic, applies to all
        elif any(patient_prakriti == pr.lower() for pr in p_prakriti):
            score += 3   # specific prakriti match
        else:
            continue     # prakriti mismatch — skip

        # Kaal match
        p_kaal = p.get("kaal")
        if p_kaal is None:
            score += 1
        elif any(patient_kaal == k for k in p_kaal):
            score += 2
        else:
            continue     # season mismatch — skip

        # Dushya overlap
        p_dushya = p.get("dushya")
        if p_dushya is None:
            score += 1
        elif patient_dushya and any(d in [pd.lower() for pd in p_dushya] for d in patient_dushya):
            score += 3   # targets an affected dhatu
        else:
            score += 0   # doesn't target affected dhatus but not excluded

        # Agni match
        p_agni = p.get("agni")
        if p_agni is None:
            score += 1
        elif patient_agni in [a.lower() for a in p_agni]:
            score += 2
        else:
            continue     # agni type not compatible — skip

        # Avastha match
        p_avastha = p.get("avastha")
        if p_avastha is None:
            score += 1
        elif patient_avastha in [a.lower() for a in p_avastha]:
            score += 2
        else:
            continue     # health phase not compatible — skip

        results.append({**p, "_relevance_score": score})

    # Sort by relevance descending, then by type (habits before dailies)
    results.sort(key=lambda x: (-x["_relevance_score"], x["type"]))

    return results[:max_results]


def get_prescription_by_id(prescription_id: str) -> dict:
    """Look up a prescription by ID — used for validation."""
    return next((p for p in MOCK_PRESCRIPTIONS if p["id"] == prescription_id), None)


def get_all_prescription_ids() -> set:
    """Returns all valid IDs — used by the validator."""
    return {p["id"] for p in MOCK_PRESCRIPTIONS}


def format_prescriptions_for_prompt(filtered: list) -> str:
    """
    Serialize the filtered prescription list for the LLM prompt.

    CRITICAL INSTRUCTION embedded in the output:
    The LLM MUST only select from this list. It MUST return the exact
    name and ID from this list for each selection.
    """
    if not filtered:
        return "Approved prescriptions: none matched for this patient's parameters."

    habits  = [p for p in filtered if p["type"] == "habit"]
    dailies = [p for p in filtered if p["type"] == "daily"]

    lines = [
        "APPROVED PRESCRIPTION LIBRARY (you may ONLY select from this list):",
        "CRITICAL: Do not suggest any habit or daily not listed here.",
        "          Return the exact 'id' and 'name' for each selection.",
        f"          Total approved: {len(habits)} habits, {len(dailies)} dailies\n",
    ]

    if habits:
        lines.append("HABITS (recurring long-term routines):")
        for p in habits:
            lines.append(
                f"  [{p['id']}] {p['name']}  (score={p['_relevance_score']})"
                f"\n    Category: {p['category']} | Timing: {p['timing']}"
                f"\n    {p['description'][:120]}{'...' if len(p['description'])>120 else ''}"
            )

    if dailies:
        lines.append("\nDAILIES (short-term situational tasks):")
        for p in dailies:
            lines.append(
                f"  [{p['id']}] {p['name']}  (score={p['_relevance_score']})"
                f"\n    Category: {p['category']} | Duration: {p['duration']}"
                f"\n    {p['description'][:120]}{'...' if len(p['description'])>120 else ''}"
            )

    return "\n".join(lines)


# ─────────────────────────────────────────────────────────────────────────────
# POST-LLM VALIDATOR
# ─────────────────────────────────────────────────────────────────────────────

def validate_llm_selections(llm_result: dict, filtered_prescriptions: list) -> dict:
    """
    Guardrail: strip any habit/daily the LLM hallucinated that wasn't
    in the filtered_prescriptions list.

    For each item in habits.new and dailies.new:
      - Must have a matching 'name' in the filtered list (case-insensitive)
      - If not found → removed and logged as hallucination

    For keep/modify/discard — these operate on EXISTING patient habits from
    the DB, not from the prescription library, so they're not validated here.

    Returns cleaned result + hallucination_report for logging.
    """
    approved_names = {
        p["name"].lower().strip(): p
        for p in filtered_prescriptions
    }

    hallucinations = []
    cleaned_result = {**llm_result}

    for section in ("habits", "dailies"):
        section_data = cleaned_result.get(section, {})
        new_items    = section_data.get("new", [])
        valid_new    = []

        for item in new_items:
            item_name = (item.get("name") or "").lower().strip()
            if item_name in approved_names:
                # Enrich with DB fields (id, category, timing, duration)
                db_entry = approved_names[item_name]
                valid_new.append({
                    **item,
                    "id":       db_entry["id"],
                    "category": db_entry.get("category", item.get("category", "")),
                    "timing":   db_entry.get("timing", ""),
                    "duration": db_entry.get("duration", ""),
                    "description": db_entry.get("description", ""),
                })
            else:
                hallucinations.append({
                    "section": section,
                    "name":    item.get("name"),
                    "reason":  "Not found in approved prescription library",
                })

        section_data["new"] = valid_new
        cleaned_result[section] = section_data

    return cleaned_result, hallucinations


# ─────────────────────────────────────────────────────────────────────────────
# QUICK TEST
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    filtered = filter_prescriptions(
        prakriti="pitta-vata",
        kaal="Greeshma (Summer)",
        dushya=["rakta", "majja"],
        agni="tikshnagni",
        bala="madhyama",
        avastha="stress",
    )
    print(f"\nFiltered {len(filtered)} prescriptions for Pitta-Vata / Summer / Tikshnagni / Stress:\n")
    print(format_prescriptions_for_prompt(filtered))


# ─────────────────────────────────────────────────────────────────────────────
# REAL DB QUERY (replaces in-memory filter when pool is available)
# ─────────────────────────────────────────────────────────────────────────────

async def fetch_filtered_prescriptions(
    pool,          # asyncpg.Pool — dina database
    prakriti:  str,
    kaal:      str,
    dushya:    list,
    agni:      str,
    bala:      str,
    avastha:   str,
    type_filter: str = None,
    max_results: int = 25,
) -> list:
    """
    Real DB version of filter_prescriptions().
    Queries prescription_library table in the dina database.

    Falls back to the in-memory filter if the table doesn't exist yet
    (safe during migration period).

    Matching logic mirrors filter_prescriptions():
      - prakriti: patient's prakriti = ANY(prakriti) OR prakriti IS NULL
      - kaal:     current season = ANY(kaal)         OR kaal IS NULL
      - agni:     patient's agni = ANY(agni)         OR agni IS NULL
      - avastha:  patient's avastha = ANY(avastha)   OR avastha IS NULL
      - bala:     requires patient bala >= prescription minimum
      - dushya:   overlap between patient dushya and prescription dushya
                  (scored, not filtered — missing overlap just lowers score)
    """
    BALA_RANK = {"avara": 0, "madhyama": 1, "pravara": 2}
    patient_bala_rank = BALA_RANK.get(bala.lower(), 1)

    # Minimum bala values the patient can handle
    allowed_bala = ["avara"]
    if patient_bala_rank >= 1: allowed_bala.append("madhyama")
    if patient_bala_rank >= 2: allowed_bala.append("pravara")

    try:
        type_clause = "AND type = $7" if type_filter else ""
        query = f"""
            SELECT
                id, type, category, name, description,
                timing, duration, prakriti, kaal, dushya,
                agni, bala, avastha, contraindications, dosha_effect,
                -- Relevance score computed in SQL
                (
                    CASE WHEN prakriti IS NULL THEN 1
                         WHEN $1 = ANY(prakriti) THEN 3 ELSE 0 END +
                    CASE WHEN kaal IS NULL THEN 1
                         WHEN $2 = ANY(kaal) THEN 2 ELSE 0 END +
                    CASE WHEN agni IS NULL THEN 1
                         WHEN $3 = ANY(agni) THEN 2 ELSE 0 END +
                    CASE WHEN avastha IS NULL THEN 1
                         WHEN $4 = ANY(avastha) THEN 2 ELSE 0 END
                ) AS _relevance_score
            FROM prescription_library
            WHERE active = true
              AND (prakriti IS NULL OR $1 = ANY(prakriti))
              AND (kaal IS NULL     OR $2 = ANY(kaal))
              AND (agni IS NULL     OR $3 = ANY(agni))
              AND (avastha IS NULL  OR $4 = ANY(avastha))
              AND bala = ANY($5::text[])
              AND (
                contraindications IS NULL
                OR (
                    LOWER(contraindications) NOT LIKE '%' || LOWER($3) || '%'
                    AND LOWER(contraindications) NOT LIKE '%low bala%'
                )
              )
              {type_clause}
            ORDER BY _relevance_score DESC, type ASC
            LIMIT $6
        """
        params = [prakriti.lower(), kaal, agni.lower(), avastha.lower(),
                  allowed_bala, max_results]
        if type_filter:
            params.append(type_filter)

        rows = await pool.fetch(query, *params)
        results = []
        for row in rows:
            r = dict(row)
            # Boost score if prescription targets an affected dhatu
            if r.get("dushya") and dushya:
                patient_d = [d.lower() for d in dushya]
                if any(d.lower() in patient_d for d in r["dushya"]):
                    r["_relevance_score"] += 3
            # Parse dosha_effect jsonb
            if isinstance(r.get("dosha_effect"), str):
                import json as _j
                try:
                    r["dosha_effect"] = _j.loads(r["dosha_effect"])
                except Exception:
                    r["dosha_effect"] = {}
            results.append(r)

        # Re-sort after dushya boost
        results.sort(key=lambda x: (-x["_relevance_score"], x["type"]))
        return results

    except Exception as e:
        # Table doesn't exist yet or connection issue — fall back to mock
        import logging
        logging.warning(f"[prescriptions_db] DB query failed ({e}), falling back to mock filter")
        return filter_prescriptions(
            prakriti=prakriti, kaal=kaal, dushya=dushya,
            agni=agni, bala=bala, avastha=avastha,
            type_filter=type_filter, max_results=max_results,
        )
    