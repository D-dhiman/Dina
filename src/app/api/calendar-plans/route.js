import pool from '@/lib/db';
import jwt from 'jsonwebtoken';

export async function GET(req) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { searchParams } = new URL(req.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    const result = await pool.query(
      `SELECT * FROM calendar_plans 
       WHERE user_id = $1 AND plan_date BETWEEN $2 AND $3
       ORDER BY plan_date ASC`,
      [decoded.prakriti_id, start, end]
    );

    return Response.json({ plans: result.rows });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { plan_date, label, color } = await req.json();

    const result = await pool.query(
      `INSERT INTO calendar_plans (user_id, plan_date, label, color)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [decoded.prakriti_id, plan_date, label, color || 'bg-sky-400']
    );

    return Response.json({ plan: result.rows[0] });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}