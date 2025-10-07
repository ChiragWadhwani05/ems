'use client';
import { useEffect, useState } from 'react';
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
import api from '@/lib/axios';
import { toast } from 'sonner';

interface TempUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function RequestsPage() {
  const [tempUsers, setTempUsers] = useState<TempUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingUsers, setProcessingUsers] = useState<Set<string>>(
    new Set()
  );

  // Fetch temp users from API when component mounts
  useEffect(() => {
    const fetchTempUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('users/approve');
        if (response.data.tempUsers) {
          setTempUsers(response.data.tempUsers);
        } else {
          setError('Failed to fetch pending requests');
        }
      } catch (err) {
        setError('Failed to fetch pending requests');
        console.error('Error fetching temp users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTempUsers();
  }, []);

  const handleApprove = async (userId: string) => {
    setProcessingUsers((prev) => new Set(prev).add(userId));
    try {
      const response = await api.post('users/approve', {
        userId,
        approve: true,
      });

      if (response.status === 200) {
        toast.success('User approved successfully!');
        // Remove the user from the list
        setTempUsers((prev) => prev.filter((user) => user.id !== userId));
      } else {
        toast.error('Failed to approve user');
      }
    } catch (err) {
      console.error('Error approving user:', err);
      toast.error('Failed to approve user');
    } finally {
      setProcessingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleReject = async (userId: string) => {
    setProcessingUsers((prev) => new Set(prev).add(userId));
    try {
      const response = await api.post('/api/users/approve', {
        userId,
        approve: false,
      });

      if (response.status === 200) {
        toast.success('User request rejected');
        // Remove the user from the list
        setTempUsers((prev) => prev.filter((user) => user.id !== userId));
      } else {
        toast.error('Failed to reject user');
      }
    } catch (err) {
      console.error('Error rejecting user:', err);
      toast.error('Failed to reject user');
    } finally {
      setProcessingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  if (loading) {
    return <div className="p-4">Loading pending requests...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Pending User Requests</h1>
      <Table>
        <TableCaption>
          {tempUsers.length === 0
            ? 'No pending user requests'
            : 'List of users awaiting approval'}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">User ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tempUsers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                No pending requests found
              </TableCell>
            </TableRow>
          ) : (
            tempUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.id}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      user.role === 'admin'
                        ? 'bg-red-100 text-red-800'
                        : user.role === 'manager'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {user.role}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex gap-2 justify-center">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(user.id)}
                      disabled={processingUsers.has(user.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {processingUsers.has(user.id)
                        ? 'Processing...'
                        : 'Approve'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(user.id)}
                      disabled={processingUsers.has(user.id)}
                    >
                      {processingUsers.has(user.id)
                        ? 'Processing...'
                        : 'Reject'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
