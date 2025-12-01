import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Calendar, 
  MessageCircle, 
  User, 
  Settings,
  LogOut,
  Menu,
  X,
  Stethoscope,
  FileText,
  Bell
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigationItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: Home,
      badge: null
    },
    {
      title: "Consultations",
      href: "/consultations",
      icon: Calendar,
      badge: null
    },
    {
      title: "Messages",
      href: "/chat",
      icon: MessageCircle,
      badge: 3 // Example unread count
    },
    {
      title: "Medical Records",
      href: "/records",
      icon: FileText,
      badge: null
    },
    {
      title: "Health Analysis",
      href: "/analysis",
      icon: Stethoscope,
      badge: null
    }
  ];

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const handleNavigation = (href: string) => {
    navigate(href);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Card className={cn(
      "fixed left-0 top-0 h-screen z-40 border-r bg-background transition-all duration-300",
      isCollapsed ? "w-16" : "w-64",
      className
    )}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div>
                <h2 className="text-lg font-semibold gradient-text">AI-Her</h2>
                <p className="text-sm text-muted-foreground">Healthcare Platform</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* User Profile */}
        {!isCollapsed && (
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user?.name}</p>
                <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
              </div>
              <Button variant="ghost" size="icon" className="flex-shrink-0">
                <Bell className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Button
                  key={item.href}
                  variant={active ? "secondary" : "ghost"}
                  size={isCollapsed ? "icon" : "default"}
                  className={cn(
                    "w-full justify-start transition-colors",
                    active && "bg-primary/10 text-primary hover:bg-primary/15",
                    isCollapsed && "px-2"
                  )}
                  onClick={() => handleNavigation(item.href)}
                >
                  <Icon className={cn("w-4 h-4", !isCollapsed && "mr-3")} />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t space-y-2">
          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "default"}
            className="w-full justify-start"
            onClick={() => navigate('/profile')}
          >
            <Settings className={cn("w-4 h-4", !isCollapsed && "mr-3")} />
            {!isCollapsed && "Settings"}
          </Button>
          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "default"}
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className={cn("w-4 h-4", !isCollapsed && "mr-3")} />
            {!isCollapsed && "Logout"}
          </Button>
        </div>
      </div>
    </Card>
  );
}