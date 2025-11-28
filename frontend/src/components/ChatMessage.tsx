import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: {
    _id: string;
    sender: {
      _id: string;
      name: string;
    };
    content: string;
    createdAt: string;
    deliveredAt?: string;
    readAt?: string;
  };
  isOwn: boolean;
  showAvatar?: boolean;
}

export function ChatMessage({ message, isOwn, showAvatar = true }: ChatMessageProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={cn("flex gap-2", isOwn ? "justify-end" : "justify-start")}>
      {!isOwn && showAvatar && (
        <Avatar className="w-6 h-6">
          <AvatarFallback className="text-xs">
            {message.sender.name?.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      {!isOwn && !showAvatar && <div className="w-6" />}
      
      <div className={cn(
        "max-w-[70%] rounded-lg p-3",
        isOwn ? "bg-primary text-primary-foreground" : "bg-secondary"
      )}>
        <p className="text-sm">{message.content}</p>
        <div className={cn(
          "flex items-center gap-1 mt-1",
          isOwn ? "justify-end" : "justify-start"
        )}>
          <span className={cn(
            "text-xs opacity-70",
            isOwn ? "text-primary-foreground" : "text-muted-foreground"
          )}>
            {formatTime(message.createdAt)}
          </span>
          {isOwn && (
            <CheckCheck className={cn(
              "w-3 h-3",
              message.readAt 
                ? "text-blue-400" 
                : message.deliveredAt 
                ? "text-gray-400" 
                : "text-gray-500"
            )} />
          )}
        </div>
      </div>
    </div>
  );
}