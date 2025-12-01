import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Award } from "lucide-react";

const Profile = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-subtle py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-2xl">
        <Card className="shadow-elevated">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Profile</CardTitle>
              <Badge variant="outline" className="text-sm">
                {user.role === "patient" ? "Patient" : "Doctor"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-gradient-primary p-4">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{user.name}</h3>
                <p className="text-muted-foreground">ID: {user.id}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>

              {user.mobile && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Mobile</p>
                    <p className="font-medium">{user.mobile}</p>
                  </div>
                </div>
              )}

              {user.role === "doctor" && user.specialization && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary">
                  <Award className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Specialization</p>
                    <p className="font-medium">{user.specialization}</p>
                  </div>
                </div>
              )}

              {user.role === "doctor" && user.licenseId && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary">
                  <Award className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">License ID</p>
                    <p className="font-medium">{user.licenseId}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4">
              <Button variant="destructive" onClick={logout} className="w-full">
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
