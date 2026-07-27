import pool from '@/lib/db';
import jwt from 'jsonwebtoken';

// ---- Sub-score lookups (from Part 3 of the assessment spec) ----

const BALA_SCORES = { excellent: 100, moderate: 60, low: 20 };
const AGNI_SCORES = { balanced: 100, unpredictable: 50, hyperactive: 50, sluggish: 35 };
const SATVA_SCORES = { calm: 100, restless: 60, overwhelmed: 30 };
const SATMYA_SCORES = { high: 100, moderate: 65, restricted: 30 };
const AVASTHA_SCORES = { baseline: 100, recovery: 70, stress: 50, chronic: 30 };

const AHARA_STAPLE_POSITIVE = ['wholesome_grains', 'healthy_fats', 'fresh_produce_dairy'];

const SYMPTOM_QUESTION_IDS = ['q8', 'q9', 'q10', 'q11', 'q12', 'q13', 'q14', 'q15', 'q16', 'q17'];

const FINAL_WEIGHTS = {
  dushya: 0.22,
  bala: 0.18,
  agni: 0.15,
  satva: 0.12,
  satmya: 0.10,
  ahara_char: 0.05,
  ahara_staple: 0.04,
  avastha: 0.06,
  symptom: 0.08,
};

function scoreDushya(answers) {
  const arr = Array.isArray(answers.dushya) ? answers.dushya : [];
  return clamp(100 - (arr.length / 6) * 100);
}

function scoreBala(answers) {
  return BALA_SCORES[answers.bala] ?? 0;
}

function scoreAgni(answers) {
  return AGNI_SCORES[answers.agni] ?? 0;
}

function scoreSatva(answers) {
  return SATVA_SCORES[answers.satva] ?? 0;
}

function scoreSatmya(answers) {
  return SATMYA_SCORES[answers.satmya] ?? 0;
}

function scoreAharaChar(answers) {
  const arr = Array.isArray(answers.ahara_char) ? answers.ahara_char : [];
  const base = arr.includes('warm_fresh') ? 100 : 40;
  const otherCount = arr.filter(v => v !== 'warm_fresh').length;
  return clamp(base - 15 * otherCount);
}

function scoreAharaStaple(answers) {
  const arr = Array.isArray(answers.ahara_staple) ? answers.ahara_staple : [];
  const positiveCount = arr.filter(v => AHARA_STAPLE_POSITIVE.includes(v)).length;
  return clamp(positiveCount * 20);
}

function scoreAvastha(answers) {
  return AVASTHA_SCORES[answers.avastha] ?? 0;
}

function scoreSymptom(answers) {
  const values = SYMPTOM_QUESTION_IDS
    .map(qid => answers[qid])
    .filter(v => typeof v === 'number');

  if (values.length === 0) return 0;

  const sum = values.reduce((s, v) => s + v, 0);
  // Spec formula uses /50 (10 questions * max 5), scaled to however many were actually answered
  const maxPossible = values.length * 5;
  return clamp((sum / maxPossible) * 100);
}

function clamp(n) {
  return Math.max(0, Math.min(100, n));
}

function calculateHealthScore(answers) {
  const subScores = {
    dushya: scoreDushya(answers),
    bala: scoreBala(answers),
    agni: scoreAgni(answers),
    satva: scoreSatva(answers),
    satmya: scoreSatmya(answers),
    ahara_char: scoreAharaChar(answers),
    ahara_staple: scoreAharaStaple(answers),
    avastha: scoreAvastha(answers),
    symptom: scoreSymptom(answers),
  };

  let healthScore = 0;
  const sectionScores = {};

  for (const [key, weight] of Object.entries(FINAL_WEIGHTS)) {
    const raw = subScores[key];
    const weighted = raw * weight;
    sectionScores[key] = {
      raw_score: Math.round(raw * 100) / 100,
      weight,
      weighted_score: Math.round(weighted * 100) / 100,
    };
    healthScore += weighted;
  }

  return {
    sectionScores,
    healthScore: Math.round(healthScore * 100) / 100,
  };
}

export async function POST(req) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const prakriti_id = decoded.prakriti_id;

    const { answers } = await req.json();

    const { sectionScores, healthScore } = calculateHealthScore(answers);

    // Insert new assessment
    const result = await pool.query(
      `INSERT INTO wellness_assessments (user_id, answers, section_scores, total_score)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [prakriti_id, JSON.stringify(answers), JSON.stringify(sectionScores), healthScore]
    );

    // Prune: keep only the 5 most recent by created_at, delete the rest
    // First remove predictions tied to assessments we're about to delete
    await pool.query(
      `DELETE FROM predictions
      WHERE wellness_assessment_id IN (
        SELECT id FROM wellness_assessments
        WHERE user_id = $1
        AND id NOT IN (
          SELECT id FROM wellness_assessments
          WHERE user_id = $1
          ORDER BY created_at DESC
          LIMIT 5
        )
      )`,
      [prakriti_id]
    );

    await pool.query(
      `DELETE FROM wellness_assessments
      WHERE user_id = $1
      AND id NOT IN (
        SELECT id FROM wellness_assessments
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 5
      )`,
      [prakriti_id]
    );

    return Response.json({
      assessment: result.rows[0],
      healthScore,
      sectionScores,
    });

  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query(
      `SELECT * FROM wellness_assessments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`,
      [decoded.prakriti_id]
    );

    return Response.json({ assessments: result.rows });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}