import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from '@/components/app-sidebar';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen">
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full">{children}</main>
      </SidebarProvider>
    </div>
  );
}
