import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET /api/tasks - Get all tasks with filtering options
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const teamId = searchParams.get('teamId');
    const assignedTo = searchParams.get('assignedTo');

    // Build filter conditions
    const where: {
      status?: string;
      priority?: string;
      teamId?: string;
      assignedTo?: string;
    } = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (teamId) where.teamId = teamId;
    if (assignedTo) where.assignedTo = assignedTo;

    // If user is not admin/manager, only show their tasks
    if (user.role === 'employee') {
      where.assignedTo = user.id;
    }
    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignedToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);

    // Handle authentication errors
    if (error instanceof Error && error.message.includes('token')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);

    // Only managers and admins can create tasks
    if (user.role === 'employee') {
      return NextResponse.json(
        { success: false, error: 'Only managers and admins can create tasks' },
        { status: 403 }
      );
    }
    const body = await request.json();
    const { title, description, assignedTo, teamId, dueDate, priority } = body;

    // Convert empty string to null for assignedTo
    const cleanAssignedTo =
      assignedTo && assignedTo.trim() !== '' ? assignedTo : null;

    // Validate required fields
    if (!title || !description || !teamId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Title, description, and teamId are required',
        },
        { status: 400 }
      );
    }

    // Verify that the team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 400 }
      );
    }

    // If assignedTo is provided, verify that the assigned user exists and is part of the team
    if (cleanAssignedTo) {
      const assignedUser = await prisma.user.findFirst({
        where: {
          id: cleanAssignedTo,
          teams: {
            some: {
              id: teamId,
            },
          },
        },
      });

      if (!assignedUser) {
        return NextResponse.json(
          {
            success: false,
            error: 'Assigned user not found or not part of the selected team',
          },
          { status: 400 }
        );
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        assignedBy: user.id,
        assignedTo: cleanAssignedTo,
        teamId,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'medium',
        status: 'pending',
      },
      include: {
        assignedToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Error creating task:', error);

    // Handle authentication errors
    if (error instanceof Error && error.message.includes('token')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

// PUT /api/tasks - Update multiple tasks (batch update)
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    const body = await request.json();
    const { taskIds, updates } = body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Task IDs array is required' },
        { status: 400 }
      );
    }

    // Check permissions for each task
    const tasks = await prisma.task.findMany({
      where: {
        id: { in: taskIds },
      },
    });

    // Employees can only update their own tasks
    if (user.role === 'employee') {
      interface Task {
        id: string;
        assignedTo: string | null;
      }

      const invalidTasks: Task[] = tasks.filter(
        (task: Task) => task.assignedTo !== user.id
      );
      if (invalidTasks.length > 0) {
        return NextResponse.json(
          { success: false, error: 'You can only update your own tasks' },
          { status: 403 }
        );
      }
    } // Prepare update data (only allow certain fields to be updated)
    const allowedUpdates: {
      status?: string;
      priority?: string;
      dueDate?: Date;
      title?: string;
      description?: string;
      assignedTo?: string;
    } = {};
    if (updates.status) allowedUpdates.status = updates.status;
    if (updates.priority) allowedUpdates.priority = updates.priority;
    if (updates.dueDate) allowedUpdates.dueDate = new Date(updates.dueDate);

    // For managers/admins, allow more fields
    if (user.role !== 'employee') {
      if (updates.title) allowedUpdates.title = updates.title;
      if (updates.description) allowedUpdates.description = updates.description;
      if (updates.assignedTo) allowedUpdates.assignedTo = updates.assignedTo;
    }

    const updatedTasks = await prisma.task.updateMany({
      where: {
        id: { in: taskIds },
      },
      data: allowedUpdates,
    });

    return NextResponse.json({
      success: true,
      data: { updated: updatedTasks.count },
    });
  } catch (error) {
    console.error('Error updating tasks:', error);

    // Handle authentication errors
    if (error instanceof Error && error.message.includes('token')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update tasks' },
      { status: 500 }
    );
  }
}
