import pool from '@/lib/db';
import jwt from 'jsonwebtoken';

export async function GET(req) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const prakriti_id = decoded.prakriti_id;

    const [userResult, medsResult, habitsResult, dailiesResult] = await Promise.all([
      pool.query(
        'SELECT name, day_streak, primary_dosha FROM users WHERE prakriti_id = $1',
        [prakriti_id]
      ),
      pool.query(
        `SELECT id, name, dose, frequency, consumption_time 
         FROM medications WHERE user_id = $1 AND active = true 
         ORDER BY consumption_time ASC`,
        [prakriti_id]
      ),
      pool.query(
        'SELECT id, habit_name, streak_count FROM habits WHERE user_id = $1',
        [prakriti_id]
      ),
      pool.query(
        'SELECT id, habit_name, streak_count FROM dailies WHERE user_id = $1',
        [prakriti_id]
      ),
    ]);

    return Response.json({
      user: userResult.rows[0],
      medications: medsResult.rows,
      habits: habitsResult.rows,
      dailies: dailiesResult.rows,
    });

  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}