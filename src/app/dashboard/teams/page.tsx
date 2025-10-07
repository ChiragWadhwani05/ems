'use client';
import { useEffect, useState } from 'react';
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
import api from '@/lib/axios';
import { toast } from 'sonner';

interface Team {
  id: string;
  name: string;
  leadId?: string;
  members: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate?: string;
  }>;
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

export default function TeamsPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    leadId: '',
  });

  // Fetch teams and users when component mounts
  useEffect(() => {
    fetchTeams();
    fetchUsers();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('teams');
      if (response.data.success) {
        setTeams(response.data.data);
      } else {
        setError(response.data.error || 'Failed to fetch teams');
      }
    } catch (err) {
      setError('Failed to fetch teams');
      console.error('Error fetching teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('users');
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Team name is required');
      return;
    }

    try {
      const response = await api.post('teams', {
        name: formData.name,
        leadId: formData.leadId || null,
      });

      if (response.data.success) {
        toast.success('Team created successfully!');
        setFormData({ name: '', leadId: '' });
        setShowCreateForm(false);
        fetchTeams(); // Refresh teams list
      } else {
        toast.error(response.data.error || 'Failed to create team');
      }
    } catch (err) {
      console.error('Error creating team:', err);
      toast.error('Failed to create team');
    }
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`Are you sure you want to delete the team "${teamName}"?`)) {
      return;
    }

    try {
      const response = await api.delete(`teams/${teamId}`);

      if (response.data.success) {
        toast.success('Team deleted successfully!');
        fetchTeams(); // Refresh teams list
      } else {
        toast.error(response.data.error || 'Failed to delete team');
      }
    } catch (err) {
      console.error('Error deleting team:', err);
      toast.error('Failed to delete team');
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getTeamLeadName = (leadId?: string) => {
    if (!leadId) return 'No Lead';
    const lead = users.find((user) => user.id === leadId);
    return lead ? lead.name : 'Unknown';
  };

  if (loading) {
    return <div className="p-4">Loading teams...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Teams Management</h1>
          <p className="text-gray-600">
            Manage teams, members, and assignments
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : 'Create Team'}
        </Button>
      </div>

      {/* Create Team Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Team</CardTitle>
            <CardDescription>
              Add a new team to your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <Label htmlFor="name">Team Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter team name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="leadId">Team Lead (Optional)</Label>
                <select
                  id="leadId"
                  name="leadId"
                  value={formData.leadId}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select a team lead</option>
                  {users
                    .filter((user) => user.role === 'employee')
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create Team</Button>
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

      {/* Teams Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Teams</CardTitle>
          <CardDescription>
            Overview of all teams in the organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>
              {teams.length === 0
                ? 'No teams found'
                : `${teams.length} team(s) total`}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Team Name</TableHead>
                <TableHead>Team Lead</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Active Tasks</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No teams found. Create your first team!
                  </TableCell>
                </TableRow>
              ) : (
                teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>{getTeamLeadName(team.leadId)}</TableCell>
                    <TableCell>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {team._count.members} members
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                        {team._count.tasks} tasks
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-2 justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            router.push(`/dashboard/teams/${team.id}`);
                          }}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteTeam(team.id, team.name)}
                        >
                          Delete
                        </Button>
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
