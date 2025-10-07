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

// GET - Get all teams
export async function GET(request: NextRequest) {
  try {
    const { authorized, error } = await checkManagerOrAdmin(request);
    if (!authorized) {
      return NextResponse.json({ success: false, error }, { status: 403 });
    }

    const teams = await prisma.team.findMany({
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
            status: true,
            priority: true,
            dueDate: true,
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
      data: teams,
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

// POST - Create new team
export async function POST(request: NextRequest) {
  try {
    const { authorized, error } = await checkManagerOrAdmin(request);
    if (!authorized) {
      return NextResponse.json({ success: false, error }, { status: 403 });
    }

    const body = await request.json();
    const { name, leadId, memberIds } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Team name is required' },
        { status: 400 }
      );
    }

    // Check if team name already exists
    const existingTeam = await prisma.team.findFirst({
      where: { name },
    });

    if (existingTeam) {
      return NextResponse.json(
        { success: false, error: 'Team name already exists' },
        { status: 400 }
      );
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

    // Create team
    const team = await prisma.team.create({
      data: {
        name,
        leadId: leadId || null,
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
      },
    });

    // Add members to team if provided
    if (memberIds && Array.isArray(memberIds) && memberIds.length > 0) {
      // Use connect to add users to the team (many-to-many relationship)
      await prisma.team.update({
        where: { id: team.id },
        data: {
          members: {
            connect: memberIds.map((userId: string) => ({ id: userId })),
          },
        },
      });

      // Fetch updated team with members
      const updatedTeam = await prisma.team.findUnique({
        where: { id: team.id },
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
        data: updatedTeam,
      });
    }

    return NextResponse.json({
      success: true,
      data: team,
    });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create team' },
      { status: 500 }
    );
  }
}

// PUT - Update team
export async function PUT(request: NextRequest) {
  try {
    const { authorized, error } = await checkManagerOrAdmin(request);
    if (!authorized) {
      return NextResponse.json({ success: false, error }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, leadId } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Team ID is required' },
        { status: 400 }
      );
    }

    // Check if team exists
    const existingTeam = await prisma.team.findUnique({
      where: { id },
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
          id: { not: id },
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
      where: { id },
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
