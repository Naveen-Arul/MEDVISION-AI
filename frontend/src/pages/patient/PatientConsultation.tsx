import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  VideoOff,
  Stethoscope,
  Loader2,
  FileText,
  Phone,
} from "lucide-react";
import PatientLayout from "@/components/patient/PatientLayout";
import { consultationService } from "@/lib/services";
import { isAppointmentTimeReached, getTimeUntilAppointment, Consultation } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const PatientConsultation = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [callEnded, setCallEnded] = useState(false);

  useEffect(() => {
    fetchConsultation();
  }, [appointmentId]);

  useEffect(() => {
    if (!consultation) return;

    // Check if appointment time has arrived
    const checkTime = () => {
      const timeReached = isAppointmentTimeReached(consultation.scheduledDateTime);
      setShowVideo(timeReached);

      if (!timeReached) {
        setTimeRemaining(getTimeUntilAppointment(consultation.scheduledDateTime));
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 1000); // Check every second

    return () => clearInterval(interval);
  }, [consultation]);

  const fetchConsultation = async () => {
    try {
      setIsLoading(true);
      const response = await consultationService.getConsultation(appointmentId!);

      if (response.success && response.data) {
        setConsultation(response.data);
      } else {
        toast({
          title: "Error",
          description: "Consultation not found",
          variant: "destructive",
        });
        navigate("/patient/dashboard");
      }
    } catch (error) {
      console.error("Failed to fetch consultation:", error);
      toast({
        title: "Error",
        description: "Failed to load consultation details",
        variant: "destructive",
      });
      navigate("/patient/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndCall = async () => {
    setCallEnded(true);
    setShowVideo(false);

    // Update consultation status to completed
    try {
      await consultationService.updateStatus(consultation!._id, "completed");

      toast({
        title: "Consultation Ended",
        description: "The consultation has been marked as completed",
      });
    } catch (error) {
      console.error("Failed to update status:", error);
      toast({
        title: "Call Ended",
        description: "The consultation has been ended",
      });
    }
  };

  const handleBackToDashboard = () => {
    navigate("/patient/dashboard");
  };

  if (isLoading) {
    return (
      <PatientLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PatientLayout>
    );
  }

  if (!consultation) {
    return null;
  }

  const scheduledDate = new Date(consultation.scheduledDateTime);
  const roomId = consultation.videoCall?.jitsiRoomName || consultation.videoCall?.roomId;

  return (
    <PatientLayout>
      <div className="bg-gradient-subtle min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button variant="ghost" onClick={handleBackToDashboard} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold mb-2">Consultation Session</h1>
            <p className="text-muted-foreground">
              {showVideo
                ? "Your video consultation is live"
                : "Waiting for your scheduled appointment time"}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar - Consultation Details */}
            <div className="lg:col-span-1 space-y-4">
              {/* Doctor Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Doctor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Stethoscope className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{consultation.doctor.name}</p>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {consultation.specialization}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Appointment Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Appointment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">
                        {scheduledDate.toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">
                        {scheduledDate.toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Duration: {consultation.duration} minutes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Type</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {consultation.type.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge
                    variant={
                      consultation.status === "completed"
                        ? "default"
                        : consultation.status === "in_progress"
                        ? "default"
                        : "secondary"
                    }
                    className="w-full justify-center"
                  >
                    {consultation.status.replace("_", " ").toUpperCase()}
                  </Badge>
                  {!showVideo && !callEnded && (
                    <p className="text-sm text-muted-foreground mt-3 text-center">
                      Time until call: <span className="font-bold text-primary">{timeRemaining}</span>
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Reason */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Reason for Visit</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{consultation.reason}</p>
                  {consultation.symptoms && consultation.symptoms.length > 0 && (
                    <>
                      <p className="text-xs font-semibold mt-3 mb-1">Symptoms:</p>
                      <div className="flex flex-wrap gap-1">
                        {consultation.symptoms.map((symptom, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {symptom}
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Main Content - Video Area */}
            <div className="lg:col-span-3">
              <Card className="h-full">
                <CardContent className="p-0">
                  {!showVideo && !callEnded ? (
                    // Waiting State
                    <div className="flex flex-col items-center justify-center min-h-[600px] p-8">
                      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                        <Clock className="h-12 w-12 text-primary animate-pulse" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Waiting for Appointment Time</h2>
                      <p className="text-muted-foreground mb-6 text-center max-w-md">
                        Your consultation is scheduled for{" "}
                        <span className="font-semibold">
                          {scheduledDate.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        . The video call will open automatically here.
                      </p>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">Time remaining:</p>
                        <p className="text-4xl font-bold text-primary">{timeRemaining}</p>
                      </div>
                      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md">
                        <p className="text-sm text-blue-900">
                          <strong>Tip:</strong> Make sure your camera and microphone are working.
                          The call window will appear automatically at the scheduled time.
                        </p>
                      </div>
                    </div>
                  ) : callEnded ? (
                    // Call Ended State
                    <div className="flex flex-col items-center justify-center min-h-[600px] p-8">
                      <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6">
                        <VideoOff className="h-12 w-12 text-green-600" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Consultation Ended</h2>
                      <p className="text-muted-foreground mb-6">
                        Thank you for using MedVision AI. Your consultation notes will be available
                        shortly.
                      </p>
                      <div className="flex gap-3">
                        <Button onClick={handleBackToDashboard}>
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Back to Dashboard
                        </Button>
                        <Button variant="outline" onClick={() => navigate("/patient/history")}>
                          <FileText className="h-4 w-4 mr-2" />
                          View Medical Records
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Video Call Active
                    <div className="relative">
                      <div className="bg-gray-900 rounded-lg overflow-hidden">
                        {roomId ? (
                          <iframe
                            src={`https://meet.jit.si/${roomId}`}
                            allow="camera; microphone; fullscreen; display-capture; autoplay"
                            style={{
                              width: "100%",
                              height: "600px",
                              border: "none",
                            }}
                            title="Video Consultation"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-[600px] text-white">
                            <p>Video room not available</p>
                          </div>
                        )}
                      </div>

                      {/* Call Controls */}
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3 bg-black/50 backdrop-blur-sm rounded-full px-6 py-3">
                        <Button
                          size="lg"
                          variant="destructive"
                          onClick={handleEndCall}
                          className="rounded-full"
                        >
                          <Phone className="h-5 w-5 mr-2" />
                          End Consultation
                        </Button>
                      </div>

                      {/* Live Indicator */}
                      <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        <span className="text-sm font-semibold">LIVE</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PatientLayout>
  );
};

export default PatientConsultation;
