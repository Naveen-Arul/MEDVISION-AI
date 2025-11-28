import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";

interface VoiceControlProps {
  isListening?: boolean;
  isSpeaking?: boolean;
  onStartListening?: () => void;
  onStopListening?: () => void;
  onToggleSound?: () => void;
  soundEnabled?: boolean;
}

export function VoiceControl({ 
  isListening = false, 
  isSpeaking = false, 
  onStartListening, 
  onStopListening,
  onToggleSound,
  soundEnabled = true 
}: VoiceControlProps) {
  return (
    <div className="flex gap-2 p-2">
      <Button
        variant={isListening ? "destructive" : "outline"}
        size="sm"
        onClick={isListening ? onStopListening : onStartListening}
        className="flex items-center gap-2"
      >
        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        {isListening ? "Stop" : "Voice"}
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleSound}
        className="flex items-center gap-2"
      >
        {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
      </Button>
      
      {isSpeaking && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Speaking...
        </div>
      )}
    </div>
  );
}