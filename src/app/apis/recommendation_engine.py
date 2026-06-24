"""
recommendation_engine.py
------------------------
Pulls rules from the DB for a patient based on:
  - prakriti_id   (from prakriti_map, matched to patient's primary_dosha)
  - ritu_id       (current season, derived from month + city → zone → ritu)
  - age_id        (from age_map, matched to patient's age)
  - gender        (from patient profile)
  - climate_zone_id (from city_zone_map → zone_map)

Then:
  1. Scores each rule by how much it helps/worsens current Vikriti
  2. Classifies each rule as HABIT (recurring) or DAILY (short-term/one-time)
  3. Filters out rules that would worsen the patient's current state
  4. Returns ranked list ready for the LLM prediction engine

The LLM receives these pre-scored, pre-filtered recommendations and uses them
to populate its `habits` and `dailies` output fields — it does NOT invent
recommendations from scratch, it selects and contextualises from this list.

WHEN DB IS CONNECTED:
  Replace mock_fetch_rules() with a real psycopg2 query.
  Everything else (scoring, classification, filtering) stays identical.
"""

from datetime import date
from typing import List, Dict, Optional

# ─────────────────────────────────────────────────────────────────────────────
# LOOKUP MAPS  (mirrors your actual DB tables)
# ─────────────────────────────────────────────────────────────────────────────

# prakriti_map — matches patient's primary_dosha string to prakriti_id
# FIX: added dwandaj, tridoshaj, samadoshaj variants to handle AYUSH PDF terminology
PRAKRITI_MAP = {
    # Single doshas
    "pitta":          "pi",
    "kapha":          "ka",
    "vata":           "va",
    # Dual doshas — both orderings map to the same ID
    "vata-pitta":     "vapi",
    "pitta-vata":     "vapi",
    "vata-kapha":     "vaka",
    "kapha-vata":     "vaka",
    "pitta-kapha":    "pika",
    "kapha-pitta":    "pika",
    # Tridoshic / balanced
    "samadoshaj":     "sama",
    "sama":           "sama",
    "tridoshic":      "sama",
    "tridoshaj":      "sama",
    # AYUSH PDF terminology (Dwandaj = dual-dosha constitution)
    "dwandaj":        "sama",   # generic fallback if no specific dosha given with it
    "pitta-vata (dwandaj)": "vapi",
    "vata-pitta (dwandaj)": "vapi",
    "pitta-kapha (dwandaj)": "pika",
    "kapha-pitta (dwandaj)": "pika",
    "vata-kapha (dwandaj)":  "vaka",
    "kapha-vata (dwandaj)":  "vaka",
}

# ritu_map — Indian seasons
RITU_MAP = {
    "shis": "Shishir (late winter)",
    "vas":  "Vasant (spring)",
    "gree": "Greeshm (summer)",
    "var":  "Varsha (monsoon)",
    "shar": "Sharad (autumn)",
    "hem":  "Hemant (early winter)",
}

# Month → ritu_id mapping (approximate, adjust for your region)
MONTH_TO_RITU = {
    1: "shis", 2: "shis",          # Jan-Feb: Shishir
    3: "vas",  4: "vas",           # Mar-Apr: Vasant
    5: "gree", 6: "gree",          # May-Jun: Greeshm
    7: "var",  8: "var",           # Jul-Aug: Varsha
    9: "shar", 10: "shar",         # Sep-Oct: Sharad
    11: "hem", 12: "hem",          # Nov-Dec: Hemant
}

# advice_type_map
ADVICE_TYPE_MAP = {
    "f":     "food",
    "fna":   "food_not_allowed",
    "pro":   "procedures",
    "prona": "procedures_not_allowed",
    "exer":  "exercise",
    "exerna":"exercise_not_allowed",
}

# Which advice_ids are BENEFICIAL vs HARMFUL (avoidance)
BENEFICIAL_ADVICE = {"f", "pro", "exer"}
HARMFUL_ADVICE    = {"fna", "prona", "exerna"}

# age_map — returns age_id for a given age
def get_age_id(age: int) -> str:
    brackets = [0,6,11,21,31,41,51,61,71,81,91,101]
    ids      = ["0","1","2","3","4","5","6","7","8","9","10","11"]
    for i in range(len(brackets)-1, -1, -1):
        if age >= brackets[i]:
            return ids[i]
    return "0"


# ─────────────────────────────────────────────────────────────────────────────
# DOSHA IMPACT SCORING
# Tells us how much each advice_type affects each dosha
# Built from Ayurvedic literature — tunable
# ─────────────────────────────────────────────────────────────────────────────

# How each rule keyword affects doshas (positive = increases, negative = pacifies)
# Used to score whether a rule helps or worsens the patient's current imbalance
KEYWORD_DOSHA_IMPACT = {
    # Vata-pacifying keywords (these REDUCE Vata — good if Vata is elevated)
    "warm":        {"vata": -0.3, "pitta":  0.1, "kapha":  0.1},
    "oil":         {"vata": -0.4, "pitta":  0.0, "kapha":  0.2},
    "ghee":        {"vata": -0.3, "pitta":  0.1, "kapha":  0.2},
    "sesame":      {"vata": -0.3, "pitta":  0.0, "kapha":  0.1},
    "grounding":   {"vata": -0.3, "pitta":  0.0, "kapha":  0.0},
    "routine":     {"vata": -0.2, "pitta":  0.0, "kapha":  0.0},
    "rest":        {"vata": -0.2, "pitta": -0.1, "kapha":  0.2},
    "sleep":       {"vata": -0.2, "pitta": -0.1, "kapha":  0.1},
    "sweet":       {"vata": -0.2, "pitta": -0.1, "kapha":  0.3},
    "soup":        {"vata": -0.3, "pitta":  0.0, "kapha":  0.1},
    "massage":     {"vata": -0.4, "pitta": -0.1, "kapha":  0.1},

    # Pitta-pacifying keywords (these REDUCE Pitta — good if Pitta is elevated)
    "cool":        {"vata":  0.0, "pitta": -0.4, "kapha":  0.1},
    "cold":        {"vata":  0.1, "pitta": -0.3, "kapha":  0.1},
    "coconut":     {"vata":  0.0, "pitta": -0.3, "kapha":  0.1},
    "coriander":   {"vata":  0.0, "pitta": -0.3, "kapha":  0.0},
    "fennel":      {"vata":  0.0, "pitta": -0.3, "kapha":  0.0},
    "cucumber":    {"vata":  0.0, "pitta": -0.3, "kapha":  0.0},
    "mint":        {"vata":  0.0, "pitta": -0.3, "kapha":  0.0},
    "meditation":  {"vata": -0.1, "pitta": -0.3, "kapha":  0.0},
    "moonlight":   {"vata":  0.0, "pitta": -0.2, "kapha":  0.0},
    "bitter":      {"vata":  0.1, "pitta": -0.2, "kapha": -0.1},
    "astringent":  {"vata":  0.1, "pitta": -0.2, "kapha": -0.1},

    # Kapha-pacifying keywords
    "light":       {"vata":  0.1, "pitta":  0.0, "kapha": -0.3},
    "dry":         {"vata":  0.2, "pitta":  0.0, "kapha": -0.3},
    "spicy":       {"vata": -0.1, "pitta":  0.4, "kapha": -0.3},
    "ginger":      {"vata": -0.1, "pitta":  0.2, "kapha": -0.3},
    "exercise":    {"vata":  0.1, "pitta":  0.1, "kapha": -0.4},
    "vigorous":    {"vata":  0.2, "pitta":  0.2, "kapha": -0.4},
    "fasting":     {"vata":  0.3, "pitta":  0.1, "kapha": -0.3},
    "honey":       {"vata":  0.0, "pitta":  0.0, "kapha": -0.3},

    # Vata-aggravating keywords (avoid if Vata elevated)
    "raw":         {"vata":  0.3, "pitta":  0.0, "kapha": -0.1},
    "cold food":   {"vata":  0.3, "pitta": -0.2, "kapha":  0.1},
    "irregular":   {"vata":  0.4, "pitta":  0.0, "kapha":  0.0},
    "travel":      {"vata":  0.3, "pitta":  0.0, "kapha":  0.0},
    "wind":        {"vata":  0.3, "pitta":  0.0, "kapha":  0.0},

    # Pitta-aggravating keywords (avoid if Pitta elevated)
    "hot":         {"vata": -0.1, "pitta":  0.4, "kapha": -0.1},
    "sour":        {"vata": -0.1, "pitta":  0.3, "kapha":  0.0},
    "fermented":   {"vata":  0.0, "pitta":  0.3, "kapha":  0.0},
    "alcohol":     {"vata":  0.1, "pitta":  0.4, "kapha":  0.0},
    "sunlight":    {"vata":  0.0, "pitta":  0.3, "kapha": -0.1},
    "anger":       {"vata":  0.1, "pitta":  0.4, "kapha":  0.0},
}


# ─────────────────────────────────────────────────────────────────────────────
# HABIT vs DAILY CLASSIFICATION
# ─────────────────────────────────────────────────────────────────────────────

# Keywords that suggest a HABIT (recurring, long-term routine)
HABIT_KEYWORDS = [
    "daily", "every day", "morning", "night", "evening", "routine",
    "regular", "always", "practice", "massage", "meditation", "yoga",
    "walk", "sleep", "wake", "meal time", "drink", "eat",
]

# Keywords that suggest a DAILY (short-term, situational, one-time)
DAILY_KEYWORDS = [
    "avoid", "reduce", "limit", "stop", "during", "this season",
    "when", "if", "apply", "take", "use", "compress", "fast",
    "detox", "cleanse",
]

def classify_rule(rule_text: str, advice_id: str) -> str:
    """
    Classify a rule as 'habit' (recurring routine) or 'daily' (short-term task).
    Uses advice_type + keywords in the rule text.
    """
    rule_lower = rule_text.lower()

    # "not allowed" types are always dailies — they're constraints, not routines
    if advice_id in HARMFUL_ADVICE:
        return "daily"

    # Exercise and procedures tend to be habits
    if advice_id in ("exer", "pro"):
        habit_score = sum(1 for k in HABIT_KEYWORDS if k in rule_lower)
        if habit_score >= 1:
            return "habit"

    # Food rules — check keywords
    habit_score = sum(1 for k in HABIT_KEYWORDS if k in rule_lower)
    daily_score = sum(1 for k in DAILY_KEYWORDS if k in rule_lower)

    return "habit" if habit_score >= daily_score else "daily"


# ─────────────────────────────────────────────────────────────────────────────
# RULE SCORER
# ─────────────────────────────────────────────────────────────────────────────

def score_rule(
    rule_text: str,
    advice_id: str,
    current_vata: float,
    current_pitta: float,
    current_kapha: float,
    baseline_vata: float,
    baseline_pitta: float,
    baseline_kapha: float,
) -> float:
    """
    Score a rule based on how much it helps correct the current dosha imbalance.

    Positive score = rule helps (reduces excess doshas toward baseline)
    Negative score = rule worsens (pushes already-elevated doshas higher)

    Returns a float between -1.0 and +1.0
    """
    # Excess deviation from baseline (positive = elevated above baseline)
    excess_vata  = current_vata  - baseline_vata
    excess_pitta = current_pitta - baseline_pitta
    excess_kapha = current_kapha - baseline_kapha

    # Scan rule text for impact keywords
    rule_lower = rule_text.lower()
    total_impact = {"vata": 0.0, "pitta": 0.0, "kapha": 0.0}

    for keyword, impact in KEYWORD_DOSHA_IMPACT.items():
        if keyword in rule_lower:
            for dosha, val in impact.items():
                total_impact[dosha] += val

    # If it's a "not allowed" rule, flip the impact
    # (we're computing the impact of DOING the thing — fna means don't do it,
    #  so the actual impact on the patient if they follow this rule is the opposite)
    if advice_id in HARMFUL_ADVICE:
        total_impact = {d: -v for d, v in total_impact.items()}

    # Score = how much this rule corrects the excess
    # If Vata is elevated (+10) and rule reduces Vata (-0.4), that's good: 10 * 0.4 = +4
    # If Vata is elevated (+10) and rule increases Vata (+0.3), that's bad: 10 * -0.3 = -3
    score = (
        excess_vata  * (-total_impact["vata"])  +
        excess_pitta * (-total_impact["pitta"]) +
        excess_kapha * (-total_impact["kapha"])
    )

    # Normalize to -1 to +1 range
    max_possible = max(abs(excess_vata) + abs(excess_pitta) + abs(excess_kapha), 1.0)
    return round(score / max_possible, 3)


# ─────────────────────────────────────────────────────────────────────────────
# MOCK RULES FETCH
# Replace this with real psycopg2 query when DB is connected
# ─────────────────────────────────────────────────────────────────────────────

def mock_fetch_rules(
    prakriti_id: str,
    ritu_id: str,
    age_id: str,
    gender: str,
    climate_zone_id: Optional[str] = None,  # TODO: wire into filter when DB is ready
) -> List[Dict]:
    """
    Mock version of the DB query.

    REAL DB (replace this entire function body):
        SELECT r.rule_id, r.rule, r.advice_id, r.extra_constraints,
               atm.advice_type
        FROM rules r
        JOIN advice_type_map atm ON r.advice_id = atm.advice_id
        WHERE (r.prakriti_id = %s OR r.prakriti_id IS NULL)
          AND (r.ritu_id = %s OR r.ritu_id IS NULL)
          AND (r.age_id = %s OR r.age_id IS NULL)
          AND (r.gender = %s OR r.gender IS NULL)
          AND (r.climate_zone_id = %s OR r.climate_zone_id IS NULL)
        ORDER BY
          (r.prakriti_id IS NOT NULL) DESC,
          (r.ritu_id IS NOT NULL) DESC,
          (r.age_id IS NOT NULL) DESC

    The ORDER BY ensures most specific rules (matching all filters) come first.
    """
    # Mock rules matching Neena's profile: Pitta-Vata, Greeshm (summer), age 27, Female
    return [
        # ── FOOD ALLOWED (f) ──
        {"rule_id":"R001","rule":"Consume cooling foods like cucumber, coconut water and mint during summer morning routine","advice_id":"f","prakriti_id":"vapi","ritu_id":"gree","age_id":"3","gender":None,"extra_constraints":None},
        {"rule_id":"R002","rule":"Include sweet and bitter tastes in daily meals — amla, pomegranate, leafy greens","advice_id":"f","prakriti_id":"vapi","ritu_id":"gree","age_id":None,"gender":None,"extra_constraints":None},
        {"rule_id":"R003","rule":"Drink warm milk with cardamom at night to nourish Vata and calm nervous system","advice_id":"f","prakriti_id":"vapi","ritu_id":None,"age_id":None,"gender":None,"extra_constraints":None},
        {"rule_id":"R004","rule":"Take CCF tea (coriander cumin fennel) every evening to support digestion and cool Pitta","advice_id":"f","prakriti_id":"vapi","ritu_id":"gree","age_id":None,"gender":None,"extra_constraints":None},
        {"rule_id":"R005","rule":"Eat meals at fixed times daily — breakfast by 8am, lunch by 1pm, dinner by 7pm","advice_id":"f","prakriti_id":"vapi","ritu_id":None,"age_id":None,"gender":None,"extra_constraints":None},
        {"rule_id":"R006","rule":"Include ghee in daily diet — 1 tsp with meals to lubricate and ground Vata","advice_id":"f","prakriti_id":"va","ritu_id":None,"age_id":None,"gender":None,"extra_constraints":None},
        {"rule_id":"R007","rule":"Drink coconut water daily in summer to replenish electrolytes and reduce Pitta heat","advice_id":"f","prakriti_id":None,"ritu_id":"gree","age_id":None,"gender":None,"extra_constraints":None},
        {"rule_id":"R008","rule":"Consume fennel seeds after meals every day to improve digestion and reduce acidity","advice_id":"f","prakriti_id":"vapi","ritu_id":None,"age_id":None,"gender":None,"extra_constraints":None},

        # ── FOOD NOT ALLOWED (fna) ──
        {"rule_id":"R009","rule":"Avoid hot spicy fermented and sour foods during summer — they sharply aggravate Pitta","advice_id":"fna","prakriti_id":"vapi","ritu_id":"gree","age_id":None,"gender":None,"extra_constraints":None},
        {"rule_id":"R010","rule":"Avoid skipping meals — irregular eating is the primary cause of Vata aggravation","advice_id":"fna","prakriti_id":"vapi","ritu_id":None,"age_id":None,"gender":None,"extra_constraints":None},
        {"rule_id":"R011","rule":"Avoid raw cold food from refrigerator — disturbs digestive fire and increases Vata","advice_id":"fna","prakriti_id":"va","ritu_id":None,"age_id":None,"gender":None,"extra_constraints":None},
        {"rule_id":"R012","rule":"Reduce alcohol and caffeine intake — both aggravate Pitta and disturb sleep","advice_id":"fna","prakriti_id":"vapi","ritu_id":None,"age_id":None,"gender":None,"extra_constraints":None},

        # ── PROCEDURES (pro) ──
        {"rule_id":"R013","rule":"Apply cool coconut oil or sandalwood paste on skin daily during summer for Pitta skin conditions","advice_id":"pro","prakriti_id":"vapi","ritu_id":"gree","age_id":None,"gender":"F","extra_constraints":"skin condition"},
        {"rule_id":"R014","rule":"Practice Sheetali pranayama (cooling breath) every morning for 10 minutes to reduce Pitta","advice_id":"pro","prakriti_id":"vapi","ritu_id":"gree","age_id":None,"gender":None,"extra_constraints":None},
        {"rule_id":"R015","rule":"Do warm sesame oil self-massage (Abhyanga) twice weekly to ground Vata and nourish joints","advice_id":"pro","prakriti_id":"vapi","ritu_id":None,"age_id":None,"gender":None,"extra_constraints":None},
        {"rule_id":"R016","rule":"Sleep before 10:30pm daily — staying up late is the single biggest aggravator of Vata","advice_id":"pro","prakriti_id":"vapi","ritu_id":None,"age_id":None,"gender":None,"extra_constraints":None},
        {"rule_id":"R017","rule":"Apply cold compress on inflamed skin areas every evening during active skin flare","advice_id":"pro","prakriti_id":None,"ritu_id":"gree","age_id":None,"gender":None,"extra_constraints":"skin condition"},
        {"rule_id":"R018","rule":"Practice 15 minutes of meditation or mindfulness daily to manage stress and Pitta","advice_id":"pro","prakriti_id":"vapi","ritu_id":None,"age_id":"3","gender":None,"extra_constraints":None},

        # ── PROCEDURES NOT ALLOWED (prona) ──
        {"rule_id":"R019","rule":"Avoid direct sunlight exposure between 11am and 4pm during summer — severely aggravates Pitta and skin","advice_id":"prona","prakriti_id":"vapi","ritu_id":"gree","age_id":None,"gender":None,"extra_constraints":None},
        {"rule_id":"R020","rule":"Avoid overworking or excessive screen time without breaks — aggravates Vata and Pitta simultaneously","advice_id":"prona","prakriti_id":"vapi","ritu_id":None,"age_id":"3","gender":None,"extra_constraints":"desk job"},

        # ── EXERCISE (exer) ──
        {"rule_id":"R021","rule":"Walk briskly for 30 minutes every morning before 7am — grounding for Vata, avoids summer heat","advice_id":"exer","prakriti_id":"vapi","ritu_id":"gree","age_id":None,"gender":None,"extra_constraints":None},
        {"rule_id":"R022","rule":"Practice gentle yoga daily — Shavasana, Viparita Karani, and forward folds are ideal for Pitta-Vata","advice_id":"exer","prakriti_id":"vapi","ritu_id":None,"age_id":None,"gender":None,"extra_constraints":None},
        {"rule_id":"R023","rule":"Swimming or water-based exercise twice weekly is ideal in summer for Pitta-Vata types","advice_id":"exer","prakriti_id":"vapi","ritu_id":"gree","age_id":None,"gender":None,"extra_constraints":None},

        # ── EXERCISE NOT ALLOWED (exerna) ──
        {"rule_id":"R024","rule":"Avoid vigorous high-intensity exercise during peak summer heat — rapidly worsens Pitta and dehydrates","advice_id":"exerna","prakriti_id":"vapi","ritu_id":"gree","age_id":None,"gender":None,"extra_constraints":None},
        {"rule_id":"R025","rule":"Avoid exercising to exhaustion — Vata types have limited stamina and overexertion depletes Ojas","advice_id":"exerna","prakriti_id":"va","ritu_id":None,"age_id":None,"gender":None,"extra_constraints":None},
    ]


# ─────────────────────────────────────────────────────────────────────────────
# MAIN ENGINE
# ─────────────────────────────────────────────────────────────────────────────

class RecommendationEngine:
    """
    Fetches rules from DB, scores them, classifies as habit/daily,
    filters out anything that worsens current dosha state.

    Output is passed directly into the LLM prompt — the LLM selects from
    these pre-scored recommendations and surfaces them in its habits/dailies
    output fields rather than generating recommendations from scratch.
    """

    def get_ritu_id(self) -> str:
        """Get current ritu_id from current month."""
        return MONTH_TO_RITU.get(date.today().month, "gree")

    def get_prakriti_id(self, primary_dosha: str) -> str:
        """
        Map patient's primary_dosha string to prakriti_id.
        FIX: lowercases and strips whitespace before lookup so AYUSH PDF
        strings like 'Pitta-Vata (Dwandaj)' are handled correctly.
        """
        cleaned = primary_dosha.lower().strip()
        if cleaned in PRAKRITI_MAP:
            return PRAKRITI_MAP[cleaned]
        # Fallback: try matching just the first part before any parenthesis
        base = cleaned.split("(")[0].strip()
        return PRAKRITI_MAP.get(base, "sama")

    def run(
        self,
        user: dict,
        current_vata: float,
        current_pitta: float,
        current_kapha: float,
        top_n: int = 10,
        score_threshold: float = 0.0,  # FIX: was -0.1, which let mildly harmful rules through
    ) -> dict:
        """
        Generate scored, classified recommendations for a patient.

        Args:
            user: Patient dict from DB (needs primary_dosha, dosha_vata/pitta/kapha, age, gender)
            current_vata/pitta/kapha: Today's reassessed dosha values
            top_n: Max recommendations to return per category
            score_threshold: Minimum score to include — 0.0 means only rules
                             that genuinely help (or are neutral) are passed to the LLM

        Returns:
            Dict with 'habits', 'dailies', 'avoided' lists + summary metadata
        """
        prakriti_id = self.get_prakriti_id(user["primary_dosha"])
        ritu_id     = self.get_ritu_id()
        age         = (date.today() - date.fromisoformat(user["date_of_birth"])).days // 365
        age_id      = get_age_id(age)
        gender      = user["gender"]

        baseline_v  = user["dosha_vata"]
        baseline_p  = user["dosha_pitta"]
        baseline_k  = user["dosha_kapha"]

        # ── 1. Fetch rules ──
        raw_rules = mock_fetch_rules(prakriti_id, ritu_id, age_id, gender)

        # ── 2. Score + classify each rule ──
        scored  = []
        avoided = []

        for rule in raw_rules:
            score = score_rule(
                rule["rule"], rule["advice_id"],
                current_vata, current_pitta, current_kapha,
                baseline_v, baseline_p, baseline_k,
            )
            rule_type    = classify_rule(rule["rule"], rule["advice_id"])
            advice_label = ADVICE_TYPE_MAP.get(rule["advice_id"], rule["advice_id"])
            is_avoidance = rule["advice_id"] in HARMFUL_ADVICE

            entry = {
                "rule_id":           rule["rule_id"],
                "rule":              rule["rule"],
                "advice_id":         rule["advice_id"],
                "advice_type":       advice_label,
                "type":              rule_type,      # "habit" or "daily"
                "score":             score,
                "is_avoidance":      is_avoidance,   # True = "don't do this"
                "extra_constraints": rule.get("extra_constraints"),
            }

            # ── 3. Filter: skip beneficial rules that would worsen the patient ──
            # Avoidance rules (fna/prona/exerna) always pass through — the LLM
            # needs to know what to tell the patient to avoid regardless of score.
            if score < score_threshold and not is_avoidance:
                entry["skip_reason"] = f"Score {score:.3f} below threshold — would worsen current state"
                avoided.append(entry)
                continue

            scored.append(entry)

        # ── 4. Sort by score descending ──
        scored.sort(key=lambda x: x["score"], reverse=True)

        # ── 5. Split into habits and dailies ──
        habits  = [r for r in scored if r["type"] == "habit"][:top_n]
        dailies = [r for r in scored if r["type"] == "daily"][:top_n]

        # ── 6. Build summary ──
        dominant_excess = max(
            [("Vata",  current_vata  - baseline_v),
             ("Pitta", current_pitta - baseline_p),
             ("Kapha", current_kapha - baseline_k)],
            key=lambda x: x[1]
        )

        return {
            "patient_id":          user["prakriti_id"],
            "prakriti_id":         prakriti_id,
            "ritu_id":             ritu_id,
            "ritu_name":           RITU_MAP.get(ritu_id, ritu_id),
            "age_id":              age_id,
            "current_doshas":      {"vata": current_vata, "pitta": current_pitta, "kapha": current_kapha},
            "baseline_doshas":     {"vata": baseline_v,   "pitta": baseline_p,    "kapha": baseline_k},
            "dominant_excess":     dominant_excess[0],
            "habits":              habits,
            "dailies":             dailies,
            "avoided":             avoided,
            "total_rules_fetched": len(raw_rules),
            "total_recommended":   len(habits) + len(dailies),
            "total_avoided":       len(avoided),
        }

    def _score_and_classify(
        self, raw_rules: list,
        current_vata: float, current_pitta: float, current_kapha: float,
        baseline_v: float, baseline_p: float, baseline_k: float,
        top_n: int, score_threshold: float,
    ) -> tuple:
        """
        Shared scoring/classification/filtering logic used by both run() and
        run_async(). Takes raw rule rows (mock or real DB) and returns
        (habits, dailies, avoided) lists. Keeping this separate means the
        scoring math only needs to be maintained in one place.
        """
        scored  = []
        avoided = []

        for rule in raw_rules:
            score        = score_rule(
                rule["rule"], rule["advice_id"],
                current_vata, current_pitta, current_kapha,
                baseline_v, baseline_p, baseline_k,
            )
            rule_type    = classify_rule(rule["rule"], rule["advice_id"])
            advice_label = ADVICE_TYPE_MAP.get(rule["advice_id"], rule["advice_id"])
            is_avoidance = rule["advice_id"] in HARMFUL_ADVICE

            entry = {
                "rule_id":           rule["rule_id"],
                "rule":              rule["rule"],
                "advice_id":         rule["advice_id"],
                "advice_type":       advice_label,
                "type":              rule_type,
                "score":             score,
                "is_avoidance":      is_avoidance,
                "extra_constraints": rule.get("extra_constraints"),
            }

            if score < score_threshold and not is_avoidance:
                entry["skip_reason"] = f"Score {score:.3f} below threshold"
                avoided.append(entry)
                continue

            scored.append(entry)

        scored.sort(key=lambda x: x["score"], reverse=True)
        habits  = [r for r in scored if r["type"] == "habit"][:top_n]
        dailies = [r for r in scored if r["type"] == "daily"][:top_n]
        return habits, dailies, avoided

    async def run_async(
        self,
        user: dict,
        current_vata: float,
        current_pitta: float,
        current_kapha: float,
        city: Optional[str] = None,
        top_n: int = 10,
        score_threshold: float = 0.0,
    ) -> dict:
        """
        ASYNC version — connects to aura_wellness DB via rules_db.get_rules_pool()
        and fetches real rules. Use this in the FastAPI route.

        Args:
            user : patient dict (primary_dosha, dosha_vata/pitta/kapha, date_of_birth, gender)
            city : patient's city string, used to resolve climate zone via city_zone_map.
                   If None or unmapped, zone-agnostic rules still match.
        """
        from rules_db import (
            get_rules_pool, get_prakriti_id_for_dosha, resolve_climate_zone,
            get_current_ritu_id, get_age_brackets, get_age_id_sync,
            fetch_rules, get_climate_context,
        )

        pool = await get_rules_pool()

        prakriti_id = await get_prakriti_id_for_dosha(pool, user["primary_dosha"])
        zone_id     = await resolve_climate_zone(pool, city)
        ritu_id     = await get_current_ritu_id(pool, zone_id)

        dob = user["date_of_birth"]
        dob_date = dob if hasattr(dob, "year") else date.fromisoformat(str(dob))
        age      = (date.today() - dob_date).days // 365
        brackets = await get_age_brackets(pool)
        age_id   = get_age_id_sync(age, brackets)

        baseline_v = user["dosha_vata"]
        baseline_p = user["dosha_pitta"]
        baseline_k = user["dosha_kapha"]

        raw_rules       = await fetch_rules(pool, prakriti_id, ritu_id, age_id, user["gender"], zone_id)
        climate_context = await get_climate_context(pool, zone_id, ritu_id)

        habits, dailies, avoided = self._score_and_classify(
            raw_rules, current_vata, current_pitta, current_kapha,
            baseline_v, baseline_p, baseline_k, top_n, score_threshold,
        )

        dominant_excess = max(
            [("Vata",  current_vata  - baseline_v),
             ("Pitta", current_pitta - baseline_p),
             ("Kapha", current_kapha - baseline_k)],
            key=lambda x: x[1]
        )

        return {
            "patient_id":          user["prakriti_id"],
            "prakriti_id":         prakriti_id,
            "ritu_id":             ritu_id,
            "ritu_name":           RITU_MAP.get(ritu_id, ritu_id),
            "age_id":              age_id,
            "climate_zone_id":     zone_id,
            "climate_context":     climate_context,
            "current_doshas":      {"vata": current_vata, "pitta": current_pitta, "kapha": current_kapha},
            "baseline_doshas":     {"vata": baseline_v,   "pitta": baseline_p,    "kapha": baseline_k},
            "dominant_excess":     dominant_excess[0],
            "habits":              habits,
            "dailies":             dailies,
            "avoided":             avoided,
            "total_rules_fetched": len(raw_rules),
            "total_recommended":   len(habits) + len(dailies),
            "total_avoided":       len(avoided),
        }


# ─────────────────────────────────────────────────────────────────────────────
# SERIALIZER HELPER
# Called by run_twin.py to format recommendations for the LLM prompt
# ─────────────────────────────────────────────────────────────────────────────

def format_recommendations_for_prompt(recs: dict) -> str:
    """
    Convert recommendation engine output into a compact prompt block.
    The LLM reads this, selects the most relevant items, and outputs
    them in its habits[] and dailies[] JSON fields.
    """
    lines = [
        f"Rule-based recommendations (pre-scored for this patient's current Vikriti):",
        f"  Season: {recs['ritu_name']}  |  Primary imbalance: {recs['dominant_excess']} elevated",
        f"  Source: {recs['total_rules_fetched']} rules fetched → {recs['total_recommended']} passed filter\n",
    ]

    if recs["habits"]:
        lines.append("  RECOMMENDED HABITS (recurring routines — include top ones in habits[] output):")
        for r in recs["habits"]:
            tag = "[AVOID]" if r["is_avoidance"] else "[DO]   "
            lines.append(f"    {tag} [{r['advice_type']:<22}] score={r['score']:+.2f}  {r['rule']}")

    if recs["dailies"]:
        lines.append("\n  RECOMMENDED DAILIES (short-term / situational — include top ones in dailies[] output):")
        for r in recs["dailies"]:
            tag = "[AVOID]" if r["is_avoidance"] else "[DO]   "
            lines.append(f"    {tag} [{r['advice_type']:<22}] score={r['score']:+.2f}  {r['rule']}")

    if recs["avoided"]:
        lines.append(f"\n  SKIPPED ({len(recs['avoided'])} rules filtered — would worsen patient, do NOT recommend these):")
        for r in recs["avoided"]:
            lines.append(f"    ✗ [{r['advice_type']:<22}]  {r['rule'][:80]}")

    return "\n".join(lines)


# ─────────────────────────────────────────────────────────────────────────────
# PRETTY PRINT
# ─────────────────────────────────────────────────────────────────────────────

def print_recommendations(result: dict):
    print("\n" + "="*68)
    print("  RECOMMENDATION ENGINE OUTPUT")
    print(f"  Patient    : {result['patient_id']}")
    print(f"  Prakriti   : {result['prakriti_id']}  |  Season: {result['ritu_name']}")
    print(f"  Current    : V={result['current_doshas']['vata']} P={result['current_doshas']['pitta']} K={result['current_doshas']['kapha']}")
    print(f"  Baseline   : V={result['baseline_doshas']['vata']} P={result['baseline_doshas']['pitta']} K={result['baseline_doshas']['kapha']}")
    print(f"  Primary imbalance: {result['dominant_excess']} elevated")
    print("="*68)

    print(f"\n  HABITS ({len(result['habits'])} recommended — recurring routines)\n")
    for i, r in enumerate(result["habits"], 1):
        tag = "[AVOID]" if r["is_avoidance"] else "[DO]   "
        print(f"  {i:2}. {tag} [{r['advice_type']:<22}] score={r['score']:+.2f}")
        print(f"      {r['rule'][:90]}{'...' if len(r['rule'])>90 else ''}")

    print(f"\n  DAILIES ({len(result['dailies'])} recommended — short-term / situational)\n")
    for i, r in enumerate(result["dailies"], 1):
        tag = "[AVOID]" if r["is_avoidance"] else "[DO]   "
        print(f"  {i:2}. {tag} [{r['advice_type']:<22}] score={r['score']:+.2f}")
        print(f"      {r['rule'][:90]}{'...' if len(r['rule'])>90 else ''}")

    if result["avoided"]:
        print(f"\n  SKIPPED ({len(result['avoided'])} rules filtered out — would worsen patient)\n")
        for r in result["avoided"]:
            print(f"      ✗ [{r['advice_type']:<22}] {r['rule'][:70]}...")

    print(f"\n  Fetched {result['total_rules_fetched']} rules → "
          f"{result['total_recommended']} recommended, {result['total_avoided']} skipped")
    print("="*68 + "\n")


if __name__ == "__main__":
    # Test with Neena's profile
    from mock_db import get_user, get_latest_log

    user = get_user("PT_NEENA_373")
    log  = get_latest_log("PT_NEENA_373")

    engine = RecommendationEngine()
    result = engine.run(
        user=user,
        current_vata=log["current_vata"],
        current_pitta=log["current_pitta"],
        current_kapha=log["current_kapha"],
    )
    print_recommendations(result)
    print("\nFormatted for LLM prompt:\n")
    print(format_recommendations_for_prompt(result))