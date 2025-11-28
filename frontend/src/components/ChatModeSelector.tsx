import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Stethoscope, Users, MessageCircle } from "lucide-react";

export type ChatMode = 'ai' | 'doctor' | 'support' | 'general';

interface ChatModeSelectorProps {
  selectedMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
}

export function ChatModeSelector({ selectedMode, onModeChange }: ChatModeSelectorProps) {
  const modes = [
    {
      id: 'ai' as const,
      name: 'AI Assistant',
      description: 'Get instant medical insights',
      icon: Brain,
      color: 'bg-blue-500',
      available: true
    },
    {
      id: 'doctor' as const,
      name: 'Doctor Chat',
      description: 'Connect with healthcare professionals',
      icon: Stethoscope,
      color: 'bg-green-500',
      available: true
    },
    {
      id: 'support' as const,
      name: 'Support Group',
      description: 'Join community discussions',
      icon: Users,
      color: 'bg-purple-500',
      available: false
    },
    {
      id: 'general' as const,
      name: 'General Chat',
      description: 'General health discussions',
      icon: MessageCircle,
      color: 'bg-orange-500',
      available: true
    }
  ];

  return (
    <div className="p-4 border-b">
      <h3 className="font-semibold mb-3">Chat Mode</h3>
      <div className="grid grid-cols-2 gap-2">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <Card
              key={mode.id}
              className={`cursor-pointer transition-all border-2 ${
                selectedMode === mode.id 
                  ? 'border-primary bg-primary/5' 
                  : 'border-transparent hover:border-primary/50'
              } ${!mode.available ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => mode.available && onModeChange(mode.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-6 h-6 rounded ${mode.color} flex items-center justify-center`}>
                    <Icon className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-medium">{mode.name}</span>
                  {!mode.available && (
                    <Badge variant="secondary" className="text-xs">
                      Soon
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{mode.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}