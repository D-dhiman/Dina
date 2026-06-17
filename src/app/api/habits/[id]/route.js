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

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const prakriti_id = getPrakritiId(req);
    const body = await req.json();
    const { habit_name, category, prescribed_time, frequency, details } = body;

    const updates = [];
    const values = [];

    if (habit_name !== undefined) {
      values.push(habit_name);
      updates.push(`habit_name = $${values.length}`);
    }
    if (category !== undefined) {
      values.push(category);
      updates.push(`category = $${values.length}`);
    }
    if (prescribed_time !== undefined) {
      values.push(prescribed_time);
      updates.push(`prescribed_time = $${values.length}`);
    }
    if (frequency !== undefined) {
      values.push(frequency);
      updates.push(`frequency = $${values.length}`);
    }
    if (details !== undefined) {
      values.push(details);
      updates.push(`details = $${values.length}`);
    }

    if (updates.length === 0) {
      return Response.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id, prakriti_id);
    const query = `UPDATE habits SET ${updates.join(', ')} WHERE id = $${values.length - 1} AND user_id = $${values.length} RETURNING id, habit_name, category, prescribed_time, frequency, streak_count, longest_streak, details, created_at`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      console.error('Habit PATCH not found', { id, prakriti_id, updates, values });
      return Response.json({ error: 'Not found', id, prakriti_id }, { status: 404 });
    }

    return Response.json({ habit: result.rows[0] });
  } catch (err) {
    if (err.message === 'Unauthorized') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error(err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const prakriti_id = getPrakritiId(req);

    await pool.query('DELETE FROM habits WHERE id = $1 AND user_id = $2', [id, prakriti_id]);
    return Response.json({ success: true });
  } catch (err) {
    if (err.message === 'Unauthorized') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error(err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
