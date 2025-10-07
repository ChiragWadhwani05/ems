import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isAdmin as checkAdmin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { userId, approve } = await req.json();

    const temp_User = await prisma.temp_User.findUnique({
      where: { id: userId },
    });
    if (!userId || approve === undefined)
      return NextResponse.json(
        { error: 'Missing userId or approve flag' },
        { status: 400 }
      );
    if (!temp_User)
      return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (approve) {
      await prisma.user.create({
        data: {
          name: temp_User.name,
          email: temp_User.email,
          password: temp_User.password,
        },
      });
    }
    await prisma.temp_User.delete({ where: { id: userId } });
    return NextResponse.json({ message: 'User processed successfully' });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const isAdmin = await checkAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ success: false }, { status: 403 });
  }

  try {
    const tempUsers = await prisma.temp_User.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json({ tempUsers });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
