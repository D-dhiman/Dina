import pool from '@/lib/db';
import jwt from 'jsonwebtoken';

function getPrakritiId(req) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token) throw new Error('Unauthorized');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return decoded.prakriti_id;
}

export async function GET(req) {
  try {
    const prakriti_id = getPrakritiId(req);
    const year = 2026;
    const formattedStartDate = `${year}-01-01`;

    // 1. Fetch count of active habits and dailies for this user to establish the base denominator
    const totalItemsRes = await pool.query(
      `SELECT 
        (SELECT COUNT(*)::int FROM habits WHERE user_id = $1) as total_habits,
        (SELECT COUNT(*)::int FROM dailies WHERE user_id = $1) as total_dailies`,
      [prakriti_id]
    );

    const totalHabits = totalItemsRes.rows[0]?.total_habits || 0;
    const totalDailies = totalItemsRes.rows[0]?.total_dailies || 0;
    const totalPossible = totalHabits + totalDailies;

    // 2. Fetch tracking logs from the habit_completions table group by date
    const completionsRes = await pool.query(
      `SELECT 
        completion_date::text as date_str,
        COUNT(*) FILTER (WHERE is_completed = true)::int as completed_count
       FROM habit_completions
       WHERE user_id = $1 AND completion_date >= $2
       GROUP BY completion_date`,
      [prakriti_id, formattedStartDate]
    );

    const completionMap = {};
    completionsRes.rows.forEach(row => {
      completionMap[row.date_str] = row.completed_count;
    });

    // 3. Construct the entire calendar loop for 2026
    const yearlyRecords = [];
    const start = new Date(`${year}-01-01`);
    const today = new Date();
    
    // Create an explicit loop for all 365 days
    for (let d = 0; d < 365; d++) {
      const current = new Date(start);
      current.setDate(start.getDate() + d);
      const dateStr = current.toISOString().split('T')[0];

      // Block values processing for future dates
      const isFuture = current > today;

      let compliance = 0;
      let completedCount = completionMap[dateStr] || 0;

      if (totalPossible > 0 && !isFuture) {
        // Prevent floating decimals or percentages over 100%
        compliance = Math.min(Math.round((completedCount / totalPossible) * 100), 100);
      }

      yearlyRecords.push({
        dateStr,
        compliance,
        completedDailies: Math.min(completedCount, totalDailies), // Approximated distribution for existing Chart structures
        completedHabits: Math.max(0, completedCount - totalDailies),
        totalDailies,
        totalHabits
      });
    }

    return Response.json({ yearlyRecords });
  } catch (err) {
    if (err.message === 'Unauthorized' || err.name === 'JsonWebTokenError') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Aggregate Yearly Fetch Error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}