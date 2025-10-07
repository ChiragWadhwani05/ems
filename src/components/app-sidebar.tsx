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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Briefcase, CheckSquare, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
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
  const pathname = usePathname();

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
    { name: 'Users', path: '/dashboard/users', icon: Users },
    { name: 'Teams', path: '/dashboard/teams', icon: Briefcase },
    { name: 'Tasks', path: '/dashboard/tasks', icon: CheckSquare },
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
    routes.push({
      name: 'Requests',
      path: '/dashboard/requests',
      icon: UserCheck,
    });
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
              {routes.map((item) => {
                const isActive =
                  pathname === item.path ||
                  pathname.startsWith(item.path + '/');
                const IconComponent = item.icon;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      className={`transition-all duration-200 ${
                        isActive
                          ? 'bg-primary text-primary-foreground font-medium shadow-sm border-l-4 border-primary-foreground'
                          : 'hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      <Link href={item.path}>
                        <IconComponent className="w-4 h-4" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
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
