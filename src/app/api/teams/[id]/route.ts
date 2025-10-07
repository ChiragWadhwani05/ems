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

// GET - Get team by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { authorized, error } = await checkManagerOrAdmin(request);
    if (!authorized) {
      return NextResponse.json({ success: false, error }, { status: 403 });
    }

    const teamId = params.id;

    if (!teamId) {
      return NextResponse.json(
        { success: false, error: 'Team ID is required' },
        { status: 400 }
      );
    }

    const team = await prisma.team.findUnique({
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
        tasks: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            dueDate: true,
            assignedBy: true,
            assignedTo: true,
            assignedToUser: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            dueDate: 'asc',
          },
        },
        _count: {
          select: {
            members: true,
            tasks: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: team,
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch team' },
      { status: 500 }
    );
  }
}

// PUT - Update team by ID
export async function PUT(
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
    const { name, leadId } = body;

    if (!teamId) {
      return NextResponse.json(
        { success: false, error: 'Team ID is required' },
        { status: 400 }
      );
    }

    // Check if team exists
    const existingTeam = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!existingTeam) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    // Check if new name already exists (if name is being changed)
    if (name && name !== existingTeam.name) {
      const duplicateName = await prisma.team.findFirst({
        where: {
          name,
          id: { not: teamId },
        },
      });

      if (duplicateName) {
        return NextResponse.json(
          { success: false, error: 'Team name already exists' },
          { status: 400 }
        );
      }
    }

    // Validate leadId if provided
    if (leadId) {
      const leadExists = await prisma.user.findUnique({
        where: { id: leadId },
      });

      if (!leadExists) {
        return NextResponse.json(
          { success: false, error: 'Team lead not found' },
          { status: 400 }
        );
      }
    }

    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        name: name || existingTeam.name,
        leadId: leadId !== undefined ? leadId : existingTeam.leadId,
      },
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
        _count: {
          select: {
            members: true,
            tasks: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedTeam,
    });
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update team' },
      { status: 500 }
    );
  }
}

// DELETE - Delete team by ID
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

    if (!teamId) {
      return NextResponse.json(
        { success: false, error: 'Team ID is required' },
        { status: 400 }
      );
    }

    // Check if team exists
    const existingTeam = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: true,
        tasks: true,
      },
    });

    if (!existingTeam) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    // Check if team has active tasks
    if (existingTeam.tasks.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete team with active tasks' },
        { status: 400 }
      );
    }

    // Remove team members from the team (set teamId to null)
    if (existingTeam.members.length > 0) {
      await prisma.user.updateMany({
        where: { teamId: teamId },
        data: { teamId: null },
      });
    }

    // Delete the team
    await prisma.team.delete({
      where: { id: teamId },
    });

    return NextResponse.json({
      success: true,
      message: 'Team deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete team' },
      { status: 500 }
    );
  }
}
