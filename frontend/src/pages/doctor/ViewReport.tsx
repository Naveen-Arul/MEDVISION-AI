import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Video, FileText, User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/services";
import { Consultation } from "@/lib/api";

const DoctorViewReport = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notes, setNotes] = useState("");
  const [report, setReport] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);

  // Calculate age from date of birth
  const calculateAge = (dob?: string) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Fetch consultation details
  useEffect(() => {
    const fetchConsultation = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await api.consultation.getConsultation(id);
        if (response.success && response.data) {
          setReport(response.data);
          setNotes(response.data.doctorNotes?.recommendations || "");
        }
      } catch (error) {
        console.error("Failed to fetch consultation:", error);
        toast({
          title: "Error",
          description: "Failed to load consultation details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConsultation();
  }, [id]);

  const handleStartConsultation = async () => {
    if (!id) return;
    
    try {
      // Start the video consultation
      const response = await api.consultation.startVideo(id);
      
      if (response.success && response.data) {
        // Navigate to the consultation page with the real room name
        navigate(`/doctor/consult/${response.data.jitsiRoomName}`, {
          state: {
            appointmentTime: new Date(report!.scheduledDateTime),
            consultationId: id,
            participants: response.data.participants
          },
        });
      } else {
        throw new Error(response.message || "Failed to start video consultation");
      }
    } catch (error) {
      console.error("Failed to start consultation:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start video consultation",
        variant: "destructive",
      });
    }
  };

  const handleSaveNotes = async () => {
    if (!id) return;
    
    try {
      const response = await api.consultation.updateNotes(id, {
        recommendations: notes,
        diagnosis: report?.doctorNotes?.diagnosis,
        severity: report?.doctorNotes?.severity
      });
      
      if (response.success) {
        toast({
          title: "Notes Saved",
          description: "Your medical notes have been saved successfully",
        });
      } else {
        throw new Error(response.message || "Failed to save notes");
      }
    } catch (error) {
      console.error("Failed to save notes:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save notes",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-subtle py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-subtle py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Consultation not found</p>
          </div>
        </div>
      </div>
    );
  }

  const patientAge = calculateAge(report.patient.profile?.dateOfBirth);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-subtle py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6">
          <Link to="/doctor/patients">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Patients
            </Button>
          </Link>
        </div>

        <div className="space-y-6">
          <Card className="shadow-elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-medical-blue-light p-3">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Patient Information</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Report #{report._id}
                    </p>
                  </div>
                </div>
                <Button onClick={handleStartConsultation}>
                  <Video className="h-4 w-4 mr-2" />
                  Start Consultation
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{report.patient.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Age</p>
                  <p className="font-medium">
                    {patientAge ? `${patientAge} years` : "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-medium">
                    {report.patient.profile?.gender || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {new Date(report.scheduledDateTime).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elevated">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle>AI Diagnosis Results</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-secondary">
                  <p className="text-sm text-muted-foreground mb-1">Diagnosis</p>
                  <p className="font-bold text-lg">
                    {report.doctorNotes?.diagnosis || "Pending review"}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-secondary">
                  <p className="text-sm text-muted-foreground mb-1">AI Confidence</p>
                  <p className="font-bold text-lg">
                    {report.relatedAnalysis?.length > 0 && report.relatedAnalysis[0].result.confidence
                      ? `${report.relatedAnalysis[0].result.confidence}%` 
                      : "N/A"}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-secondary">
                  <p className="text-sm text-muted-foreground mb-2">Severity</p>
                  <Badge variant="warning" className="text-sm">
                    {(report.doctorNotes?.severity || "low").toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="p-6 rounded-lg bg-medical-blue-light/30 border border-primary/20">
                <h3 className="font-semibold mb-3">AI Recommendation</h3>
                <p className="text-sm leading-relaxed">
                  {report.doctorNotes?.recommendations || "No recommendations provided"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle>Doctor's Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Medical Notes & Observations</Label>
                <Textarea
                  id="notes"
                  placeholder="Enter your medical notes, observations, and treatment recommendations..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
              </div>
              <Button onClick={handleSaveNotes} className="w-full">
                Save Notes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DoctorViewReport;