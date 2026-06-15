import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export function middleware(req) {
  const token = req.headers.get('authorization')?.split(' ')[1];

  if (!token)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    return NextResponse.next();
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

// Define which routes are protected
export const config = {
  matcher: ['/api/protected/:path*'], // change this to your protected routes
};