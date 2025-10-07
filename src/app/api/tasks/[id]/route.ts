import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET /api/tasks/[id] - Get specific task details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyToken(request);
    const taskId = params.id;
    const task = await prisma.task.findUnique({
      where: { id: taskId },
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
            members: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check permissions - employees can only view their own tasks
    if (user.role === 'employee' && task.assignedTo !== user.id) {
      return NextResponse.json(
        { success: false, error: 'You can only view your own tasks' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Error fetching task:', error);

    // Handle authentication errors
    if (error instanceof Error && error.message.includes('token')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

// PUT /api/tasks/[id] - Update specific task
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyToken(request);
    const taskId = params.id;
    const body = await request.json(); // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (user.role === 'employee' && existingTask.assignedTo !== user.id) {
      return NextResponse.json(
        { success: false, error: 'You can only update your own tasks' },
        { status: 403 }
      );
    }

    // Prepare update data based on user role
    const updateData: {
      title?: string;
      description?: string;
      status?: string;
      priority?: string;
      dueDate?: Date | null;
      assignedTo?: string;
      teamId?: string;
    } = {};

    // Employees can only update status
    if (user.role === 'employee') {
      if (body.status) updateData.status = body.status;
    } else {
      // Managers and admins can update all fields
      if (body.title) updateData.title = body.title;
      if (body.description) updateData.description = body.description;
      if (body.status) updateData.status = body.status;
      if (body.priority) updateData.priority = body.priority;
      if (body.dueDate !== undefined) {
        updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
      }
      if (body.assignedTo) {
        // Verify the assigned user exists and is part of the team
        const assignedUser = await prisma.user.findFirst({
          where: {
            id: body.assignedTo,
            teams: {
              some: {
                id: body.teamId || existingTask.teamId,
              },
            },
          },
        });

        if (!assignedUser) {
          return NextResponse.json(
            {
              success: false,
              error: 'Assigned user not found or not part of the team',
            },
            { status: 400 }
          );
        }
        updateData.assignedTo = body.assignedTo;
      }
      if (body.teamId) {
        // Verify the team exists
        const team = await prisma.team.findUnique({
          where: { id: body.teamId },
        });

        if (!team) {
          return NextResponse.json(
            { success: false, error: 'Team not found' },
            { status: 400 }
          );
        }
        updateData.teamId = body.teamId;
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
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
      data: updatedTask,
    });
  } catch (error) {
    console.error('Error updating task:', error);

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
      { success: false, error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Delete specific task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyToken(request);

    // Only managers and admins can delete tasks
    if (user.role === 'employee') {
      return NextResponse.json(
        { success: false, error: 'Only managers and admins can delete tasks' },
        { status: 403 }
      );
    }
    const taskId = params.id;

    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting task:', error);

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
      { success: false, error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}
