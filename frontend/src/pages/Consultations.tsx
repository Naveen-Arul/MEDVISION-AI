import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, Clock, Video, Plus, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { consultationService } from "@/lib/services";
import { Consultation } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import BookConsultation from "../components/BookConsultation";
import VideoCallRoom from "../components/VideoCallRoom";

export default function Consultations() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { socket } = useSocket();

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [upcomingConsultations, setUpcomingConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [showBooking, setShowBooking] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [showVideoCall, setShowVideoCall] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, navigate]);

  // Load consultations
  useEffect(() => {
    if (user) {
      loadConsultations();
    }
  }, [user]);

  // Real-time consultation updates
  useEffect(() => {
    if (socket) {
      socket.on('consultation_status_updated', (data) => {
        setConsultations(prev => 
          prev.map(c => c._id === data.consultationId ? { ...c, status: data.status } : c)
        );
        setUpcomingConsultations(prev =>
          prev.map(c => c._id === data.consultationId ? { ...c, status: data.status } : c)
        );
      });

      socket.on('video_call_start', (data) => {
        toast({
          title: "Video Call Started",
          description: "Your consultation video call has begun.",
        });
      });

      return () => {
        socket.off('consultation_status_updated');
        socket.off('video_call_start');
      };
    }
  }, [socket, toast]);

  const loadConsultations = async () => {
    try {
      setIsLoading(true);
      
      const [allResponse, upcomingResponse] = await Promise.all([
        consultationService.getConsultations(1, 50),
        consultationService.getUpcoming()
      ]);

      if (allResponse.success && allResponse.data?.consultations) {
        setConsultations(allResponse.data.consultations);
      }

      if (upcomingResponse.success && upcomingResponse.data) {
        setUpcomingConsultations(upcomingResponse.data);
      }
    } catch (error) {
      console.error('Error loading consultations:', error);
      toast({
        title: "Error",
        description: "Failed to load consultations.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookingSuccess = (consultation: Consultation) => {
    setConsultations(prev => [consultation, ...prev]);
    setUpcomingConsultations(prev => [consultation, ...prev]);
    setShowBooking(false);
    toast({
      title: "Consultation Booked",
      description: "Your consultation has been successfully scheduled.",
    });
  };

  const handleStartVideo = async (consultation: Consultation) => {
    try {
      // Check if consultation can be started (real-time validation)
      const now = new Date();
      const scheduledTime = new Date(consultation.scheduledDateTime);
      const timeDiff = scheduledTime.getTime() - now.getTime();
      
      // Allow joining 5 minutes before OR after scheduled time
      if (timeDiff > 5 * 60 * 1000) {
        const minutes = Math.ceil(timeDiff / (60 * 1000));
        toast({
          title: "Too Early",
          description: `You can join the consultation ${minutes} minutes before the scheduled time.`,
          variant: "destructive",
        });
        return;
      }

      // Auto-start after 1 minute if it's past scheduled time
      if (timeDiff <= 0 && Math.abs(timeDiff) < 60 * 1000) {
        toast({
          title: "Starting in 1 minute",
          description: "Video call will start automatically in 1 minute...",
        });
        
        setTimeout(() => {
          startVideoCall(consultation);
        }, 60000);
        return;
      }

      await startVideoCall(consultation);
    } catch (error: any) {
      console.error('Error starting video:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start video consultation.",
        variant: "destructive",
      });
    }
  };

  const startVideoCall = async (consultation: Consultation) => {
    const response = await consultationService.startVideo(consultation._id);
    
    if (response.success && response.data) {
      // Join consultation room for real-time updates
      if (socket) {
        socket.emit('join_consultation', consultation._id);
        socket.emit('video_call_started', {
          consultationId: consultation._id,
          participantName: user?.name
        });
      }

      setSelectedConsultation(consultation);
      setShowVideoCall(true);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'confirmed': return 'bg-green-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const canStartConsultation = (consultation: Consultation) => {
    const now = new Date();
    const scheduledTime = new Date(consultation.scheduledDateTime);
    const timeDiff = scheduledTime.getTime() - now.getTime();
    
    // Allow starting 5 minutes before OR any time after scheduled time
    return (timeDiff <= (5 * 60 * 1000)) && 
           (consultation.status === 'confirmed' || consultation.status === 'scheduled');
  };

  const getTimeStatus = (consultation: Consultation) => {
    const now = new Date();
    const scheduledTime = new Date(consultation.scheduledDateTime);
    const timeDiff = scheduledTime.getTime() - now.getTime();
    
    if (timeDiff > 5 * 60 * 1000) {
      const minutes = Math.ceil(timeDiff / (60 * 1000));
      return { text: `Available in ${minutes} minutes`, canStart: false };
    } else if (timeDiff > 0) {
      return { text: "Can join now", canStart: true };
    } else if (Math.abs(timeDiff) < 60 * 1000) {
      return { text: "Starting in 1 minute...", canStart: false, autoStart: true };
    } else {
      return { text: "Join now", canStart: true };
    }
  };

  if (showVideoCall && selectedConsultation) {
    return (
      <VideoCallRoom
        consultation={selectedConsultation}
        onEnd={() => {
          setShowVideoCall(false);
          setSelectedConsultation(null);
          loadConsultations(); // Refresh consultations
        }}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="rounded-full hover:bg-primary/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Consultations</h1>
              <p className="text-muted-foreground">Manage your doctor consultations</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowBooking(true)}
            className="gradient-primary hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Book Consultation
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{upcomingConsultations.length}</p>
                  <p className="text-sm text-muted-foreground">Upcoming</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-2xl font-bold">{consultations.filter(c => c.status === 'completed').length}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{consultations.filter(c => c.status === 'in_progress').length}</p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{consultations.length}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Consultations List */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="all">All Consultations</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingConsultations.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No upcoming consultations</p>
                  <Button 
                    onClick={() => setShowBooking(true)}
                    className="mt-4"
                    variant="outline"
                  >
                    Book Your First Consultation
                  </Button>
                </CardContent>
              </Card>
            ) : (
              upcomingConsultations.map((consultation) => {
                const { date, time } = formatDateTime(consultation.scheduledDateTime);
                const timeStatus = getTimeStatus(consultation);
                
                return (
                  <Card key={consultation._id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            Dr. {consultation.doctor.name}
                            <Badge className={`${getStatusColor(consultation.status)} text-white`}>
                              {consultation.status}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            {consultation.specialization} • {consultation.type}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{date}</p>
                          <p className="text-sm text-muted-foreground">{time}</p>
                          <p className={`text-xs ${timeStatus.canStart ? 'text-green-600' : 'text-amber-600'}`}>
                            {timeStatus.text}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-4">{consultation.reason}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {consultation.duration} minutes • ${consultation.billing.fee}
                        </div>
                        <div className="flex gap-2">
                          {timeStatus.canStart && (
                            <Button 
                              onClick={() => handleStartVideo(consultation)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Video className="w-4 h-4 mr-2" />
                              Join Video Call
                            </Button>
                          )}
                          {timeStatus.autoStart && (
                            <Button 
                              onClick={() => handleStartVideo(consultation)}
                              className="bg-amber-600 hover:bg-amber-700"
                            >
                              <Video className="w-4 h-4 mr-2" />
                              Starting Soon...
                            </Button>
                          )}
                          {!timeStatus.canStart && !timeStatus.autoStart && (
                            <Button variant="outline" disabled>
                              <Video className="w-4 h-4 mr-2" />
                              {timeStatus.text}
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* Other tabs content remains similar but with real data */}
          <TabsContent value="all" className="space-y-4">
            {consultations.map((consultation) => {
              const { date, time } = formatDateTime(consultation.scheduledDateTime);
              
              return (
                <Card key={consultation._id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          Dr. {consultation.doctor.name}
                          <Badge className={`${getStatusColor(consultation.status)} text-white`}>
                            {consultation.status}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          {consultation.specialization} • {consultation.type}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{date}</p>
                        <p className="text-sm text-muted-foreground">{time}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{consultation.reason}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {consultation.duration} minutes • ${consultation.billing.fee}
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {consultations.filter(c => c.status === 'completed').map((consultation) => {
              const { date, time } = formatDateTime(consultation.scheduledDateTime);
              
              return (
                <Card key={consultation._id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Dr. {consultation.doctor.name}</CardTitle>
                        <CardDescription>
                          {consultation.specialization} • {consultation.type}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{date}</p>
                        <p className="text-sm text-muted-foreground">{time}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{consultation.reason}</p>
                    {consultation.doctorNotes && (
                      <div className="bg-secondary/50 p-3 rounded-lg mb-4">
                        <h4 className="font-medium mb-2">Doctor's Notes:</h4>
                        <p className="text-sm">{consultation.doctorNotes.diagnosis}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {consultation.duration} minutes • ${consultation.billing.fee}
                      </div>
                      <Button variant="outline" size="sm">
                        View Full Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>

        {/* Book Consultation Modal */}
        {showBooking && (
          <BookConsultation
            onClose={() => setShowBooking(false)}
            onSuccess={handleBookingSuccess}
          />
        )}
      </div>
    </div>
  );
}