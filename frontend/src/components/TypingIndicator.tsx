interface TypingIndicatorProps {
  userName?: string;
}

export function TypingIndicator({ userName = "Someone" }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
      <span>{userName} is typing...</span>
    </div>
  );
}