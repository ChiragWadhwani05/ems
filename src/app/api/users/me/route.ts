import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET - Get current user's information
export async function GET(request: NextRequest) {
  try {
    // Verify token and get user info from JWT
    const tokenData = await verifyToken(request);

    if (!tokenData || !tokenData.id) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Fetch complete user information from database
    const user = await prisma.user.findUnique({
      where: { id: tokenData.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        teams: {
          select: {
            id: true,
            name: true,
            leadId: true,
          },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            dueDate: true,
            assignedBy: true,
          },
          orderBy: {
            dueDate: 'asc',
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);

    if (error instanceof Error && error.message.includes('token')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

// PUT - Update current user's own information
export async function PUT(request: NextRequest) {
  try {
    // Verify token and get user info from JWT
    const tokenData = await verifyToken(request);

    if (!tokenData || !tokenData.id) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Users can only update certain fields about themselves
    const allowedFields = ['name', 'email'];
    const updateData: { name?: string; email?: string } = {};

    // Filter only allowed fields
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field as keyof typeof updateData] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Check if email is being changed and if it's already taken
    if (updateData.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: updateData.email,
          id: { not: tokenData.id },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'Email already in use' },
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: tokenData.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        teams: {
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
    console.error('Error updating user profile:', error);

    if (error instanceof Error && error.message.includes('token')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
}
