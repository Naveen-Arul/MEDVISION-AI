import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Video, Activity, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import PatientLayout from "@/components/patient/PatientLayout";
import { api } from "@/lib/services";
import { Consultation } from "@/lib/api";

const PatientDashboard = () => {
  const { user } = useAuth();
  const [upcomingConsultations, setUpcomingConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch upcoming consultations
  useEffect(() => {
    const fetchUpcomingConsultations = async () => {
      try {
        setLoading(true);
        const response = await api.consultation.getUpcoming();
        if (response.success) {
          setUpcomingConsultations(response.data.slice(0, 3)); // Show only first 3
        }
      } catch (error) {
        console.error("Failed to fetch upcoming consultations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingConsultations();
  }, []);

  return (
    <PatientLayout>
      <div className="bg-gradient-subtle py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-muted-foreground">Manage your health records and consultations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/patient/upload">
            <Card className="shadow-card hover:shadow-elevated transition-all cursor-pointer h-full">
              <CardHeader>
                <div className="rounded-full bg-medical-blue-light p-3 w-fit mb-2">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Upload X-Ray</CardTitle>
                <CardDescription>
                  Upload chest X-ray for AI-powered pneumonia diagnosis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Start Upload</Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/patient/history">
            <Card className="shadow-card hover:shadow-elevated transition-all cursor-pointer h-full">
              <CardHeader>
                <div className="rounded-full bg-medical-blue-light p-3 w-fit mb-2">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Medical History</CardTitle>
                <CardDescription>
                  View all your past diagnoses and reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">View History</Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/patient/consult">
            <Card className="shadow-card hover:shadow-elevated transition-all cursor-pointer h-full">
              <CardHeader>
                <div className="rounded-full bg-medical-blue-light p-3 w-fit mb-2">
                  <Video className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Consult Doctor</CardTitle>
                <CardDescription>
                  Schedule video consultation with healthcare professionals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">Book Consultation</Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        <Card className="mt-8 shadow-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle>Upcoming Consultations</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : upcomingConsultations.length > 0 ? (
              <div className="space-y-3">
                {upcomingConsultations.map((consultation) => (
                  <div key={consultation._id} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                    <div>
                      <p className="font-medium text-sm">{consultation.doctor.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(consultation.scheduledDateTime).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/patient/consult/${consultation._id}`}>
                        Join
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No upcoming consultations</p>
                <p className="text-sm mt-2">Book a consultation with a doctor to see it here</p>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </PatientLayout>
  );
};

export default PatientDashboard;