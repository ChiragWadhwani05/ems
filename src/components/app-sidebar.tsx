'use client';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';

interface UserData {
  name: string;
  email: string;
  role: string;
}

export default function AppSidebar() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get('users/me');
        setUserData(response.data.data);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const routes = [
    { name: 'Users', path: '/dashboard/users' },
    { name: 'Teams', path: '/dashboard/teams' },
    { name: 'Tasks', path: '/dashboard/tasks' },
  ];

  const handleLogout = async () => {
    try {
      await api.post('auth/logout');
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (userData?.role === 'admin') {
    routes.push({ name: 'Requests', path: '/dashboard/requests' });
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="py-4 w-full flex justify-start gap-2 items-center">
          <Avatar className="w-12 h-12">
            {/* <AvatarImage src="https://github.com/shadcn.png" /> */}
            <AvatarFallback className="text-[20px]">
              {userData?.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          {userData ? (
            <div>
              <p className="font-medium">{userData.name}</p>
              <p className="text-sm text-muted-foreground">{userData.email}</p>
            </div>
          ) : (
            <p>Loading user info...</p>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="space-y-1">
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {routes.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild>
                    <Link href={item.path}>
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button onClick={handleLogout}>Logout</Button>
      </SidebarFooter>
    </Sidebar>
  );
}
