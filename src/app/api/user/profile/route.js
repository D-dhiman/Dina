import pool from '@/lib/db';
import jwt from 'jsonwebtoken';

export async function GET(req) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const prakriti_id = decoded.prakriti_id;

    const result = await pool.query(
      `SELECT 
        prakriti_id, name, email, date_of_birth, gender,
        weight, height, blood_type, phone_number,
        diet_type, allergies, dietary_restrictions,
        health_goals, preferences, day_streak, days_active,
        dosha_vata, dosha_pitta, dosha_kapha, primary_dosha
       FROM users WHERE prakriti_id = $1`,
      [prakriti_id]
    );

    const user = result.rows[0];
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

    const incompleteFields = [];
    if (!user.weight) incompleteFields.push('weight');
    if (!user.height) incompleteFields.push('height');
    if (!user.blood_type) incompleteFields.push('blood_type');
    if (!user.date_of_birth) incompleteFields.push('date_of_birth');
    if (!user.gender) incompleteFields.push('gender');
    if (!user.diet_type) incompleteFields.push('diet_type');

    return Response.json({
      user,
      profileComplete: incompleteFields.length === 0,
      incompleteFields
    });

  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}