import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CalendarIcon, 
  Clock, 
  DollarSign, 
  User, 
  Video,
  X,
  Search,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { consultationService, doctorService } from "@/lib/services";
import { Consultation, Doctor, APIResponse } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface BookConsultationProps {
  onClose: () => void;
  onSuccess: (consultation: Consultation) => void;
}

interface TimeSlot {
  time: string;
  available: boolean;
  price: number;
}

interface BookingForm {
  doctorId: string;
  date: Date | undefined;
  timeSlot: string;
  consultationType: 'video' | 'phone';
  reason: string;
  symptoms: string;
  duration: number;
  urgency: 'low' | 'medium' | 'high';
}

interface BookingFormErrors {
  doctorId?: string;
  date?: string;
  timeSlot?: string;
  reason?: string;
  [key: string]: string | undefined;
}

function BookConsultation({ onClose, onSuccess }: BookConsultationProps) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { toast } = useToast();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [step, setStep] = useState(1); // 1: Select Doctor, 2: Book Appointment

  const [form, setForm] = useState<BookingForm>({
    doctorId: '',
    date: undefined,
    timeSlot: '',
    consultationType: 'video',
    reason: '',
    symptoms: '',
    duration: 30,
    urgency: 'medium'
  });

  const [errors, setErrors] = useState<BookingFormErrors>({});

  // Load doctors on mount
  useEffect(() => {
    loadDoctors();
  }, []);

  // Load available slots when doctor and date change
  useEffect(() => {
    if (selectedDoctor && form.date) {
      loadAvailableSlots();
    }
  }, [selectedDoctor, form.date]);

  // Real-time availability updates
  useEffect(() => {
    if (socket) {
      socket.on('slot_booked', (data) => {
        if (data.doctorId === form.doctorId && 
            format(form.date!, 'yyyy-MM-dd') === data.date) {
          setAvailableSlots(prev => 
            prev.map(slot => 
              slot.time === data.timeSlot 
                ? { ...slot, available: false }
                : slot
            )
          );
        }
      });

      socket.on('slot_cancelled', (data) => {
        if (data.doctorId === form.doctorId && 
            format(form.date!, 'yyyy-MM-dd') === data.date) {
          setAvailableSlots(prev => 
            prev.map(slot => 
              slot.time === data.timeSlot 
                ? { ...slot, available: true }
                : slot
            )
          );
        }
      });

      return () => {
        socket.off('slot_booked');
        socket.off('slot_cancelled');
      };
    }
  }, [socket, form.doctorId, form.date]);

  const loadDoctors = async () => {
    try {
      setIsLoading(true);
      const response = await doctorService.getAllDoctors(1, 20);
      
      if (response.success && response.data?.doctors) {
        setDoctors(response.data.doctors);
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
      toast({
        title: "Error",
        description: "Failed to load doctors. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedDoctor || !form.date) return;

    try {
      setIsLoading(true);
      const dateStr = format(form.date, 'yyyy-MM-dd');
      const response = await doctorService.getAvailability(selectedDoctor._id, dateStr);
      
      if (response.success && response.data) {
        setAvailableSlots(response.data);
      }
    } catch (error) {
      console.error('Error loading slots:', error);
      toast({
        title: "Error",
        description: "Failed to load available time slots.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: BookingFormErrors = {};

    if (!form.doctorId) newErrors.doctorId = 'Please select a doctor';
    if (!form.date) newErrors.date = 'Please select a date';
    if (!form.timeSlot) newErrors.timeSlot = 'Please select a time slot';
    if (!form.reason.trim()) newErrors.reason = 'Please provide a reason for consultation';
    if (form.reason.length < 10) newErrors.reason = 'Reason should be at least 10 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBooking = async () => {
    if (!validateForm()) return;

    try {
      setIsBooking(true);
      
      const scheduledDateTime = new Date(form.date!);
      const [hours, minutes] = form.timeSlot.split(':').map(Number);
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      const bookingData = {
        doctorId: form.doctorId,
        scheduledDateTime: scheduledDateTime.toISOString(),
        type: 'routine' as const,
        reason: form.reason,
        symptoms: form.symptoms ? [form.symptoms] : [],
        duration: form.duration
      };

      const response = await consultationService.bookConsultation(bookingData);
      
      if (response.success && response.data) {
        // Notify via socket for real-time updates
        if (socket) {
          socket.emit('consultation_booked', {
            consultationId: response.data._id,
            doctorId: form.doctorId,
            patientId: user?._id,
            date: format(form.date!, 'yyyy-MM-dd'),
            timeSlot: form.timeSlot
          });
        }

        toast({
          title: "Booking Confirmed",
          description: "Your consultation has been successfully booked!",
        });

        onSuccess(response.data);
      } else {
        throw new Error(response.message || 'Booking failed');
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to book consultation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedSlot = availableSlots.find(slot => slot.time === form.timeSlot);
  const totalFee = selectedSlot ? selectedSlot.price : 0;

  // Step 1: Doctor Selection
  if (step === 1) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Select a Doctor</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by name, specialization, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Doctors List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="col-span-full flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredDoctors.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No doctors found matching your search.
                </div>
              ) : (
                filteredDoctors.map((doctor) => (
                  <Card 
                    key={doctor._id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md border-2",
                      selectedDoctor?._id === doctor._id ? "border-primary" : "border-transparent"
                    )}
                    onClick={() => {
                      setSelectedDoctor(doctor);
                      setForm(prev => ({ ...prev, doctorId: doctor._id }));
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">Dr. {doctor.name}</h3>
                          <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                          <p className="text-xs text-muted-foreground">{doctor.department}</p>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {doctor.experience} years exp
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              ⭐ {doctor.rating}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              <span>${doctor.consultationFee}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{doctor.availability?.length || 0} slots</span>
                            </div>
                          </div>
                        </div>
                        {selectedDoctor?._id === doctor._id && (
                          <CheckCircle className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Continue Button */}
            {selectedDoctor && (
              <div className="flex justify-end pt-4 border-t">
                <Button onClick={() => setStep(2)} className="gradient-primary">
                  Continue with Dr. {selectedDoctor.name}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2: Appointment Booking
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Book Consultation</CardTitle>
            <p className="text-sm text-muted-foreground">
              with Dr. {selectedDoctor?.name} • {selectedDoctor?.specialization}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Date Selection */}
              <div className="space-y-2">
                <Label>Select Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !form.date && "text-muted-foreground",
                        errors.date && "border-red-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.date ? format(form.date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={form.date}
                      onSelect={(date) => setForm(prev => ({ ...prev, date, timeSlot: '' }))}
                      disabled={(date) => date < new Date() || date > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
              </div>

              {/* Time Slots */}
              {form.date && (
                <div className="space-y-2">
                  <Label>Available Time Slots</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {isLoading ? (
                      <div className="col-span-3 flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="col-span-3 text-center py-4 text-muted-foreground">
                        No available slots for this date
                      </div>
                    ) : (
                      availableSlots.map((slot) => (
                        <Button
                          key={slot.time}
                          variant={form.timeSlot === slot.time ? "default" : "outline"}
                          size="sm"
                          disabled={!slot.available}
                          onClick={() => setForm(prev => ({ ...prev, timeSlot: slot.time }))}
                          className="text-xs"
                        >
                          {slot.time}
                          {!slot.available && " (Booked)"}
                        </Button>
                      ))
                    )}
                  </div>
                  {errors.timeSlot && <p className="text-sm text-red-500">{errors.timeSlot}</p>}
                </div>
              )}

              {/* Consultation Type */}
              <div className="space-y-2">
                <Label>Consultation Type</Label>
                <Select
                  value={form.consultationType}
                  onValueChange={(value: 'video' | 'phone') => 
                    setForm(prev => ({ ...prev, consultationType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        Video Call
                      </div>
                    </SelectItem>
                    <SelectItem value="phone">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        Phone Call
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select
                  value={form.duration.toString()}
                  onValueChange={(value) => setForm(prev => ({ ...prev, duration: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Reason */}
              <div className="space-y-2">
                <Label>Reason for Consultation *</Label>
                <Textarea
                  placeholder="Please describe the reason for your consultation..."
                  value={form.reason}
                  onChange={(e) => setForm(prev => ({ ...prev, reason: e.target.value }))}
                  className={errors.reason ? "border-red-500" : ""}
                  rows={3}
                />
                {errors.reason && <p className="text-sm text-red-500">{errors.reason}</p>}
              </div>

              {/* Symptoms */}
              <div className="space-y-2">
                <Label>Current Symptoms (Optional)</Label>
                <Textarea
                  placeholder="Please describe any symptoms you're experiencing..."
                  value={form.symptoms}
                  onChange={(e) => setForm(prev => ({ ...prev, symptoms: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Urgency */}
              <div className="space-y-2">
                <Label>Urgency Level</Label>
                <Select
                  value={form.urgency}
                  onValueChange={(value: 'low' | 'medium' | 'high') => 
                    setForm(prev => ({ ...prev, urgency: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Routine checkup</SelectItem>
                    <SelectItem value="medium">Medium - Concerning symptoms</SelectItem>
                    <SelectItem value="high">High - Urgent medical attention</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Booking Summary */}
              {form.timeSlot && (
                <div className="border rounded-lg p-4 bg-secondary/50">
                  <h4 className="font-semibold mb-2">Booking Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Doctor:</span>
                      <span>Dr. {selectedDoctor?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date & Time:</span>
                      <span>{form.date && format(form.date, "PPP")} at {form.timeSlot}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>{form.duration} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="capitalize">{form.consultationType}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Total Fee:</span>
                      <span>${totalFee}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Important Notice */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please ensure you have a stable internet connection for video consultations. 
              You will receive confirmation details via email and SMS.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setStep(1)}>
              Change Doctor
            </Button>
            <Button
              onClick={handleBooking}
              disabled={isBooking || !form.timeSlot || !form.reason}
              className="gradient-primary min-w-32"
            >
              {isBooking ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Booking...
                </>
              ) : (
                `Book for $${totalFee}`
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default BookConsultation;