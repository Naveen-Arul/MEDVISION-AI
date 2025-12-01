import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { Star, Award, Clock, Loader2 } from "lucide-react";
import PatientLayout from "@/components/patient/PatientLayout";
import { api } from "@/lib/services";
import { User } from "@/lib/api";

const PatientConsult = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeSlots, setTimeSlots] = useState<Array<{time: string, display: string}>>([]);

  // Fetch available doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const response = await api.consultation.getDoctors();
        if (response.success) {
          setDoctors(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch doctors:", error);
        toast({
          title: "Error",
          description: "Failed to load available doctors",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // Fetch doctor availability when a doctor and date are selected
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedDoctor || !selectedDate) {
        setTimeSlots([]);
        return;
      }

      try {
        const dateString = selectedDate.toISOString().split('T')[0];
        const response = await api.consultation.getAvailability(selectedDoctor, dateString);
        if (response.success) {
          setTimeSlots(response.data.availableSlots);
        }
      } catch (error) {
        console.error("Failed to fetch availability:", error);
        toast({
          title: "Error",
          description: "Failed to load available time slots",
          variant: "destructive",
        });
      }
    };

    fetchAvailability();
  }, [selectedDoctor, selectedDate]);

  const handleBooking = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      toast({
        title: "Error",
        description: "Please select a doctor, date, and time slot",
        variant: "destructive",
      });
      return;
    }

    try {
      // Find the selected time slot
      const selectedSlot = timeSlots.find(slot => slot.display === selectedTime);
      if (!selectedSlot) {
        toast({
          title: "Error",
          description: "Invalid time slot selected",
          variant: "destructive",
        });
        return;
      }

      // Book the consultation
      const consultationData = {
        doctorId: selectedDoctor,
        scheduledDateTime: selectedSlot.time,
        type: "routine" as const,
        reason: "General consultation",
        duration: 30
      };

      const response = await api.consultation.bookConsultation(consultationData);
      
      if (response.success && response.data) {
        toast({
          title: "Consultation Booked",
          description: `Your appointment has been scheduled for ${selectedTime}`,
        });

        // Navigate to the consultation page
        navigate(`/patient/consult/${response.data._id}`);
      } else {
        throw new Error(response.message || "Failed to book consultation");
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to book consultation",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <PatientLayout>
        <div className="bg-gradient-subtle py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="bg-gradient-subtle py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Book Consultation</h1>
          <p className="text-muted-foreground">Choose a doctor and schedule your appointment</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card className="shadow-elevated">
              <CardHeader>
                <CardTitle>Available Doctors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {doctors.map((doctor) => (
                  <div
                    key={doctor._id}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      selectedDoctor === doctor._id
                        ? "border-primary bg-medical-blue-light"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedDoctor(doctor._id)}
                  >
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="bg-gradient-primary text-white text-lg">
                          {doctor.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{doctor.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {doctor.profile?.specialization || "General Practitioner"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <div className="flex items-center gap-1">
                            <Award className="h-4 w-4 text-primary" />
                            <span>{doctor.profile?.experience || "N/A"} years</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-warning fill-warning" />
                            <span>{doctor.profile?.rating || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="shadow-elevated">
              <CardHeader>
                <CardTitle>Select Date</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            <Card className="shadow-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Time Slot
                </CardTitle>
              </CardHeader>
              <CardContent>
                {timeSlots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {timeSlots.map((slot) => (
                      <Button
                        key={slot.time}
                        variant={selectedTime === slot.display ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTime(slot.display)}
                        className="text-sm"
                      >
                        {slot.display}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {selectedDoctor && selectedDate 
                      ? "No available slots for this date" 
                      : "Select a doctor and date to see available slots"}
                  </p>
                )}
              </CardContent>
            </Card>

            <Button
              className="w-full"
              size="lg"
              onClick={handleBooking}
              disabled={!selectedDoctor || !selectedDate || !selectedTime}
            >
              Confirm Booking
            </Button>
          </div>
        </div>
        </div>
      </div>
    </PatientLayout>
  );
};

export default PatientConsult;