import pool from '@/lib/db';
import jwt from 'jsonwebtoken';

export async function DELETE(req, { params }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await pool.query(
      'DELETE FROM medications WHERE id = $1 AND user_id = $2',
      [params.id, decoded.prakriti_id]
    );
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}