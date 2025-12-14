import { useState, useRef, useEffect } from "react";
import { Bot, Send, Paperclip, X, MessageSquarePlus, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import apiClient from "@/lib/api";
import PatientLayout from "@/components/patient/PatientLayout";
import MarkdownRenderer from "@/components/MarkdownRenderer";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export default function AIAssistant() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('aiChatSessions');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    const saved = localStorage.getItem('currentAIChatSession');
    return saved || null;
  });
  
  const currentSession = chatSessions.find(s => s.id === currentSessionId);
  const [messages, setMessages] = useState<Message[]>(currentSession?.messages || [
    {
      id: "1",
      role: "assistant",
      content: "👋 **Welcome to MedVision AI Medical Assistant!**\n\nI'm a specialized healthcare AI designed exclusively for medical consultations. I can help you with:\n\n🩺 **Symptom Analysis** - Describe your symptoms for guidance\n🫁 **Chest X-ray Analysis** - Upload images for pneumonia detection\n💊 **Medication Questions** - Ask about treatments and side effects\n🏥 **Health Guidance** - Get preventive care recommendations\n⚕️ **Medical Conditions** - Learn about diseases and treatments\n\n**Important:** I'm focused purely on medical and health topics. For non-medical questions, please use a general AI assistant.\n\nHow can I help with your health today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Save to localStorage whenever messages or sessions change
  useEffect(() => {
    if (currentSessionId) {
      const updatedSessions = chatSessions.map(session => 
        session.id === currentSessionId 
          ? { ...session, messages, updatedAt: new Date() }
          : session
      );
      setChatSessions(updatedSessions);
      localStorage.setItem('aiChatSessions', JSON.stringify(updatedSessions));
      localStorage.setItem('currentAIChatSession', currentSessionId);
    }
  }, [messages, currentSessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const createNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Medical Chat",
      messages: [{
        id: "1",
        role: "assistant",
        content: "👋 **Welcome to MedVision AI Medical Assistant!**\n\nI'm a specialized healthcare AI designed exclusively for medical consultations. I can help you with:\n\n🩺 **Symptom Analysis** - Describe your symptoms for guidance\n🫁 **Chest X-ray Analysis** - Upload images for pneumonia detection\n💊 **Medication Questions** - Ask about treatments and side effects\n🏥 **Health Guidance** - Get preventive care recommendations\n⚕️ **Medical Conditions** - Learn about diseases and treatments\n\n**Important:** I'm focused purely on medical and health topics. For non-medical questions, please use a general AI assistant.\n\nHow can I help with your health today?",
      }],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setChatSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages(newSession.messages);
  };

  const loadChat = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages);
    }
  };

  const deleteChat = (sessionId: string) => {
    const updatedSessions = chatSessions.filter(s => s.id !== sessionId);
    setChatSessions(updatedSessions);
    localStorage.setItem('aiChatSessions', JSON.stringify(updatedSessions));
    
    if (currentSessionId === sessionId) {
      if (updatedSessions.length > 0) {
        loadChat(updatedSessions[0].id);
      } else {
        createNewChat();
      }
    }
  };

  const getChatTitle = (session: ChatSession) => {
    const firstUserMessage = session.messages.find(m => m.role === "user");
    if (firstUserMessage) {
      return firstUserMessage.content.substring(0, 30) + (firstUserMessage.content.length > 30 ? "..." : "");
    }
    return session.title;
  };

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

    // Create new chat session if none exists
    if (!currentSessionId) {
      createNewChat();
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      image: selectedImage || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = input;
    setInput("");
    setSelectedImage(null);
    setIsLoading(true);

    try {
      // Call the AI chatbot endpoint
      const response = await apiClient.post('/chat/ai-assistant', {
        message: userInput,
        image: selectedImage,
        conversationHistory: messages.slice(-5).map(m => ({
          role: m.role,
          content: m.content
        }))
      });

      if (response.success && response.data) {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response.data.response || response.data.message,
        };
        setMessages((prev) => [...prev, aiResponse]);
      }
    } catch (error) {
      console.error('AI Assistant error:', error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I'm having trouble connecting to the medical AI service. Please try again in a moment.",
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <PatientLayout>
      <div className="h-full flex gap-4 p-6 bg-background relative">
        {/* Chat History Sidebar */}
        <div className="w-64 flex flex-col gap-2 h-[calc(100vh-8rem)] overflow-y-auto flex-shrink-0">
          <Button 
            onClick={createNewChat}
            className="w-full justify-start gap-2"
            variant="outline"
          >
            <MessageSquarePlus className="h-4 w-4" />
            New Medical Chat
          </Button>
          
          <ScrollArea className="flex-1">
            <div className="space-y-2 pr-2">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Chat History</h3>
              {chatSessions.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No previous chats</p>
              ) : (
                chatSessions.map((session) => (
                  <div
                    key={session.id}
                    className={cn(
                      "group relative p-3 rounded-lg cursor-pointer transition-colors",
                      currentSessionId === session.id
                        ? "bg-primary/10 border border-primary/20"
                        : "bg-secondary hover:bg-secondary/80"
                    )}
                    onClick={() => loadChat(session.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {getChatTitle(session)}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {new Date(session.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChat(session.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <div className="mb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gradient-primary p-3">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">AI Health Assistant</h1>
                <p className="text-sm text-muted-foreground">Powered by advanced medical AI models</p>
              </div>
            </div>
          </div>

          <Card className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4 max-w-4xl mx-auto">{messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="rounded-full bg-gradient-primary p-2 h-8 w-8 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    "rounded-lg p-4 max-w-[80%]",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  )}
                >
                  {message.image && (
                    <img
                      src={message.image}
                      alt="Uploaded"
                      className="rounded-md mb-2 max-h-48 w-full object-cover"
                    />
                  )}
                  {message.role === "assistant" ? (
                    <MarkdownRenderer content={message.content} />
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="rounded-full bg-gradient-primary p-2 h-8 w-8 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-secondary text-secondary-foreground rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-sm text-muted-foreground">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border">
          <div className="max-w-4xl mx-auto">
            {selectedImage && (
              <div className="mb-2 relative inline-block">
                <img
                  src={selectedImage}
                  alt="Selected"
                  className="rounded-md max-h-20 object-cover"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={() => setSelectedImage(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input
                placeholder="Describe symptoms or ask health questions..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || (!input.trim() && !selectedImage)}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
        </div>
      </div>
    </PatientLayout>
  );
}
