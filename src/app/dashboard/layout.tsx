import Link from "next/link";
import { 
  LayoutDashboard, 
  Megaphone, 
  Users, 
  BarChart3, 
  Settings,
  PlusCircle
} from "lucide-react";

import { UserNav } from "@/components/user-nav";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent
} from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r">
        <SidebarHeader className="border-b h-16 flex items-center px-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary shadow-sm">
              <Megaphone className="size-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold tracking-tighter group-data-[collapsible=icon]:hidden">
              MarketerPro
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Principal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Resumen">
                    <Link href="/dashboard">
                      <LayoutDashboard />
                      <span>Resumen</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Campañas">
                    <Link href="/dashboard/campaigns">
                      <Megaphone />
                      <span>Campañas</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Leads">
                    <Link href="/dashboard/leads">
                      <Users />
                      <span>Leads</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Analítica">
                    <Link href="/dashboard/analytics">
                      <BarChart3 />
                      <span>Analítica</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          
          <SidebarGroup>
            <SidebarGroupLabel>Configuración</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Ajustes">
                    <Link href="/dashboard/settings">
                      <Settings />
                      <span>Ajustes</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="h-4 w-px bg-border" />
            <h2 className="text-sm font-medium text-muted-foreground">Admin / Dashboard</h2>
          </div>
          <div className="flex items-center gap-4">
            <UserNav />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-muted/20">
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
