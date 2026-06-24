"""
health_score.py
---------------
Calculates the Ayurvedic Arogya health score from the 15-question
self-assessment form.

Weighting philosophy (grounded in Ayurvedic priorities):
  Section 1 — Digestion & Metabolism (Agni & Kosta)     Q1-Q4   → 35%
    Agni (digestive fire) is the root of all health in Ayurveda.
    A compromised Agni underlies virtually every disease.

  Section 2 — Physical Body & Vitality (Sharirika Bala) Q5-Q10  → 30%
    Six questions covering sleep, mobility, pain, energy, thirst,
    and thermoregulation — primary Vata/Pitta/Kapha physical markers.

  Section 3 — Senses, Skin & Speech (Indriya/Upadhatu)  Q11-Q13 → 15%
    Secondary dhatu (tissue) and Indriya indicators. Important but
    downstream of Agni and Bala.

  Section 4 — Mind, Mood & Emotions (Manasika)          Q14-Q15 → 20%
    Higher than Senses because Manasika imbalance (stress, anxiety)
    directly and rapidly aggravates all three doshas.

Score range: 0–100
  90-100  Excellent — well aligned with Prakriti
  75-89   Good      — minor imbalance, manageable
  55-74   Fair      — moderate imbalance, needs attention
  35-54   Poor      — significant imbalance, intervention needed
  0-34    Critical  — severe imbalance, doctor referral warranted

Each question is scored 1–5.
Section raw score = mean of its questions (1.0–5.0).
Section weighted score = raw_score × section_weight.
Total = sum of weighted scores, scaled from [1.0–5.0] → [0–100].
"""

from dataclasses import dataclass, field
from typing import List, Optional

# ─────────────────────────────────────────────────────────────────────────────
# FORM DEFINITION
# ─────────────────────────────────────────────────────────────────────────────

FORM_QUESTIONS = [
    # Section 1: Digestion & Metabolism (Agni & Kosta) — weight 35%
    {"id": "q01", "section": 1, "text": "I feel a clear, strong, and predictable hunger at regular times every day."},
    {"id": "q02", "section": 1, "text": "Within an hour after eating, I feel light, comfortable, and energized (no bloating or heavy sleepiness)."},
    {"id": "q03", "section": 1, "text": "I wake up with a clean, pink tongue that is free of any thick white or yellowish coating."},
    {"id": "q04", "section": 1, "text": "My morning elimination (bowel movement) is smooth, effortless, and happens regularly without any strain."},

    # Section 2: Physical Body & Vitality (Sharirika Bala) — weight 30%
    {"id": "q05", "section": 2, "text": "I fall asleep easily and wake up feeling genuinely refreshed, light, and clear-headed."},
    {"id": "q06", "section": 2, "text": "My physical body feels naturally light, agile, and comfortable to move around in."},
    {"id": "q07", "section": 2, "text": "My muscles and joints are completely free of unexplained aches, random pain, or chronic stiffness."},
    {"id": "q08", "section": 2, "text": "My thirst is normal and easily satisfied; my mouth, throat, and lips rarely feel uncomfortably dry."},
    {"id": "q09", "section": 2, "text": "My energy levels remain steady and sustained throughout the day without sudden afternoon crashes."},
    {"id": "q10", "section": 2, "text": "My body adapts well to temperatures; I sweat moderately during exercise and my hands/feet stay comfortably warm."},

    # Section 3: Senses, Skin & Speech (Indriya & Upadhatu) — weight 15%
    {"id": "q11", "section": 3, "text": "My senses are sharp and clear (stable vision, precise hearing, and a vibrant, accurate sense of taste)."},
    {"id": "q12", "section": 3, "text": "My skin has a healthy, natural glow/luster, and my hair feels rooted and healthy rather than weak or brittle."},
    {"id": "q13", "section": 3, "text": "My voice feels strong, clear, and resonant, and my mind is sharp enough to find the right words easily."},

    # Section 4: Mind, Mood & Emotions (Manasika) — weight 20%
    {"id": "q14", "section": 4, "text": "I approach my daily work, studies, and responsibilities with a natural sense of enthusiasm and drive."},
    {"id": "q15", "section": 4, "text": "I feel emotionally stable, centered, and capable of processing daily stress without feeling easily overwhelmed or anxious."},
]

SECTION_META = {
    1: {"name": "Digestion & Metabolism",         "ayurveda": "Agni & Kosta",        "weight": 0.35, "questions": [1,2,3,4]},
    2: {"name": "Physical Body & Vitality",        "ayurveda": "Sharirika Bala",      "weight": 0.30, "questions": [5,6,7,8,9,10]},
    3: {"name": "Senses, Skin & Speech",           "ayurveda": "Indriya & Upadhatu", "weight": 0.15, "questions": [11,12,13]},
    4: {"name": "Mind, Mood & Emotions",           "ayurveda": "Manasika",            "weight": 0.20, "questions": [14,15]},
}

# Dosha signals per question — which dosha imbalance each low score most indicates
# Used to give the LLM richer context (not used in scoring math)
QUESTION_DOSHA_SIGNAL = {
    "q01": "vata",   # irregular hunger → Vata
    "q02": "pitta",  # post-meal heaviness/acidity → Pitta or Ama
    "q03": "ama",    # tongue coating → Ama (toxin accumulation)
    "q04": "vata",   # constipation/irregularity → Vata
    "q05": "vata",   # poor sleep → Vata
    "q06": "kapha",  # heaviness → Kapha
    "q07": "vata",   # joint pain → Vata
    "q08": "pitta",  # excessive dryness/thirst → Pitta or Vata
    "q09": "pitta",  # energy crashes → Pitta or Agni
    "q10": "pitta",  # temperature dysregulation → Pitta
    "q11": "vata",   # dull senses → Vata
    "q12": "pitta",  # skin/hair issues → Pitta
    "q13": "vata",   # speech/recall → Vata
    "q14": "kapha",  # lack of motivation → Kapha (Tamas)
    "q15": "pitta",  # emotional instability/stress → Pitta (Rajas)
}

SCORE_LABELS = {
    (90, 100): "Excellent",
    (75,  89): "Good",
    (55,  74): "Fair",
    (35,  54): "Poor",
    (0,   34): "Critical",
}


# ─────────────────────────────────────────────────────────────────────────────
# DATA STRUCTURES
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class FormResponse:
    """Raw patient responses to the 15-question form."""
    patient_id:   str
    log_date:     str                        # ISO date string
    answers:      dict                       # {"q01": 3, "q02": 4, ...}
    assessor:     str  = "self"              # "self" | "practitioner"
    notes:        str  = ""


@dataclass
class SectionResult:
    section_id:    int
    name:          str
    ayurveda_name: str
    weight:        float
    raw_score:     float                     # mean of answers in this section (1.0–5.0)
    weighted_score: float                    # raw_score × weight (0.35–5.0 proportional)
    question_scores: dict                    # {"q01": 3, ...}
    weak_questions:  List[str] = field(default_factory=list)   # qids scoring ≤ 2
    strong_questions: List[str] = field(default_factory=list)  # qids scoring == 5


@dataclass
class HealthScoreResult:
    patient_id:       str
    log_date:         str
    health_score:     float                  # 0–100
    label:            str                    # Excellent / Good / Fair / Poor / Critical
    sections:         List[SectionResult]
    weak_areas:       List[str]              # section names with raw_score < 3.0
    strong_areas:     List[str]              # section names with raw_score >= 4.0
    dosha_signals:    dict                   # {"vata": 2, "pitta": 1, ...} weak-q counts
    previous_score:   Optional[float] = None
    delta:            Optional[float] = None # health_score - previous_score
    answers:          dict = field(default_factory=dict)   # raw answers, for LLM prompt


# ─────────────────────────────────────────────────────────────────────────────
# SCORER
# ─────────────────────────────────────────────────────────────────────────────

def calculate_health_score(response: FormResponse, previous_score: Optional[float] = None) -> HealthScoreResult:
    """
    Calculate Ayurveda-weighted health score from a FormResponse.

    Scoring math:
      1. For each section: raw_score = mean(answers for that section)   → 1.0 to 5.0
      2. weighted_score = raw_score × section_weight
      3. total_weighted = sum(all weighted_scores)                       → 1.0 to 5.0
      4. health_score = (total_weighted - 1.0) / (5.0 - 1.0) × 100    → 0 to 100
    """
    answers = response.answers
    section_results = []
    dosha_signal_counts = {"vata": 0, "pitta": 0, "kapha": 0, "ama": 0}

    total_weighted = 0.0

    for sec_id, meta in SECTION_META.items():
        q_ids = [f"q{n:02d}" for n in meta["questions"]]
        q_scores = {qid: float(answers.get(qid, 3)) for qid in q_ids}

        # Clamp all answers to valid range
        q_scores = {qid: max(1.0, min(5.0, v)) for qid, v in q_scores.items()}

        raw_score     = sum(q_scores.values()) / len(q_scores)
        weighted_score = raw_score * meta["weight"]
        total_weighted += weighted_score

        weak_qs   = [qid for qid, v in q_scores.items() if v <= 2]
        strong_qs = [qid for qid, v in q_scores.items() if v == 5]

        # Accumulate dosha signals from weak questions
        for qid in weak_qs:
            signal = QUESTION_DOSHA_SIGNAL.get(qid, "vata")
            if signal in dosha_signal_counts:
                dosha_signal_counts[signal] += 1

        section_results.append(SectionResult(
            section_id=sec_id,
            name=meta["name"],
            ayurveda_name=meta["ayurveda"],
            weight=meta["weight"],
            raw_score=round(raw_score, 3),
            weighted_score=round(weighted_score, 4),
            question_scores=q_scores,
            weak_questions=weak_qs,
            strong_questions=strong_qs,
        ))

    # Scale to 0-100
    health_score = round((total_weighted - 1.0) / (5.0 - 1.0) * 100, 1)
    health_score = max(0.0, min(100.0, health_score))

    # Label
    label = "Good"
    for (lo, hi), lbl in SCORE_LABELS.items():
        if lo <= health_score <= hi:
            label = lbl
            break

    weak_areas   = [s.name for s in section_results if s.raw_score < 3.0]
    strong_areas = [s.name for s in section_results if s.raw_score >= 4.0]

    delta = round(health_score - previous_score, 1) if previous_score is not None else None

    return HealthScoreResult(
        patient_id=response.patient_id,
        log_date=response.log_date,
        health_score=health_score,
        label=label,
        sections=section_results,
        weak_areas=weak_areas,
        strong_areas=strong_areas,
        dosha_signals=dosha_signal_counts,
        previous_score=previous_score,
        delta=delta,
        answers=answers,
    )


def get_score_label(score: float) -> str:
    for (lo, hi), lbl in SCORE_LABELS.items():
        if lo <= score <= hi:
            return lbl
    return "Unknown"


# ─────────────────────────────────────────────────────────────────────────────
# PROMPT SERIALIZER
# Called by run_twin.py to embed form results into LLM prompt
# ─────────────────────────────────────────────────────────────────────────────

def format_form_scores_for_prompt(result: HealthScoreResult) -> str:
    """
    Serialize HealthScoreResult into a compact block for the LLM prompt.
    Gives the model section-level context, weak areas, and dosha signals.
    """
    lines = [
        "Ayurvedic Arogya Self-Assessment (15-question form, last 7-10 days):",
        f"  Overall health score : {result.health_score}/100 ({result.label})",
    ]

    if result.previous_score is not None:
        direction = f"+{result.delta}" if result.delta >= 0 else str(result.delta)
        lines.append(f"  Previous score       : {result.previous_score}/100  (Δ {direction})")

    lines.append("")
    for s in result.sections:
        bar = "█" * int(s.raw_score) + "░" * (5 - int(s.raw_score))
        lines.append(f"  Section {s.section_id}: {s.name} ({s.ayurveda_name})  [weight {int(s.weight*100)}%]")
        lines.append(f"    Score: {s.raw_score:.1f}/5.0  {bar}")

        # Per-question breakdown
        q_lines = []
        for qid, score in s.question_scores.items():
            flag = " ← WEAK" if score <= 2 else (" ← STRONG" if score == 5 else "")
            q_meta = next((q for q in FORM_QUESTIONS if q["id"] == qid), None)
            q_short = q_meta["text"][:70] + "..." if q_meta and len(q_meta["text"]) > 70 else (q_meta["text"] if q_meta else qid)
            q_lines.append(f"      {qid}: {score}/5  {q_short}{flag}")
        lines.extend(q_lines)

    lines.append("")
    if result.weak_areas:
        lines.append(f"  Weak sections  (score < 3.0) : {', '.join(result.weak_areas)}")
    if result.strong_areas:
        lines.append(f"  Strong sections (score ≥ 4.0): {', '.join(result.strong_areas)}")

    # Dosha signals from weak questions
    signals = {d: c for d, c in result.dosha_signals.items() if c > 0}
    if signals:
        signal_str = ", ".join(f"{d.capitalize()} ({c} weak question{'s' if c>1 else ''})" for d, c in sorted(signals.items(), key=lambda x: -x[1]))
        lines.append(f"  Dosha signals from weak Qs   : {signal_str}")

    return "\n".join(lines)


# ─────────────────────────────────────────────────────────────────────────────
# PRETTY PRINT
# ─────────────────────────────────────────────────────────────────────────────

def print_score_report(result: HealthScoreResult):
    print("\n" + "="*68)
    print("  AYURVEDIC AROGYA HEALTH SCORE")
    print(f"  Patient : {result.patient_id}  |  Date: {result.log_date}")
    print("="*68)
    print(f"\n  Overall Score : {result.health_score}/100  [{result.label}]")
    if result.delta is not None:
        arrow = "↑" if result.delta >= 0 else "↓"
        print(f"  Change        : {arrow} {abs(result.delta)} points from previous ({result.previous_score}/100)")

    print(f"\n  {'Section':<38} {'Weight':>7}  {'Score':>7}  {'Trend'}")
    print(f"  {'───────':<38} {'──────':>7}  {'─────':>7}  {'─────'}")
    for s in result.sections:
        bar = "█" * int(s.raw_score) + "░" * (5 - int(s.raw_score))
        print(f"  {s.name + ' (' + s.ayurveda_name + ')':<38} {int(s.weight*100):>6}%  {s.raw_score:>5.1f}/5  {bar}")
        if s.weak_questions:
            weak_labels = [f"Q{q[1:]}" for q in s.weak_questions]
            print(f"    ↳ Weak: {', '.join(weak_labels)}")

    if result.weak_areas:
        print(f"\n  Areas needing attention : {', '.join(result.weak_areas)}")
    if result.strong_areas:
        print(f"  Strong areas            : {', '.join(result.strong_areas)}")

    signals = {d: c for d, c in result.dosha_signals.items() if c > 0}
    if signals:
        print(f"\n  Dosha signals from weak questions:")
        for dosha, count in sorted(signals.items(), key=lambda x: -x[1]):
            print(f"    {dosha.capitalize():10} — {count} weak question{'s' if count > 1 else ''}")

    print("\n" + "="*68 + "\n")


# ─────────────────────────────────────────────────────────────────────────────
# QUICK TEST
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    from datetime import date

    # Simulate Neena's current state — improving but not fully recovered
    test_response = FormResponse(
        patient_id="PT_NEENA_373",
        log_date=str(date.today()),
        answers={
            # Section 1: Digestion — improving, acidity mostly resolved
            "q01": 3, "q02": 3, "q03": 3, "q04": 3,
            # Section 2: Physical — skin improving, energy still low
            "q05": 3, "q06": 3, "q07": 2, "q08": 3, "q09": 3, "q10": 2,
            # Section 3: Senses/Skin — skin still healing
            "q11": 3, "q12": 2, "q13": 3,
            # Section 4: Mind — stress improving
            "q14": 3, "q15": 3,
        },
        notes="14-day post-flare check-in. Shatavari day 6."
    )

    result = calculate_health_score(test_response, previous_score=63.0)
    print_score_report(result)
    print("\nFormatted for LLM prompt:\n")
    print(format_form_scores_for_prompt(result))