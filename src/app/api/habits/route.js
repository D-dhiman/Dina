import pool from '@/lib/db';
import jwt from 'jsonwebtoken';

function getPrakritiId(req) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token) {
    throw new Error('Unauthorized');
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return decoded.prakriti_id;
}

export async function GET(req) {
  try {
    const prakriti_id = getPrakritiId(req);
    const result = await pool.query(
      'SELECT id, habit_name, category, prescribed_time, frequency, streak_count FROM habits WHERE user_id = $1 AND active = true',
      [prakriti_id]
    );
    return Response.json({ habits: result.rows });
  } catch (err) {
    if (err.message === 'Unauthorized') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Habits GET Error:', err.message, err);
    return Response.json({ error: 'Internal server error', details: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const prakriti_id = getPrakritiId(req);
    const body = await req.json();
    const { habit_name, category, prescribed_time, frequency, details } = body;

    if (!habit_name || !category || !prescribed_time || !frequency) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO habits (user_id, habit_name, category, prescribed_time, frequency, details)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, habit_name, category, prescribed_time, frequency, streak_count, longest_streak, details, created_at`,
      [prakriti_id, habit_name, category, prescribed_time, frequency, details || null]
    );

    return Response.json({ habit: result.rows[0] });
  } catch (err) {
    if (err.message === 'Unauthorized') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Habits POST Error:', err.message, err);
    return Response.json({ error: 'Internal server error', details: err.message }, { status: 500 });
  }
}