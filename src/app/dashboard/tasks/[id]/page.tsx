'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/axios';
import { toast } from 'sonner';

interface TaskDetails {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate?: string;
  assignedBy: string;
  assignedTo: string;
  teamId: string;
  assignedToUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  team: {
    id: string;
    name: string;
    members: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
    }>;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function TaskDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const [task, setTask] = useState<TaskDetails | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    dueDate: '',
    assignedTo: '',
  });

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

  const fetchTaskDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`tasks/${taskId}`);
      if (response.data.success) {
        const taskData = response.data.data;
        setTask(taskData);
        // Initialize form data
        setFormData({
          title: taskData.title,
          description: taskData.description,
          status: taskData.status,
          priority: taskData.priority,
          dueDate: taskData.dueDate ? taskData.dueDate.split('T')[0] : '',
          assignedTo: taskData.assignedTo,
        });
      } else {
        setError(response.data.error || 'Failed to fetch task details');
      }
    } catch (err) {
      setError('Failed to fetch task details');
      console.error('Error fetching task details:', err);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (taskId) {
      fetchCurrentUser();
      fetchTaskDetails();
    }
  }, [taskId, fetchTaskDetails]);

  const handleSaveChanges = async () => {
    try {
      const response = await api.put(`tasks/${taskId}`, {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        dueDate: formData.dueDate || null,
        assignedTo: formData.assignedTo,
      });

      if (response.data.success) {
        toast.success('Task updated successfully!');
        setIsEditing(false);
        fetchTaskDetails(); // Refresh task data
      } else {
        toast.error(response.data.error || 'Failed to update task');
      }
    } catch (err) {
      console.error('Error updating task:', err);
      toast.error('Failed to update task');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await api.put(`tasks/${taskId}`, {
        status: newStatus,
      });

      if (response.data.success) {
        toast.success('Task status updated!');
        fetchTaskDetails(); // Refresh task data
      } else {
        toast.error(response.data.error || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update status');
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

  const canEdit =
    currentUser && ['admin', 'manager'].includes(currentUser.role);
  const canUpdateStatus =
    currentUser &&
    (['admin', 'manager'].includes(currentUser.role) ||
      currentUser.id === task?.assignedTo);

  if (loading) {
    return <div className="p-4">Loading task details...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  if (!task) {
    return <div className="p-4">Task not found</div>;
  }

  return (
    <div className="p-4 space-y-6">
      {/* Task Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{task.title}</h1>
          <div className="flex items-center gap-4 mt-2">
            {getStatusBadge(task.status)}
            {getPriorityBadge(task.priority)}
            <span className="text-gray-600">
              Due: {formatDate(task.dueDate)}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? 'outline' : 'default'}
            >
              {isEditing ? 'Cancel Edit' : 'Edit Task'}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/tasks')}
          >
            Back to Tasks
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Details */}
        <Card>
          <CardHeader>
            <CardTitle>Task Information</CardTitle>
            <CardDescription>
              Details and description of the task
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing && canEdit ? (
              <>
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
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
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="assignedTo">Assigned To</Label>
                  <select
                    id="assignedTo"
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {task.team.members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveChanges}>Save Changes</Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h3 className="font-medium text-gray-700">Description</h3>
                  <p className="text-gray-900 mt-1">{task.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-700">Status</h3>
                    <div className="mt-1">{getStatusBadge(task.status)}</div>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700">Priority</h3>
                    <div className="mt-1">
                      {getPriorityBadge(task.priority)}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">Due Date</h3>
                  <p className="text-gray-900 mt-1">
                    {formatDate(task.dueDate)}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Assignment & Team Info */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment & Team</CardTitle>
            <CardDescription>
              Who is working on this task and team information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              {task.assignedToUser && (
                <>
                  <h3 className="font-medium text-gray-700">Assigned To</h3>
                  <div className="mt-1">
                    <div className="font-medium">
                      {task.assignedToUser.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {task.assignedToUser.email}
                    </div>
                    <Badge className="mt-1">{task.assignedToUser.role}</Badge>
                  </div>
                </>
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Team</h3>
              <div className="mt-1">
                <div className="font-medium">{task.team.name}</div>
                <div className="text-sm text-gray-600">
                  {task.team.members.length} member(s)
                </div>
              </div>
            </div>

            {/* Quick Status Updates */}
            {canUpdateStatus && !isEditing && (
              <div>
                <h3 className="font-medium text-gray-700 mb-2">
                  Quick Status Update
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['pending', 'in-progress', 'completed', 'cancelled'].map(
                    (status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={task.status === status ? 'default' : 'outline'}
                        onClick={() => handleStatusChange(status)}
                        disabled={task.status === status}
                      >
                        {status.charAt(0).toUpperCase() +
                          status.slice(1).replace('-', ' ')}
                      </Button>
                    )
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
