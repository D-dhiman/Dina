import pool from '@/lib/db';
import jwt from 'jsonwebtoken';

export async function PATCH(req) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const prakriti_id = decoded.prakriti_id;

    const body = await req.json();

    const allowed = [
      'name', 'weight', 'height', 'blood_type', 'gender',
      'date_of_birth', 'phone_number', 'diet_type',
      'allergies', 'dietary_restrictions', 'health_goals', 'preferences'
    ];

    const updates = [];
    const values = [];
    let i = 1;

    for (const key of allowed) {
      if (body[key] !== undefined) {
        updates.push(`${key} = $${i}`);
        values.push(body[key]);
        i++;
      }
    }

    if (updates.length === 0)
      return Response.json({ error: 'Nothing to update' }, { status: 400 });

    values.push(prakriti_id);
    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE prakriti_id = $${i}`,
      values
    );

    return Response.json({ success: true });

  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}