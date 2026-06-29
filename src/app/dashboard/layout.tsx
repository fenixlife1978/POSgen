import Link from "next/link";
import { 
  LayoutDashboard, 
  Megaphone, 
  Users, 
  BarChart3, 
  Settings,
  Sparkles,
  Briefcase
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
      <Sidebar collapsible="icon" className="border-r-0 bg-background/50 backdrop-blur-lg">
        <SidebarHeader className="h-20 flex items-center px-6">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="size-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight group-data-[collapsible=icon]:hidden">
              MarketerPro
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-3">
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">Principal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Resumen" className="rounded-2xl h-12 px-4 transition-all hover:bg-primary/10 data-[active=true]:bg-primary/10">
                    <Link href="/dashboard">
                      <LayoutDashboard className="size-5" />
                      <span className="font-medium">Resumen</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Equipo" className="rounded-2xl h-12 px-4 transition-all hover:bg-primary/10">
                    <Link href="/dashboard/team">
                      <Briefcase className="size-5" />
                      <span className="font-medium">Equipo</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Campañas" className="rounded-2xl h-12 px-4 transition-all hover:bg-primary/10">
                    <Link href="/dashboard/campaigns">
                      <Megaphone className="size-5" />
                      <span className="font-medium">Campañas</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Leads" className="rounded-2xl h-12 px-4 transition-all hover:bg-primary/10">
                    <Link href="/dashboard/leads">
                      <Users className="size-5" />
                      <span className="font-medium">Leads</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Auditoría" className="rounded-2xl h-12 px-4 transition-all hover:bg-primary/10">
                    <Link href="/dashboard/analytics">
                      <BarChart3 className="size-5" />
                      <span className="font-medium">Auditoría</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          
          <SidebarGroup className="mt-auto">
            <SidebarGroupLabel className="px-4 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">Configuración</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Ajustes" className="rounded-2xl h-12 px-4 transition-all hover:bg-primary/10">
                    <Link href="/dashboard/settings">
                      <Settings className="size-5" />
                      <span className="font-medium">Ajustes</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      
      <SidebarInset className="bg-muted/30">
        <header className="sticky top-0 z-20 flex h-20 shrink-0 items-center justify-between px-8 bg-background/40 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="hover:bg-primary/10 rounded-xl" />
            <div className="h-6 w-px bg-border/60" />
            <nav className="flex items-center gap-2 text-sm font-medium">
              <span className="text-muted-foreground">Administración</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-foreground font-bold">Panel de Control</span>
            </nav>
          </div>
          <div className="flex items-center gap-6">
            <UserNav />
          </div>
        </header>
        <main className="p-8 max-w-[1600px] mx-auto w-full">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}