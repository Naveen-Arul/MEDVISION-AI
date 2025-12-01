import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  Users,
  Clock,
  MessageCircle,
  Share,
  Settings
} from "lucide-react";
import { Consultation } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { consultationService } from "@/lib/services";
import { useToast } from "@/hooks/use-toast";

interface VideoCallRoomProps {
  consultation: Consultation;
  onEnd: () => void;
}

// Declare global JitsiMeetExternalAPI
declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

function VideoCallRoom({ consultation, onEnd }: VideoCallRoomProps) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { toast } = useToast();
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);
  
  const [isJitsiLoaded, setIsJitsiLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Timer for call duration
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected) {
        setDuration(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  // Load Jitsi Meet API
  useEffect(() => {
    const loadJitsiScript = () => {
      if (window.JitsiMeetExternalAPI) {
        setIsJitsiLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = () => setIsJitsiLoaded(true);
      script.onerror = () => {
        setError('Failed to load Jitsi Meet. Please check your internet connection.');
      };
      document.head.appendChild(script);

      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    };

    const cleanup = loadJitsiScript();
    return cleanup;
  }, []);

  // Initialize Jitsi Meet
  useEffect(() => {
    if (!isJitsiLoaded || !jitsiContainerRef.current || jitsiApiRef.current) {
      return;
    }

    const domain = 'meet.jit.si';
    const roomName = `consultation-${consultation._id}`;
    
    const options = {
      roomName: roomName,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainerRef.current,
      userInfo: {
        displayName: user?.name || 'User',
        email: user?.email
      },
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        enableWelcomePage: false,
        enableUserRolesBasedOnToken: false,
        prejoinPageEnabled: false,
        disableProfile: true,
        disableInviteFunctions: true,
        toolbarButtons: [
          'microphone', 'camera', 'desktop', 'fullscreen',
          'fodeviceselection', 'hangup', 'chat', 'recording',
          'livestreaming', 'etherpad', 'sharedvideo', 'settings'
        ],
        subject: `Consultation with Dr. ${consultation.doctor.name}`,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
          'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
          'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'videoquality'
        ],
        SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile', 'calendar'],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_BRAND_WATERMARK: false,
        BRAND_WATERMARK_LINK: "",
        SHOW_POWERED_BY: false,
        DISPLAY_WELCOME_PAGE_CONTENT: false,
        DISPLAY_WELCOME_PAGE_TOOLBAR_ADDITIONAL_CONTENT: false,
        APP_NAME: "AI-Her Telemedicine",
        NATIVE_APP_NAME: "AI-Her",
        DEFAULT_BACKGROUND: '#474747',
        DISABLE_VIDEO_BACKGROUND: false,
        INITIAL_TOOLBAR_TIMEOUT: 20000,
        TOOLBAR_TIMEOUT: 4000,
        DEFAULT_REMOTE_DISPLAY_NAME: "Participant"
      }
    };

    try {
      jitsiApiRef.current = new window.JitsiMeetExternalAPI(domain, options);
      
      // Event listeners
      jitsiApiRef.current.addEventListener('videoConferenceJoined', () => {
        setIsConnected(true);
        toast({
          title: "Connected",
          description: "Successfully joined the video consultation.",
        });

        // Notify through socket
        if (socket) {
          socket.emit('join_consultation', consultation._id);
          socket.emit('video_call_joined', {
            consultationId: consultation._id,
            participantName: user?.name
          });
        }
      });

      jitsiApiRef.current.addEventListener('videoConferenceLeft', () => {
        handleEndCall();
      });

      jitsiApiRef.current.addEventListener('participantJoined', (participant: any) => {
        setParticipants(prev => [...prev, participant.displayName || 'Participant']);
        
        if (socket) {
          socket.emit('participant_joined', {
            consultationId: consultation._id,
            participantName: participant.displayName
          });
        }
      });

      jitsiApiRef.current.addEventListener('participantLeft', (participant: any) => {
        setParticipants(prev => prev.filter(p => p !== participant.displayName));
        
        if (socket) {
          socket.emit('participant_left', {
            consultationId: consultation._id,
            participantName: participant.displayName
          });
        }
      });

      jitsiApiRef.current.addEventListener('audioMuteStatusChanged', (event: any) => {
        setIsMuted(event.muted);
      });

      jitsiApiRef.current.addEventListener('videoMuteStatusChanged', (event: any) => {
        setIsVideoOff(event.muted);
      });

      jitsiApiRef.current.addEventListener('readyToClose', () => {
        handleEndCall();
      });

    } catch (error) {
      console.error('Error initializing Jitsi:', error);
      setError('Failed to initialize video call. Please try again.');
    }

    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
    };
  }, [isJitsiLoaded, consultation, user, socket, toast]);

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (socket) {
      socket.on('participant_joined_consultation', (data) => {
        toast({
          title: "Participant Joined",
          description: `${data.participantName} joined the consultation.`,
        });
      });

      socket.on('participant_left_consultation', (data) => {
        toast({
          title: "Participant Left", 
          description: `${data.participantName} left the consultation.`,
        });
      });

      socket.on('consultation_ended', () => {
        toast({
          title: "Consultation Ended",
          description: "The consultation has been ended by the doctor.",
        });
        handleEndCall();
      });

      return () => {
        socket.off('participant_joined_consultation');
        socket.off('participant_left_consultation');
        socket.off('consultation_ended');
      };
    }
  }, [socket, toast]);

  const handleEndCall = async () => {
    try {
      // Update consultation status
      await consultationService.updateStatus(consultation._id, 'completed');
      
      // Notify through socket
      if (socket) {
        socket.emit('leave_consultation', consultation._id);
        socket.emit('video_call_ended', {
          consultationId: consultation._id,
          participantName: user?.name,
          duration: duration
        });
      }

      // Dispose Jitsi API
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }

      toast({
        title: "Call Ended",
        description: "Video consultation has been completed.",
      });

      onEnd();
    } catch (error) {
      console.error('Error ending call:', error);
      onEnd();
    }
  };

  const toggleMute = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleAudio');
    }
  };

  const toggleVideo = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleVideo');
    }
  };

  const shareScreen = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleShareScreen');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Connection Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button onClick={() => window.location.reload()} className="flex-1">
                Retry
              </Button>
              <Button variant="outline" onClick={onEnd} className="flex-1">
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="bg-background border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="font-semibold">Video Consultation</h2>
            <p className="text-sm text-muted-foreground">
              with Dr. {consultation.doctor.name}
            </p>
          </div>
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? "Connected" : "Connecting..."}
          </Badge>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4" />
            {formatDuration(duration)}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4" />
            {participants.length + 1}
          </div>
          <Button variant="destructive" onClick={handleEndCall}>
            <PhoneOff className="w-4 h-4 mr-2" />
            End Call
          </Button>
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative">
        {!isJitsiLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Loading video call...</p>
            </div>
          </div>
        ) : (
          <div ref={jitsiContainerRef} className="w-full h-full" />
        )}
      </div>

      {/* Controls */}
      <div className="bg-background border-t p-4">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant={isMuted ? "destructive" : "secondary"}
            size="lg"
            onClick={toggleMute}
            className="rounded-full h-12 w-12"
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
          
          <Button
            variant={isVideoOff ? "destructive" : "secondary"}
            size="lg"
            onClick={toggleVideo}
            className="rounded-full h-12 w-12"
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </Button>
          
          <Button
            variant="secondary"
            size="lg"
            onClick={shareScreen}
            className="rounded-full h-12 w-12"
          >
            <Share className="w-5 h-5" />
          </Button>
          
          <Button
            variant="outline"
            onClick={() => {
              if (jitsiApiRef.current) {
                jitsiApiRef.current.executeCommand('toggleChat');
              }
            }}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat
          </Button>
        </div>

        {/* Consultation Info */}
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <div>
            <span className="font-medium">Scheduled:</span> {formatDateTime(consultation.scheduledDateTime)}
          </div>
          <div>
            <span className="font-medium">Duration:</span> {consultation.duration} minutes
          </div>
          <div>
            <span className="font-medium">Type:</span> {consultation.type}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoCallRoom;