import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";

export function KeyboardShortcuts() {
  const shortcuts = [
    { key: "Ctrl + /", action: "Toggle shortcuts" },
    { key: "Ctrl + N", action: "New chat" },
    { key: "Ctrl + K", action: "Search" },
    { key: "Escape", action: "Close modal" },
  ];

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === '/') {
        event.preventDefault();
        // Toggle shortcuts visibility
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, []);

  return (
    <div className="p-4 border-t">
      <h4 className="text-sm font-medium mb-3">Keyboard Shortcuts</h4>
      <div className="space-y-2">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{shortcut.action}</span>
            <Badge variant="secondary" className="text-xs">
              {shortcut.key}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}