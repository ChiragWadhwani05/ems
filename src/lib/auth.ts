import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { NextRequest } from 'next/server';

const SECRET = process.env.JWT_SECRET || 'supersecretkey'; // move to .env later

export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
  return await bcrypt.compare(password, hash);
}

export function generateToken(payload: object) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

export async function verifyToken(req: NextRequest) {
  try {
    const token = req.cookies.get('access-token')?.value;

    if (!token) {
      throw new Error('No token found');
    }

    const decoded = jwt.verify(token, SECRET) as {
      id: string;
      email: string;
      role: string;
    };

    return decoded;
  } catch (err) {
    console.error('JWT Verification Error:', err);
    throw new Error('Invalid or expired token');
  }
}

export async function isAdmin(req: NextRequest) {
  const user = await verifyToken(req);

  if (user.role !== 'admin') {
    throw new Error('Access denied: Admins only');
  }

  return user;
}

export async function isManagerOrAdmin(req: NextRequest) {
  const user = await verifyToken(req);

  if (user.role !== 'admin' && user.role !== 'manager') {
    throw new Error('Access denied: Managers and admins only');
  }

  return user;
}
