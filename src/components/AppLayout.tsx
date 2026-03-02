import { Outlet, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectCurrentUser, logout } from '@/features/auth/authSlice';
import { NavLink } from '@/components/NavLink';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader,
} from '@/components/ui/sidebar';
import { Car, LayoutDashboard, CalendarCheck, Wrench, Truck, FileText, AlertTriangle, LogOut } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';

const navItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Fleet', url: '/fleet', icon: Car },
  { title: 'Bookings', url: '/bookings', icon: CalendarCheck },
  { title: 'Maintenance', url: '/maintenance', icon: Wrench },
  { title: 'Jobs', url: '/jobs', icon: Truck },
  { title: 'Documents', url: '/documents', icon: FileText },
  { title: 'Fines', url: '/fines', icon: AlertTriangle },
];

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/fleet': 'Fleet Management',
  '/bookings': 'Bookings',
  '/maintenance': 'Maintenance & Repairs',
  '/jobs': 'Pickup & Delivery Jobs',
  '/documents': 'Documents',
  '/fines': 'PCNs / Fines',
};

export default function AppLayout() {
  const user = useAppSelector(selectCurrentUser);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const pageTitle = pageTitles[location.pathname] || 'FleetManager';

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader className="border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Car className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-sidebar-foreground">FleetManager</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map(item => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} end={item.url === '/'} className="hover:bg-muted/50" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                          <item.icon className="mr-2 h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <div className="mt-auto border-t p-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 truncate">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
                <StatusBadge status={user?.role || 'Staff'} variant={{ Admin: 'bg-purple-100 text-purple-700', Staff: 'bg-blue-100 text-blue-700' }} className="text-[10px]" />
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => dispatch(logout())}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Sidebar>

        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center gap-3 border-b bg-card px-4">
            <SidebarTrigger />
            <h2 className="text-lg font-semibold text-card-foreground">{pageTitle}</h2>
          </header>
          <main className="flex-1 overflow-auto bg-muted/30 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
