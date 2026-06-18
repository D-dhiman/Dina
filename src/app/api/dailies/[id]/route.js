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
    const { habit_name, category, prescribed_time, last_time_to_do, frequency, streak_count, longest_streak } = body;

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
    if (last_time_to_do !== undefined) {
      values.push(last_time_to_do);
      updates.push(`last_time_to_do = $${values.length}`);
    }
    if (frequency !== undefined) {
      values.push(frequency);
      updates.push(`frequency = $${values.length}`);
    }
    if (streak_count !== undefined) {
      values.push(streak_count);
      updates.push(`streak_count = $${values.length}`);
    }
    if (longest_streak !== undefined) {
      values.push(longest_streak);
      updates.push(`longest_streak = $${values.length}`);
    }

    if (updates.length === 0) {
      return Response.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id, prakriti_id);
    const query = `UPDATE dailies SET ${updates.join(', ')} WHERE id = $${values.length - 1} AND user_id = $${values.length} RETURNING id, habit_name, category, prescribed_time, last_time_to_do, frequency, streak_count, longest_streak, created_at`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      console.error('Daily PATCH not found', { id, prakriti_id, updates, values });
      return Response.json({ error: 'Not found', id, prakriti_id }, { status: 404 });
    }

    return Response.json({ daily: result.rows[0] });
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

    await pool.query('DELETE FROM dailies WHERE id = $1 AND user_id = $2', [id, prakriti_id]);
    return Response.json({ success: true });
  } catch (err) {
    if (err.message === 'Unauthorized') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error(err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
