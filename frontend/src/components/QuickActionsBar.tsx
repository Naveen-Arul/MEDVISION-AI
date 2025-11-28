import { Button } from "@/components/ui/button";
import { Calendar, Users, MessageCircle, FileText, Settings } from "lucide-react";

interface QuickActionsBarProps {
  onAction?: (action: string) => void;
}

export function QuickActionsBar({ onAction }: QuickActionsBarProps) {
  const actions = [
    { id: 'book-consultation', label: 'Book Consultation', icon: Calendar },
    { id: 'find-doctors', label: 'Find Doctors', icon: Users },
    { id: 'new-chat', label: 'New Chat', icon: MessageCircle },
    { id: 'upload-report', label: 'Upload Report', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="p-4 border-b">
      <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              variant="outline"
              size="sm"
              className="justify-start h-auto p-3"
              onClick={() => onAction?.(action.id)}
            >
              <Icon className="w-4 h-4 mr-2" />
              <span className="text-xs">{action.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}