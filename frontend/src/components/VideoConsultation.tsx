import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, VideoOff, Mic, MicOff, Maximize2, X, Clock, AlertCircle } from "lucide-react";

interface VideoConsultationProps {
  roomID: string;
  appointmentTime: Date;
  onEndCall?: () => void;
}

const VideoConsultation = ({ roomID, appointmentTime, onEndCall }: VideoConsultationProps) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [timeUntilCall, setTimeUntilCall] = useState<string>("");
  const [isCallTime, setIsCallTime] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const scheduledTime = new Date(appointmentTime);
      const timeDiff = scheduledTime.getTime() - now.getTime();
      
      // Allow call to start 5 minutes before scheduled time
      const canStart = timeDiff <= 5 * 60 * 1000;
      setIsCallTime(canStart);
      
      if (timeDiff <= 0) {
        setIsCallActive(true);
        setTimeUntilCall("");
      } else if (canStart) {
        // Call can be started but hasn't reached exact time yet
        const minutes = Math.floor(timeDiff / 60000);
        const seconds = Math.floor((timeDiff % 60000) / 1000);
        setTimeUntilCall(`${minutes}m ${seconds}s`);
      } else {
        // Too early to start call
        const hours = Math.floor(timeDiff / (60 * 60 * 1000));
        const minutes = Math.floor((timeDiff % (60 * 60 * 1000)) / 60000);
        setTimeUntilCall(`in ${hours}h ${minutes}m`);
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 1000);

    return () => clearInterval(interval);
  }, [appointmentTime]);

  const handleEndCall = () => {
    setIsCallActive(false);
    onEndCall?.();
  };

  const handleFullscreen = () => {
    if (iframeRef.current) {
      if (iframeRef.current.requestFullscreen) {
        iframeRef.current.requestFullscreen();
      }
    }
  };

  const handleStartCall = () => {
    if (isCallTime) {
      setIsCallActive(true);
    }
  };

  return (
    <div className="space-y-4">
      {!isCallActive ? (
        <Card className="p-8 text-center shadow-elevated">
          <div className="max-w-md mx-auto space-y-6">
            <div className="rounded-full bg-medical-blue-light p-6 w-fit mx-auto">
              <Clock className="h-12 w-12 text-primary" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Consultation Scheduled</h2>
              <p className="text-muted-foreground">
                Your consultation slot is at <span className="font-semibold text-foreground">
                  {appointmentTime.toLocaleString()}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                {isCallTime 
                  ? "Call window is open. You can start the consultation now." 
                  : "Call window will open 5 minutes before the scheduled time."}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-secondary">
              <p className="text-sm font-medium mb-2">📅 Appointment Confirmed for:</p>
              <p className="text-lg font-bold text-primary">
                {appointmentTime.toLocaleString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </p>
            </div>

            {!isCallTime && timeUntilCall && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>⏳ Waiting for the time slot... {timeUntilCall}</span>
              </div>
            )}

            {isCallTime && (
              <Button 
                onClick={handleStartCall}
                className="w-full mt-4"
                size="lg"
              >
                Start Consultation
              </Button>
            )}

            {!isCallTime && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-warning/10 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 text-warning" />
                <span>Consultation cannot be started yet. Please wait until the scheduled time.</span>
              </div>
            )}

            <Badge variant="outline" className="text-sm">
              Room ID: {roomID}
            </Badge>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="p-4 shadow-elevated">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-success">Live Consultation</Badge>
                <span className="text-sm text-muted-foreground">Room: {roomID}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsVideoOff(!isVideoOff)}
                >
                  {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFullscreen}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleEndCall}
                >
                  <X className="h-4 w-4 mr-2" />
                  End Call
                </Button>
              </div>
            </div>

            <div className="relative rounded-xl overflow-hidden bg-black" style={{ height: '500px' }}>
              <iframe
                ref={iframeRef}
                src={`https://meet.jit.si/${roomID}`}
                allow="camera; microphone; fullscreen; display-capture; clipboard-read; clipboard-write"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: '12px',
                }}
                title="Video Consultation"
              />
            </div>
          </Card>

          <Card className="p-4 bg-medical-blue-light/30 border-primary/20">
            <p className="text-sm text-center">
              <strong>Note:</strong> Your consultation is in progress. Please ensure your microphone and camera permissions are enabled.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
};

export default VideoConsultation;