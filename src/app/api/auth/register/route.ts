import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password)
      return NextResponse.json(
        { error: 'All fields required' },
        { status: 400 }
      );

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );

    const hashed = await hashPassword(password);

    const user = await prisma.temp_User.create({
      data: { name, email, password: hashed },
    });

    return NextResponse.json({ message: 'Registration successful', user });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
