import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { comparePassword, generateToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password)
      return NextResponse.json(
        { error: 'Missing credentials' },
        { status: 400 }
      );

    const temp_User = await prisma.temp_User.findUnique({ where: { email } });
    if (temp_User)
      return NextResponse.json(
        { error: 'Account pending approval' },
        { status: 403 }
      );

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const isValid = await comparePassword(password, user.password);
    if (!isValid)
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });

    const token = generateToken({ id: user.id, role: user.role });

    const response = NextResponse.json({
      message: 'Login successful',
      role: user.role,
    });

    response.cookies.set('access-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
