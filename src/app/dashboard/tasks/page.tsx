'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/axios';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate?: string;
  assignedBy: string;
  assignedTo: string | null;
  teamId: string;
  assignedToUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  team: {
    id: string;
    name: string;
  };
}

interface Team {
  id: string;
  name: string;
  members: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    teamId: '',
    dueDate: '',
    priority: 'medium',
  });

  // Filter states
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('users/me');
      if (response.data.success) {
        setCurrentUser(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  };

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters for filtering
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (teamFilter) params.append('teamId', teamFilter);

      const response = await api.get(`tasks?${params.toString()}`);
      if (response.data.success) {
        setTasks(response.data.data);
      } else {
        setError(response.data.error || 'Failed to fetch tasks');
      }
    } catch (err) {
      setError('Failed to fetch tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, teamFilter]);

  const fetchTeams = async () => {
    try {
      const response = await api.get('teams');
      if (response.data.success) {
        setTeams(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchTeams();
  }, []);

  // Re-fetch tasks when filters change
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.title.trim() ||
      !formData.description.trim() ||
      !formData.teamId
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await api.post('tasks', {
        title: formData.title,
        description: formData.description,
        assignedTo: formData.assignedTo || null,
        teamId: formData.teamId,
        dueDate: formData.dueDate || null,
        priority: formData.priority,
      });

      if (response.data.success) {
        toast.success('Task created successfully!');
        setFormData({
          title: '',
          description: '',
          assignedTo: '',
          teamId: '',
          dueDate: '',
          priority: 'medium',
        });
        setShowCreateForm(false);
        fetchTasks();
      } else {
        toast.error(response.data.error || 'Failed to create task');
      }
    } catch (err) {
      console.error('Error creating task:', err);
      toast.error('Failed to create task');
    }
  };

  const handleDeleteTask = async (taskId: string, taskTitle: string) => {
    if (!confirm(`Are you sure you want to delete the task "${taskTitle}"?`)) {
      return;
    }

    try {
      const response = await api.delete(`tasks/${taskId}`);

      if (response.data.success) {
        toast.success('Task deleted successfully!');
        fetchTasks();
      } else {
        toast.error(response.data.error || 'Failed to delete task');
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      toast.error('Failed to delete task');
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, string> = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={variants[priority] || 'bg-gray-100 text-gray-800'}>
        {priority}
      </Badge>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString();
  };

  const getTeamMembers = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId);
    return team?.members || [];
  };

  const canCreateTasks =
    currentUser && ['admin', 'manager'].includes(currentUser.role);
  const canDeleteTasks =
    currentUser && ['admin', 'manager'].includes(currentUser.role);

  if (loading) {
    return <div className="p-4">Loading tasks...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tasks Management</h1>
          <p className="text-gray-600">
            Manage tasks, assignments, and progress tracking
          </p>
        </div>
        {canCreateTasks && (
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? 'Cancel' : 'Create Task'}
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter tasks by status, priority, or team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="statusFilter">Status</Label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <Label htmlFor="priorityFilter">Priority</Label>
              <select
                id="priorityFilter"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <Label htmlFor="teamFilter">Team</Label>
              <select
                id="teamFilter"
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">All Teams</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Task Form */}
      {showCreateForm && canCreateTasks && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Task</CardTitle>
            <CardDescription>Assign a new task to team members</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    name="title"
                    type="text"
                    placeholder="Enter task title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Enter task description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="teamId">Team</Label>
                  <select
                    id="teamId"
                    name="teamId"
                    value={formData.teamId}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select a team</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="assignedTo">Assign To (Optional)</Label>
                  <select
                    id="assignedTo"
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Leave unassigned</option>
                    {formData.teamId &&
                      getTeamMembers(formData.teamId).map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.email})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date (Optional)</Label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create Task</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Tasks</CardTitle>
          <CardDescription>Overview of all tasks in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>
              {tasks.length === 0
                ? 'No tasks found'
                : `${tasks.length} task(s) total`}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No tasks found.{' '}
                    {canCreateTasks && 'Create your first task!'}
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{task.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {task.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {task.assignedToUser?.name || 'Unassigned'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {task.assignedToUser?.email || 'No assignee'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {task.team.name}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                    <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                    <TableCell className="text-sm">
                      {formatDate(task.dueDate)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-2 justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            router.push(`/dashboard/tasks/${task.id}`);
                          }}
                        >
                          View
                        </Button>
                        {canDeleteTasks && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              handleDeleteTask(task.id, task.title)
                            }
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
