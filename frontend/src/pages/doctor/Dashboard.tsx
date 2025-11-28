import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, AlertCircle, FileText, Activity, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/services";
import { Consultation } from "@/lib/api";

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState([
    {
      title: "Pending Patients",
      value: "0",
      description: "Awaiting diagnosis review",
      icon: Users,
      color: "text-primary",
    },
    {
      title: "High Risk Cases",
      value: "0",
      description: "Require immediate attention",
      icon: AlertCircle,
      color: "text-destructive",
    },
    {
      title: "Reports Reviewed",
      value: "0",
      description: "This month",
      icon: FileText,
      color: "text-success",
    },
  ]);
  const [upcomingConsultations, setUpcomingConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch consultations
        const consultationsResponse = await api.consultation.getConsultations();
        const upcomingResponse = await api.consultation.getUpcoming();
        
        if (consultationsResponse.success) {
          const consultations = consultationsResponse.data.consultations;
          
          // Calculate stats
          const pendingPatients = consultations.filter((c: Consultation) => c.status === 'scheduled').length;
          const highRiskCases = consultations.filter((c: Consultation) => 
            c.doctorNotes?.severity === 'high' || c.doctorNotes?.severity === 'critical'
          ).length;
          const reportsReviewed = consultations.filter((c: Consultation) => 
            c.status === 'completed' || c.status === 'in_progress'
          ).length;
          
          setStats([
            {
              title: "Pending Patients",
              value: pendingPatients.toString(),
              description: "Awaiting diagnosis review",
              icon: Users,
              color: "text-primary",
            },
            {
              title: "High Risk Cases",
              value: highRiskCases.toString(),
              description: "Require immediate attention",
              icon: AlertCircle,
              color: "text-destructive",
            },
            {
              title: "Reports Reviewed",
              value: reportsReviewed.toString(),
              description: "This month",
              icon: FileText,
              color: "text-success",
            },
          ]);
        }
        
        if (upcomingResponse.success) {
          setUpcomingConsultations(upcomingResponse.data.slice(0, 3)); // Show only first 3
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-subtle py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-subtle py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name}!</h1>
          <p className="text-muted-foreground">
            {user?.profile?.specialization && `${user.profile.specialization} Specialist`}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="shadow-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription>{stat.title}</CardDescription>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <p className="text-sm text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link to="/doctor/patients">
            <Card className="shadow-card hover:shadow-elevated transition-all cursor-pointer h-full">
              <CardHeader>
                <div className="rounded-full bg-medical-blue-light p-3 w-fit mb-2">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>View Patient Reports</CardTitle>
                <CardDescription>
                  Review and analyze patient diagnoses and medical records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">View All Patients</Button>
              </CardContent>
            </Card>
          </Link>

          <Card className="shadow-card">
            <CardHeader>
              <div className="rounded-full bg-medical-blue-light p-3 w-fit mb-2">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Scheduled Consultations</CardTitle>
              <CardDescription>
                Upcoming video consultations with patients
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingConsultations.length > 0 ? (
                <div className="space-y-3">
                  {upcomingConsultations.map((consultation) => (
                    <div key={consultation._id} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                      <div>
                        <p className="font-medium text-sm">{consultation.patient.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(consultation.scheduledDateTime).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No upcoming consultations</p>
                  <p className="text-sm mt-2">Your scheduled calls will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;