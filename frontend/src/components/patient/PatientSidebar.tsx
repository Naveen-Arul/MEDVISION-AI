import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Upload, FileText, Video, Bot, Send, Paperclip, Image, X } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
}

const navItems = [
  { title: "Dashboard", url: "/patient/dashboard", icon: LayoutDashboard },
  { title: "Upload Scan", url: "/patient/upload", icon: Upload },
  { title: "History", url: "/patient/history", icon: FileText },
  { title: "Consult", url: "/patient/consult", icon: Video },
];

const PatientSidebar = () => {
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your AI health assistant. You can describe your symptoms, upload X-ray images, or ask me health-related questions. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !selectedImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      image: selectedImage || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSelectedImage(null);
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: selectedImage
          ? "I've analyzed the image you uploaded. Based on the visual assessment, I recommend consulting with a healthcare professional for a proper diagnosis. Would you like me to help you schedule a consultation?"
          : "Thank you for sharing that information. Based on what you've described, I'd recommend monitoring your symptoms. If they persist, please consider uploading a chest X-ray for AI analysis or scheduling a consultation with one of our doctors.",
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-gradient-primary p-2">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <span className="font-semibold text-foreground">Patient Portal</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="flex-1 flex flex-col min-h-0">
          <SidebarGroupLabel className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            AI Health Assistant
          </SidebarGroupLabel>
          <SidebarGroupContent className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1 px-2">
              <div className="space-y-3 py-2">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "rounded-lg p-3 text-sm",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground ml-4"
                        : "bg-secondary text-secondary-foreground mr-4"
                    )}
                  >
                    {message.image && (
                      <img
                        src={message.image}
                        alt="Uploaded"
                        className="rounded-md mb-2 max-h-32 w-full object-cover"
                      />
                    )}
                    {message.content}
                  </div>
                ))}
                {isLoading && (
                  <div className="bg-secondary text-secondary-foreground rounded-lg p-3 text-sm mr-4">
                    <div className="flex items-center gap-2">
                      <div className="animate-pulse flex gap-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                      </div>
                      <span>Analyzing...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-border">
        {selectedImage && (
          <div className="relative mb-2">
            <img
              src={selectedImage}
              alt="Selected"
              className="rounded-md h-20 w-full object-cover"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileSelect}
          />
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => fileInputRef.current?.click()}
          >
            <Image className="h-4 w-4" />
          </Button>
          <Input
            placeholder="Describe symptoms..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            className="text-sm"
          />
          <Button
            size="icon"
            className="shrink-0"
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && !selectedImage)}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default PatientSidebar;
