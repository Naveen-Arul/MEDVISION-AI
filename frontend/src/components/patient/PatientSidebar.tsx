import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Upload, FileText, Video, Bot, Calendar } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/patient/dashboard", icon: LayoutDashboard },
  { title: "Upload Scan", url: "/patient/upload", icon: Upload },
  { title: "History", url: "/patient/history", icon: FileText },
  { title: "My Appointments", url: "/patient/appointments", icon: Calendar },
  { title: "Book Consultation", url: "/patient/consult", icon: Video },
  { title: "AI Assistant", url: "/patient/ai-assistant", icon: Bot },
];

const PatientSidebar = () => {
  const location = useLocation();

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-gradient-primary p-2">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <span className="font-semibold text-foreground">Patient Portal</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default PatientSidebar;
