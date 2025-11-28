import { MessageCircle, Bot } from "lucide-react";

interface EmptyStateProps {
  mode?: 'ai' | 'doctor' | 'support' | 'general';
}

export function EmptyState({ mode = 'ai' }: EmptyStateProps) {
  const getEmptyStateContent = () => {
    switch (mode) {
      case 'ai':
        return {
          icon: Bot,
          title: "AI Assistant Ready",
          description: "Ask me about your health concerns, symptoms, or upload medical images for analysis.",
          suggestions: [
            "Analyze my chest X-ray",
            "What could cause chest pain?",
            "Explain my blood test results"
          ]
        };
      case 'doctor':
        return {
          icon: MessageCircle,
          title: "Doctor Chat",
          description: "Connect with healthcare professionals for personalized medical advice.",
          suggestions: [
            "Book a consultation",
            "Ask about symptoms",
            "Get a second opinion"
          ]
        };
      case 'support':
        return {
          icon: MessageCircle,
          title: "Support Group",
          description: "Join conversations with others who share similar health experiences.",
          suggestions: []
        };
      case 'general':
        return {
          icon: MessageCircle,
          title: "General Health Chat",
          description: "Discuss general health topics and wellness questions.",
          suggestions: [
            "Healthy lifestyle tips",
            "Preventive care advice",
            "Wellness recommendations"
          ]
        };
      default:
        return {
          icon: Bot,
          title: "Chat Ready",
          description: "Start a conversation to get help with your health questions.",
          suggestions: []
        };
    }
  };

  const content = getEmptyStateContent();
  const Icon = content.icon;

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{content.title}</h3>
        <p className="text-muted-foreground mb-4">{content.description}</p>
        
        {content.suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Try asking:</p>
            <div className="space-y-1">
              {content.suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="text-sm text-muted-foreground bg-secondary/50 rounded-lg p-2 cursor-pointer hover:bg-secondary transition-colors"
                >
                  "{suggestion}"
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}