// src/app/api/daily-completions/route.js

import pool from '@/lib/db';
import jwt from 'jsonwebtoken';

function getUserId(req) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token) throw new Error('Unauthorized');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return decoded.prakriti_id;
}

// GET /api/daily-completions?date=YYYY-MM-DD
export async function GET(req) {
  try {
    const prakriti_id = getUserId(req);
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT daily_id::text, is_completed, completion_date::text
       FROM daily_completions
       WHERE user_id = $1 AND completion_date = $2`,
      [prakriti_id, date]
    );

    return Response.json({ completions: result.rows });
  } catch (err) {
    if (err.message === 'Unauthorized') return Response.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[daily-completions GET]', err.message);
    return Response.json({ error: 'Internal server error', detail: err.message }, { status: 500 });
  }
}

// POST /api/daily-completions
export async function POST(req) {
  try {
    const prakriti_id = getUserId(req);
    const { daily_id, completion_date, is_completed } = await req.json();

    if (!daily_id || !completion_date) {
      return Response.json({ error: 'Missing daily_id or completion_date' }, { status: 400 });
    }

    // null = reset → delete so page reload shows neutral
    if (is_completed === null || is_completed === undefined) {
      await pool.query(
        `DELETE FROM daily_completions
         WHERE user_id = $1 AND daily_id = $2::uuid AND completion_date = $3`,
        [prakriti_id, daily_id, completion_date]
      );
      return Response.json({ completion: null });
    }

    const result = await pool.query(
      `INSERT INTO daily_completions (user_id, daily_id, completion_date, is_completed)
       VALUES ($1, $2::uuid, $3, $4)
       ON CONFLICT (user_id, daily_id, completion_date)
       DO UPDATE SET is_completed = $4, updated_at = CURRENT_TIMESTAMP
       RETURNING daily_id::text, is_completed, completion_date::text`,
      [prakriti_id, daily_id, completion_date, is_completed]
    );

    return Response.json({ completion: result.rows[0] });
  } catch (err) {
    if (err.message === 'Unauthorized') return Response.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[daily-completions POST]', err.message);
    return Response.json({ error: 'Internal server error', detail: err.message }, { status: 500 });
  }
}