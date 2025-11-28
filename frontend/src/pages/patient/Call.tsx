import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import VideoConsultation from "@/components/VideoConsultation";
import PatientLayout from "@/components/patient/PatientLayout";
import { api } from "@/lib/services";
import { Consultation } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const PatientCall = () => {
  const { roomID } = useParams<{ roomID: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);

  // Get consultation data
  useEffect(() => {
    const fetchConsultation = async () => {
      try {
        setLoading(true);
        // Get consultation ID from location state or roomID
        const consultationId = location.state?.consultationId || roomID;
        
        if (consultationId) {
          const response = await api.consultation.getConsultation(consultationId);
          if (response.success && response.data) {
            setConsultation(response.data);
          }
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
  }, [roomID, location.state]);

  const handleEndCall = async () => {
    if (!consultation) return;
    
    try {
      // End the video consultation
      const response = await api.consultation.endVideo(consultation._id);
      
      if (response.success) {
        toast({
          title: "Call Ended",
          description: "The video consultation has been ended successfully",
        });
        
        // Navigate back to dashboard
        navigate("/patient/dashboard");
      } else {
        throw new Error(response.message || "Failed to end consultation");
      }
    } catch (error) {
      console.error("Failed to end consultation:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to end consultation",
        variant: "destructive",
      });
    }
  };

  // Use the jitsi room name from consultation or fallback to roomID
  const jitsiRoomName = consultation?.videoCall?.jitsiRoomName || roomID || "";

  return (
    <PatientLayout>
      <div className="bg-gradient-subtle py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Video Consultation</h1>
            <p className="text-muted-foreground">Connect with your healthcare provider</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : consultation ? (
            <VideoConsultation
              roomID={jitsiRoomName}
              appointmentTime={new Date(consultation.scheduledDateTime)}
              onEndCall={handleEndCall}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Consultation data not available</p>
            </div>
          )}
        </div>
      </div>
    </PatientLayout>
  );
};

export default PatientCall;