import pool from '@/lib/db';
import jwt from 'jsonwebtoken';

function getPrakritiId(req) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token) {
    throw new Error('Unauthorized');
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return decoded.prakriti_id; // This matches the TEXT column user_id
}

export async function GET(req) {
  try {
    const prakriti_id = getPrakritiId(req);

    const year = new Date().getFullYear();
    const formattedStartDate = `${year}-01-01`;

    // 1. Generate an array of all calendar dates from Jan 1st to Today
    const dates = [];
    const start = new Date(`${year}-01-01`);
    const today = new Date();
    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }

    // 2. Fetch completion counts grouped by date from PostgreSQL
    // Casting completion_date to ::text guarantees perfect key matching in JavaScript
    const result = await pool.query(
      `SELECT 
        completion_date::text, 
        COUNT(*) as count
       FROM habit_completions 
       WHERE user_id = $1 
         AND completion_date >= $2 
         AND is_completed = true
       GROUP BY completion_date
       ORDER BY completion_date ASC`,
      [prakriti_id, formattedStartDate]
    );

    // 3. Map the database rows to a fast lookup object
    const countsByDate = {};
    result.rows.forEach(row => {
      countsByDate[row.completion_date] = parseInt(row.count, 10);
    });

    // 4. Blend the calendar dates with actual database counts (filling missing dates with 0)
    const completionCounts = dates.map(date => ({
      date,
      count: countsByDate[date] || 0
    }));

    return Response.json({ completionCounts });
  } catch (err) {
    if (err.message === 'Unauthorized' || err.name === 'JsonWebTokenError') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Database GET Error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const prakriti_id = getPrakritiId(req);
    const body = await req.json();
    const { habit_id, completion_date, is_completed } = body;

    // Validation: block requests early if required parameters are missing
    if (!habit_id || !completion_date) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure incoming status parses cleanly to a boolean fallback value
    const normalizedStatus = is_completed === undefined || is_completed === null ? false : is_completed;

    // 5. Atomic Upsert: Insert a tracking row or update an existing state cleanly
    const result = await pool.query(
      `INSERT INTO habit_completions (user_id, habit_id, completion_date, is_completed)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, habit_id, completion_date)
       DO UPDATE SET is_completed = $4, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [prakriti_id, habit_id, completion_date, normalizedStatus]
    );

    return Response.json({ completion: result.rows[0] });
  } catch (err) {
    if (err.message === 'Unauthorized' || err.name === 'JsonWebTokenError') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Database POST Error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}