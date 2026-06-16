import pool from '@/lib/db';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const prakriti_id = decoded.prakriti_id;

    const body = await req.json();
    const {
      log_date, wake_time, sleep_time, sleep_quality,
      steps, exercise_duration, exercise_type,
      meal_details, mood_score, stress_level,
      habits_completed, dailies_completed, notes
    } = body;

    // Upsert — update if log for this date exists, insert if not
    const result = await pool.query(
      `INSERT INTO daily_logs (
        user_id, log_date, wake_time, sleep_time, sleep_quality,
        steps, exercise_duration, exercise_type, meal_details,
        mood_score, stress_level, habits_completed, dailies_completed, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      ON CONFLICT (user_id, log_date)
      DO UPDATE SET
        wake_time = EXCLUDED.wake_time,
        sleep_time = EXCLUDED.sleep_time,
        sleep_quality = EXCLUDED.sleep_quality,
        steps = EXCLUDED.steps,
        exercise_duration = EXCLUDED.exercise_duration,
        exercise_type = EXCLUDED.exercise_type,
        meal_details = EXCLUDED.meal_details,
        mood_score = EXCLUDED.mood_score,
        stress_level = EXCLUDED.stress_level,
        habits_completed = EXCLUDED.habits_completed,
        dailies_completed = EXCLUDED.dailies_completed,
        notes = EXCLUDED.notes
      RETURNING *`,
      [
        prakriti_id, log_date, wake_time, sleep_time, sleep_quality,
        steps, exercise_duration, exercise_type,
        JSON.stringify(meal_details),
        mood_score, stress_level,
        JSON.stringify(habits_completed),
        JSON.stringify(dailies_completed),
        notes
      ]
    );

    return Response.json({ log: result.rows[0] });

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
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    const query = date
      ? 'SELECT * FROM daily_logs WHERE user_id = $1 AND log_date = $2'
      : 'SELECT * FROM daily_logs WHERE user_id = $1 ORDER BY log_date DESC LIMIT 7';

    const values = date ? [decoded.prakriti_id, date] : [decoded.prakriti_id];
    const result = await pool.query(query, values);

    return Response.json({ logs: result.rows });

  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}