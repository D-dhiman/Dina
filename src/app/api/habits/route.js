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
    const [userResult, habitsResult] = await Promise.all([
      pool.query('SELECT name, day_streak FROM users WHERE prakriti_id = $1', [prakriti_id]),
      pool.query('SELECT id, habit_name, category, prescribed_time, frequency, streak_count FROM habits WHERE user_id = $1 AND active = true', [prakriti_id]),
    ]);

    const user = userResult.rows[0];
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

    // SAFE PARSING: Map row data and substitute null values with safe defaults
    const safeHabits = (habitsResult.rows || []).map(row => ({
      id: row.id,
      habit_name: row.habit_name || "Untitled Habit",
      category: row.category || "General",
      prescribed_time: row.prescribed_time || "08:00:00",
      frequency: row.frequency || "daily",
      streak_count: row.streak_count || 0
    }));

    return Response.json({ user, habits: safeHabits });
  } catch (err) {
    if (err.message === 'Unauthorized') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error("Habits GET Error:", err);
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
    console.error('Habits POST Error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}