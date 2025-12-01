import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Activity, User, LogOut, ChevronDown, UserPlus, Stethoscope } from "lucide-react";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  const isPatientRoute = location.pathname.startsWith("/patient");
  const isDoctorRoute = location.pathname.startsWith("/doctor");

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="rounded-lg bg-gradient-primary p-2">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">MedVision AI</span>
          </Link>

          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <>
                {isDoctorRoute && (
                  <div className="hidden md:flex items-center gap-2">
                    <Link to="/doctor/dashboard">
                      <Button variant="ghost" size="sm">Dashboard</Button>
                    </Link>
                    <Link to="/doctor/patients">
                      <Button variant="ghost" size="sm">Patients</Button>
                    </Link>
                  </div>
                )}

                <Link to="/profile">
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    {user.name}
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm">
                      Get Started
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to="/signup-patient" className="flex items-center gap-2 cursor-pointer">
                        <UserPlus className="h-4 w-4" />
                        Sign up as Patient
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/signup-doctor" className="flex items-center gap-2 cursor-pointer">
                        <Stethoscope className="h-4 w-4" />
                        Sign up as Doctor
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
