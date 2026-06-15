import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  try {
    const { prakriti_id, password } = await req.json();

    if (!prakriti_id || !password)
      return Response.json({ error: 'Missing fields' }, { status: 400 });

    const result = await pool.query(
      'SELECT * FROM users WHERE prakriti_id = $1',
      [prakriti_id]
    );

    const user = result.rows[0];
    if (!user)
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });

    const token = jwt.sign(
      { prakriti_id: user.prakriti_id, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return Response.json({ token, name: user.name, prakriti_id: user.prakriti_id });

  } catch (err) {
    console.error('Login error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
