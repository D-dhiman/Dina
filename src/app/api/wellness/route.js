import pool from '@/lib/db';
import jwt from 'jsonwebtoken';

const SECTION_WEIGHTS = {
  "Digestion & Metabolism": 0.35,
  "Physical Body & Vitality": 0.30,
  "Mind, Mood & Emotions": 0.20,
  "Senses, Skin & Speech": 0.15,
};

function calculateHealthScore(answers, sectionQuestionMap) {
  let total = 0;
  const sectionScores = {};

  for (const [sectionTitle, questionIds] of Object.entries(sectionQuestionMap)) {
    const values = questionIds.map(qid => answers[qid]).filter(v => v !== undefined);
    const rawScore = values.reduce((sum, v) => sum + v, 0) / values.length; // 1.0 - 5.0
    const weight = SECTION_WEIGHTS[sectionTitle];
    const weightedScore = rawScore * weight;

    sectionScores[sectionTitle] = {
      raw_score: Math.round(rawScore * 100) / 100,
      weight,
      weighted_score: Math.round(weightedScore * 100) / 100,
    };

    total += weightedScore;
  }

  const healthScore = ((total - 1.0) / (5.0 - 1.0)) * 100;

  return {
    sectionScores,
    rawTotal: Math.round(total * 100) / 100,
    healthScore: Math.round(healthScore * 100) / 100,
  };
}

const SECTION_QUESTION_MAP = {
  "Digestion & Metabolism": ["q1", "q2", "q3", "q4"],
  "Physical Body & Vitality": ["q5", "q6", "q7", "q8", "q9", "q10"],
  "Senses, Skin & Speech": ["q11", "q12", "q13"],
  "Mind, Mood & Emotions": ["q14", "q15"],
};

export async function POST(req) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const prakriti_id = decoded.prakriti_id;

    const { answers } = await req.json();

    const { sectionScores, rawTotal, healthScore } = calculateHealthScore(answers, SECTION_QUESTION_MAP);

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
      rawTotal,
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