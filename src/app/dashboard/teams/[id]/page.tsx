'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
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
import { Badge } from '@/components/ui/badge';
import api from '@/lib/axios';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface TeamTask {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate?: string;
  assignedBy: string;
  assignedTo: string;
  assignedToUser: {
    name: string;
    email: string;
  };
}

interface TeamDetails {
  id: string;
  name: string;
  leadId?: string;
  members: TeamMember[];
  tasks: TeamTask[];
  _count: {
    members: number;
    tasks: number;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function TeamDetailsPage() {
  const params = useParams();
  const teamId = params.id as string;

  const [team, setTeam] = useState<TeamDetails | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const fetchTeamDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`teams/${teamId}`);
      if (response.data.success) {
        setTeam(response.data.data);
      } else {
        setError(response.data.error || 'Failed to fetch team details');
      }
    } catch (err) {
      setError('Failed to fetch team details');
      console.error('Error fetching team details:', err);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  const fetchAvailableUsers = useCallback(async () => {
    try {
      const response = await api.get('users');
      if (response.data.success) {
        setAvailableUsers(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  }, []);

  // Filter available users when team members change
  const filteredAvailableUsers = availableUsers.filter(
    (user: User) => !team?.members.some((member) => member.id === user.id)
  );

  useEffect(() => {
    if (teamId) {
      fetchTeamDetails();
      fetchAvailableUsers();
    }
  }, [teamId, fetchTeamDetails, fetchAvailableUsers]);

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user to add');
      return;
    }

    try {
      const response = await api.post(`teams/${teamId}/members`, {
        userIds: selectedUsers,
      });

      if (response.data.success) {
        toast.success(`${selectedUsers.length} member(s) added successfully!`);
        setSelectedUsers([]);
        setShowAddMembers(false);
        fetchTeamDetails();
      } else {
        toast.error(response.data.error || 'Failed to add members');
      }
    } catch (err) {
      console.error('Error adding members:', err);
      toast.error('Failed to add members');
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (
      !confirm(`Are you sure you want to remove ${userName} from this team?`)
    ) {
      return;
    }

    try {
      const response = await api.delete(`teams/${teamId}/members`, {
        data: { userIds: [userId] },
      });

      if (response.data.success) {
        toast.success('Member removed successfully!');
        fetchTeamDetails();
      } else {
        toast.error(response.data.error || 'Failed to remove member');
      }
    } catch (err) {
      console.error('Error removing member:', err);
      toast.error('Failed to remove member');
    }
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

  if (loading) {
    return <div className="p-4">Loading team details...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  if (!team) {
    return <div className="p-4">Team not found</div>;
  }

  return (
    <div className="p-4 space-y-6">
      {/* Team Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{team.name}</h1>
          <p className="text-gray-600">
            {team._count.members} members • {team._count.tasks} tasks
          </p>
        </div>
        <Button onClick={() => setShowAddMembers(!showAddMembers)}>
          {showAddMembers ? 'Cancel' : 'Add Members'}
        </Button>
      </div>

      {/* Add Members Section */}
      {showAddMembers && (
        <Card>
          <CardHeader>
            <CardTitle>Add Team Members</CardTitle>
            <CardDescription>Select users to add to this team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {filteredAvailableUsers.map((user) => (
                  <label key={user.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(
                            selectedUsers.filter((id) => id !== user.id)
                          );
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">
                      {user.name} ({user.role})
                    </span>
                  </label>
                ))}
              </div>
              {filteredAvailableUsers.length === 0 && (
                <p className="text-gray-500">No available users to add</p>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={handleAddMembers}
                  disabled={selectedUsers.length === 0}
                >
                  Add Selected Members ({selectedUsers.length})
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddMembers(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Current members of this team</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>
                {team.members.length === 0
                  ? 'No members in this team'
                  : `${team.members.length} member(s)`}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8">
                      No members found
                    </TableCell>
                  </TableRow>
                ) : (
                  team.members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-gray-500">
                            {member.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            member.role === 'admin'
                              ? 'bg-red-100 text-red-800'
                              : member.role === 'manager'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            handleRemoveMember(member.id, member.name)
                          }
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Team Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Team Tasks</CardTitle>
            <CardDescription>Tasks assigned to this team</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>
                {team.tasks.length === 0
                  ? 'No tasks assigned'
                  : `${team.tasks.length} task(s)`}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No tasks found
                    </TableCell>
                  </TableRow>
                ) : (
                  team.tasks.map((task) => (
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
                        <div className="text-sm">
                          {task.assignedToUser?.name}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(task.status)}</TableCell>
                      <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                      <TableCell className="text-sm">
                        {formatDate(task.dueDate)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
