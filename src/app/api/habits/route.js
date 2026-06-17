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

    const [habitsResult, dailiesResult] = await Promise.all([
      pool.query('SELECT id, habit_name, category, prescribed_time, frequency, streak_count FROM habits WHERE user_id = $1', [prakriti_id]),
      pool.query('SELECT id, habit_name, category, prescribed_time, last_time_to_do, frequency, streak_count FROM dailies WHERE user_id = $1', [prakriti_id]),
    ]);

    return Response.json({
      habits: habitsResult.rows,
      dailies: dailiesResult.rows,
    });
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
    console.error(err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
