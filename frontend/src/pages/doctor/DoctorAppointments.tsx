import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  Video,
  User,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { consultationService } from "@/lib/services";
import { Consultation } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const DoctorAppointments = () => {
  const [upcomingConsultations, setUpcomingConsultations] = useState<Consultation[]>([]);
  const [pastConsultations, setPastConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      setIsLoading(true);

      // Fetch all consultations
      const response = await consultationService.getConsultations();

      if (response.success && response.data?.consultations) {
        const consultations = response.data.consultations;

        // Separate into upcoming and past
        const now = new Date();
        const upcoming = consultations.filter(
          (c) => {
            const scheduledTime = new Date(c.scheduledDateTime);
            const thirtyMinutesAfter = new Date(scheduledTime.getTime() + 30 * 60 * 1000);
            
            // Show as upcoming if:
            // 1. Scheduled for future, OR
            // 2. Currently active (within 30 minutes after scheduled time)
            return (scheduledTime >= now || (now < thirtyMinutesAfter && (c.status === "scheduled" || c.status === "confirmed" || c.status === "in_progress")));
          }
        );
        const past = consultations.filter(
          (c) => {
            const scheduledTime = new Date(c.scheduledDateTime);
            const thirtyMinutesAfter = new Date(scheduledTime.getTime() + 30 * 60 * 1000);
            
            // Show as past if ended or more than 30 minutes after scheduled time
            return (now >= thirtyMinutesAfter || c.status === "completed" || c.status === "cancelled");
          }
        );

        setUpcomingConsultations(upcoming);
        setPastConsultations(past);
      }
    } catch (error) {
      console.error("Failed to fetch consultations:", error);
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTerminate = async (consultationId: string) => {
    try {
      await consultationService.updateStatus(consultationId, "completed");
      toast({
        title: "Success",
        description: "Consultation has been ended and moved to past appointments",
      });
      // Refresh the list
      fetchConsultations();
    } catch (error) {
      console.error("Failed to terminate consultation:", error);
      toast({
        title: "Error",
        description: "Failed to end consultation",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      scheduled: { variant: "secondary", icon: Clock, label: "Scheduled" },
      confirmed: { variant: "default", icon: CheckCircle2, label: "Confirmed" },
      in_progress: { variant: "default", icon: Video, label: "In Progress" },
      completed: { variant: "default", icon: CheckCircle2, label: "Completed" },
      cancelled: { variant: "destructive", icon: XCircle, label: "Cancelled" },
      no_show: { variant: "destructive", icon: AlertCircle, label: "No Show" },
    };

    const config = variants[status] || variants.scheduled;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getSeverityBadge = (severity?: string) => {
    if (!severity) return null;

    const colors: Record<string, string> = {
      low: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800",
    };

    return (
      <Badge className={colors[severity] || "bg-gray-100 text-gray-800"} variant="secondary">
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const isAppointmentNow = (scheduledDateTime: string): boolean => {
    const appointmentTime = new Date(scheduledDateTime).getTime();
    const now = new Date().getTime();
    const fiveMinutes = 5 * 60 * 1000;

    // Allow joining 5 minutes before scheduled time
    return now >= appointmentTime - fiveMinutes && now <= appointmentTime + 30 * 60 * 1000;
  };

  const renderConsultationRow = (consultation: Consultation, canJoin: boolean = false) => {
    const scheduledDate = new Date(consultation.scheduledDateTime);
    const isNow = isAppointmentNow(consultation.scheduledDateTime);

    return (
      <TableRow key={consultation._id}>
        <TableCell>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{consultation.patient.name}</p>
              <p className="text-xs text-muted-foreground">{consultation.patient.email}</p>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-col">
            <span className="font-medium">
              {scheduledDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span className="text-sm text-muted-foreground">
              {scheduledDate.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <div className="max-w-xs truncate" title={consultation.reason}>
            {consultation.reason}
          </div>
          {consultation.symptoms && consultation.symptoms.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {consultation.symptoms.slice(0, 2).map((symptom, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {symptom}
                </Badge>
              ))}
              {consultation.symptoms.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{consultation.symptoms.length - 2} more
                </Badge>
              )}
            </div>
          )}
        </TableCell>
        <TableCell>
          <span className="capitalize">{consultation.type.replace("_", " ")}</span>
        </TableCell>
        <TableCell>{getStatusBadge(consultation.status)}</TableCell>
        <TableCell>
          <div className="flex gap-2">
            {canJoin && isNow ? (
              <Link to={`/doctor/consult/${consultation._id}`}>
                <Button size="sm">
                  <Video className="h-4 w-4 mr-2" />
                  Join Now
                </Button>
              </Link>
            ) : canJoin ? (
              <Button size="sm" variant="outline" disabled>
                <Clock className="h-4 w-4 mr-2" />
                Waiting
              </Button>
            ) : (
              <Link to={`/doctor/consult/${consultation._id}`}>
                <Button size="sm" variant="ghost">
                  View Details
                </Button>
              </Link>
            )}
            {canJoin && (
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => handleTerminate(consultation._id)}
              >
                End
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Appointments</h1>
        <p className="text-muted-foreground">Manage your consultation schedule</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Today</p>
                <p className="text-2xl font-bold">
                  {upcomingConsultations.filter((c) => {
                    const today = new Date().toDateString();
                    return new Date(c.scheduledDateTime).toDateString() === today;
                  }).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold">{upcomingConsultations.length}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {pastConsultations.filter((c) => c.status === "completed").length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Now</p>
                <p className="text-2xl font-bold">
                  {upcomingConsultations.filter((c) => isAppointmentNow(c.scheduledDateTime))
                    .length}
                </p>
              </div>
              <Video className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Appointments Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upcoming">
            <TabsList className="mb-4">
              <TabsTrigger value="upcoming">
                Upcoming ({upcomingConsultations.length})
              </TabsTrigger>
              <TabsTrigger value="past">Past ({pastConsultations.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              {upcomingConsultations.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No upcoming appointments</h3>
                  <p className="text-muted-foreground">
                    You don't have any scheduled consultations
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Reason & Symptoms</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcomingConsultations.map((consultation) =>
                        renderConsultationRow(consultation, true)
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="past">
              {pastConsultations.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No past appointments</h3>
                  <p className="text-muted-foreground">Your completed consultations will appear here</p>
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Reason & Symptoms</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pastConsultations.map((consultation) =>
                        renderConsultationRow(consultation, false)
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorAppointments;
