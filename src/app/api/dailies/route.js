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
      'SELECT id, habit_name, category, prescribed_time, last_time_to_do, frequency, streak_count FROM dailies WHERE user_id = $1 AND active = true',
      [prakriti_id]
    );
    console.log('rows returned:', result.rows);
    return Response.json({ dailies: result.rows });
  } catch (err) {
    if (err.message === 'Unauthorized') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error(err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const prakriti_id = getPrakritiId(req);
    const body = await req.json();
    const { habit_name, category, prescribed_time, last_time_to_do, frequency } = body;

    if (!habit_name || !category || !prescribed_time || !last_time_to_do || !frequency) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO dailies (user_id, habit_name, category, prescribed_time, last_time_to_do, frequency)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, habit_name, category, prescribed_time, last_time_to_do, frequency, streak_count, longest_streak, created_at`,
      [prakriti_id, habit_name, category, prescribed_time, last_time_to_do, frequency]
    );

    return Response.json({ daily: result.rows[0] });
  } catch (err) {
    if (err.message === 'Unauthorized') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error(err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
