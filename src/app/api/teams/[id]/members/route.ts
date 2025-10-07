import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

interface DecodedToken {
  id: string;
  email: string;
  role: string;
}

// Helper function to check if user has manager/admin privileges
async function checkManagerOrAdmin(request: NextRequest) {
  try {
    const tokenData = (await verifyToken(request)) as DecodedToken;

    if (!tokenData) {
      return { authorized: false, error: 'Invalid token', user: null };
    }

    if (tokenData.role !== 'admin' && tokenData.role !== 'manager') {
      return {
        authorized: false,
        error: 'Admin or Manager access required',
        user: null,
      };
    }

    return { authorized: true, error: null, user: tokenData };
  } catch {
    return { authorized: false, error: 'Authentication failed', user: null };
  }
}

// POST - Add members to team
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { authorized, error } = await checkManagerOrAdmin(request);
    if (!authorized) {
      return NextResponse.json({ success: false, error }, { status: 403 });
    }

    const teamId = params.id;
    const body = await request.json();
    const { userIds } = body;

    if (!teamId) {
      return NextResponse.json(
        { success: false, error: 'Team ID is required' },
        { status: 400 }
      );
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User IDs array is required' },
        { status: 400 }
      );
    }

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    // Check if all users exist
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
    });

    if (users.length !== userIds.length) {
      return NextResponse.json(
        { success: false, error: 'One or more users not found' },
        { status: 400 }
      );
    }

    // Add users to team
    await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { teamId: teamId },
    });

    // Fetch updated team with members
    const updatedTeam = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        name: true,
        leadId: true,
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `${userIds.length} member(s) added to team`,
      data: updatedTeam,
    });
  } catch (error) {
    console.error('Error adding members to team:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add members to team' },
      { status: 500 }
    );
  }
}

// DELETE - Remove members from team
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { authorized, error } = await checkManagerOrAdmin(request);
    if (!authorized) {
      return NextResponse.json({ success: false, error }, { status: 403 });
    }

    const teamId = params.id;
    const body = await request.json();
    const { userIds } = body;

    if (!teamId) {
      return NextResponse.json(
        { success: false, error: 'Team ID is required' },
        { status: 400 }
      );
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User IDs array is required' },
        { status: 400 }
      );
    }

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    // Remove users from team (set teamId to null)
    await prisma.user.updateMany({
      where: {
        id: { in: userIds },
        teamId: teamId, // Only update users who are actually in this team
      },
      data: { teamId: null },
    });

    // Fetch updated team with members
    const updatedTeam = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        name: true,
        leadId: true,
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Member(s) removed from team`,
      data: updatedTeam,
    });
  } catch (error) {
    console.error('Error removing members from team:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove members from team' },
      { status: 500 }
    );
  }
}
