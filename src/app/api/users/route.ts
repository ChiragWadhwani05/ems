import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isAdmin as checkAdmin } from '@/lib/auth';

// GET - Get all users
export async function GET(request: NextRequest) {
  const isAdmin = await checkAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ success: false }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        role: {
          not: 'admin',
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        teamId: true,
        Team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(request: NextRequest) {
  // Check admin authorization
  const isAdmin = await checkAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ success: false }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        teamId: true,
        Team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
