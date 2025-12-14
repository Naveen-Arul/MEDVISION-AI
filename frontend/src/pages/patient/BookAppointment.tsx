import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Stethoscope,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import PatientLayout from "@/components/patient/PatientLayout";
import { consultationService } from "@/lib/services";
import { generateRoomId } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const BookAppointment = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [doctor, setDoctor] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [reason, setReason] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [consultationType, setConsultationType] = useState<string>("routine");
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    fetchDoctorDetails();
  }, [doctorId]);

  const fetchDoctorDetails = async () => {
    try {
      setIsLoading(true);
      const response = await consultationService.getDoctors();

      if (response.success && response.data) {
        const foundDoctor = response.data.find((d) => d._id === doctorId);
        if (foundDoctor) {
          setDoctor(foundDoctor);
        } else {
          toast({
            title: "Error",
            description: "Doctor not found",
            variant: "destructive",
          });
          navigate("/patient/consult");
        }
      }
    } catch (error) {
      console.error("Failed to fetch doctor:", error);
      toast({
        title: "Error",
        description: "Failed to load doctor information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime || !reason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select date, time, and provide a reason for consultation",
        variant: "destructive",
      });
      return;
    }

    if (reason.trim().length < 10) {
      toast({
        title: "Reason Too Short",
        description: "Please provide at least 10 characters describing your health concern",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsBooking(true);

      // Parse time from input (format: "HH:MM")
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const scheduledDateTime = new Date(selectedDate);
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      const consultationData = {
        doctorId: doctorId!,
        scheduledDateTime: scheduledDateTime.toISOString(),
        duration: 30,
        type: consultationType as any,
        specialization: (doctor as any)?.specialization || "general",
        reason: reason.trim(),
        symptoms: symptoms.trim().split(",").map((s) => s.trim()).filter(Boolean),
      };

      const response = await consultationService.bookConsultation(consultationData);

      if (response.success && response.data) {
        toast({
          title: "Request Sent Successfully!",
          description: "Your consultation request has been sent to the doctor. You will be notified once approved.",
        });
        navigate(`/patient/consult/${response.data._id}`);
      } else {
        throw new Error(response.message || "Failed to send consultation request");
      }
    } catch (error: any) {
      console.error("Request failed:", error);
      toast({
        title: "Request Failed",
        description: error.message || "Failed to send consultation request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };

  const isDateDisabled = (date: Date): boolean => {
    // Only disable dates before today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
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

  return (
    <PatientLayout>
      <div className="bg-gradient-subtle py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/patient/consult")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Doctors
            </Button>
            <h1 className="text-3xl font-bold mb-2">Request Consultation</h1>
            <p className="text-muted-foreground">
              Send a consultation request to {doctor?.name}. Select your preferred time and the doctor will review your request.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Doctor Info Card */}
            <Card className="lg:col-span-1 h-fit">
              <CardHeader>
                <CardTitle className="text-lg">Doctor Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Stethoscope className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{doctor?.name}</h3>
                    <Badge variant="secondary" className="mt-1">
                      {doctor?.specialization || "General"}
                    </Badge>
                  </div>
                </div>
                {doctor?.email && (
                  <p className="text-sm text-muted-foreground mb-2">{doctor.email}</p>
                )}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>15+ years experience</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Available for online consultation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>30 min consultation</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Form */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Schedule Your Appointment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Consultation Type */}
                <div>
                  <Label htmlFor="type">Consultation Type</Label>
                  <Select value={consultationType} onValueChange={setConsultationType}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Routine Checkup</SelectItem>
                      <SelectItem value="follow_up">Follow-up</SelectItem>
                      <SelectItem value="urgent">Urgent Care</SelectItem>
                      <SelectItem value="second_opinion">Second Opinion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Selection */}
                <div>
                  <Label className="mb-2 block">
                    <CalendarIcon className="h-4 w-4 inline mr-2" />
                    Select Date
                  </Label>
                  <div className="border rounded-lg p-4">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={isDateDisabled}
                      className="rounded-md"
                    />
                  </div>
                </div>

                {/* Time Input */}
                {selectedDate && (
                  <div>
                    <Label htmlFor="consultation-time" className="mb-2 block">
                      <Clock className="h-4 w-4 inline mr-2" />
                      Select Your Preferred Time
                    </Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Choose any time. The doctor will review and approve your request.
                    </p>
                    <Input
                      id="consultation-time"
                      type="time"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full max-w-xs"
                      required
                    />
                  </div>
                )}

                {/* Reason for Consultation */}
                <div>
                  <Label htmlFor="reason">
                    Reason for Consultation * (minimum 10 characters)
                  </Label>
                  <Textarea
                    id="reason"
                    placeholder="Describe your health concern in detail (at least 10 characters)..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className={reason.trim().length > 0 && reason.trim().length < 10 ? "border-red-500" : ""}
                  />
                  {reason.trim().length > 0 && reason.trim().length < 10 && (
                    <p className="text-xs text-red-500 mt-1">
                      {10 - reason.trim().length} more characters needed
                    </p>
                  )}
                </div>

                {/* Symptoms */}
                <div>
                  <Label htmlFor="symptoms">Symptoms (comma-separated)</Label>
                  <Textarea
                    id="symptoms"
                    placeholder="e.g., fever, cough, headache"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Booking Summary */}
                {selectedDate && selectedTime && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-6">
                      <h4 className="font-semibold mb-2">Request Summary</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        This is a consultation request. The doctor will review and confirm your preferred time.
                      </p>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-medium">Date:</span>{" "}
                          {selectedDate.toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <p>
                          <span className="font-medium">Preferred Time:</span> {selectedTime}
                        </p>
                        <p>
                          <span className="font-medium">Duration:</span> 30 minutes
                        </p>
                        <p>
                          <span className="font-medium">Type:</span>{" "}
                          {consultationType.replace("_", " ")}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Confirm Button */}
                <Button
                  onClick={handleBookAppointment}
                  disabled={!selectedDate || !selectedTime || !reason.trim() || isBooking}
                  className="w-full"
                  size="lg"
                >
                  {isBooking ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending Request...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Send Consultation Request
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PatientLayout>
  );
};

export default BookAppointment;
