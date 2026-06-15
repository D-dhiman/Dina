import pool from '@/lib/db';
import jwt from 'jsonwebtoken';

export async function GET(req) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query(
      'SELECT * FROM medications WHERE user_id = $1 AND active = true ORDER BY created_at DESC',
      [decoded.prakriti_id]
    );
    return Response.json({ medications: result.rows });
  } catch (err) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const body = await req.json();
    const { name, type, dose, form, target_dosha, frequency, prescribed_by, started_on, notes, consumption_time } = body;

    const result = await pool.query(
      `INSERT INTO medications (user_id, name, type, dose, form, target_dosha, frequency, prescribed_by, started_on, notes, consumption_time)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [decoded.prakriti_id, name, type, dose, form, target_dosha, frequency, prescribed_by, started_on, notes, consumption_time]
    );
    return Response.json({ medication: result.rows[0] });
  } catch (err) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}