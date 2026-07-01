import pool from '@/lib/db';
import jwt from 'jsonwebtoken';

// GET /api/predictions
// Returns this user's prediction/forecast history (health_score over time)
// for the Overall Health Score Trend chart. Ordered oldest → newest so the
// chart can plot a left-to-right trendline directly from the response.
export async function GET(req) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user_id = decoded.prakriti_id;

    const { searchParams } = new URL(req.url);
    const limitParam = parseInt(searchParams.get('limit') ?? '', 10);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 30;

    const result = await pool.query(
      `SELECT
        id, forecast_date, health_score, previous_score,
        health_interpretation, primary_driver, main_risk,
        doctor_referral, doctor_referral_reason, created_at
      FROM predictions
      WHERE user_id = $1
      ORDER BY forecast_date ASC
      LIMIT $2`,
      [user_id, limit]
    );

    return Response.json({ predictions: result.rows });

  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/predictions
// Inserts a new forecast row (e.g. from a scheduled job / LLM pipeline that
// generates the daily health forecast). Not currently called by the
// Analytics page — only included so the route supports writes if/when your
// prediction-generation process needs to persist results via this endpoint.
export async function POST(req) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user_id = decoded.prakriti_id;

    const body = await req.json();
    const {
      wellness_assessment_id, forecast_date, health_score, previous_score,
      health_interpretation, primary_driver, main_risk,
      habits_verdict, dailies_verdict, high_compliance, low_compliance,
      doctor_referral, doctor_referral_reason, raw_llm_response, model_used
    } = body;

    const result = await pool.query(
      `INSERT INTO predictions (
        user_id, wellness_assessment_id, forecast_date, health_score, previous_score,
        health_interpretation, primary_driver, main_risk,
        habits_verdict, dailies_verdict, high_compliance, low_compliance,
        doctor_referral, doctor_referral_reason, raw_llm_response, model_used
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING *`,
      [
        user_id, wellness_assessment_id, forecast_date, health_score, previous_score,
        health_interpretation, primary_driver, main_risk,
        JSON.stringify(habits_verdict ?? {}),
        JSON.stringify(dailies_verdict ?? {}),
        JSON.stringify(high_compliance ?? {}),
        JSON.stringify(low_compliance ?? {}),
        doctor_referral ?? false, doctor_referral_reason ?? null,
        raw_llm_response ?? null, model_used ?? null
      ]
    );

    return Response.json({ prediction: result.rows[0] });

  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}