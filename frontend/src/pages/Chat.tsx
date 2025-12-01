import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Send, 
  Search, 
  Plus,
  MessageCircle,
  User,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Bot
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { chatService } from "@/lib/services";
import { Chat, Message } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ChatMessage } from "@/components/ChatMessage";
import { MedicalChatbot } from "@/components/MedicalChatbot";

export default function ChatPage() {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const { toast } = useToast();

  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("chat");

  // Load chats on mount
  useEffect(() => {
    loadChats();
  }, []);

  // Auto-select chat if chatId provided
  useEffect(() => {
    if (chatId && chats.length > 0) {
      const chat = chats.find(c => c._id === chatId);
      if (chat) {
        handleSelectChat(chat);
      }
    }
  }, [chatId, chats]);

  // Socket event listeners (same as ChatSidebar but adapted)
  useEffect(() => {
    if (socket && user) {
      socket.emit('join_user_room', user._id);

      const handleMessageReceived = (message: Message) => {
        setMessages(prev => [...prev, message]);
        updateChatLastMessage(message.chatId, message);
      };

      const handleMessageSent = (message: Message) => {
        setMessages(prev => [...prev, message]);
        updateChatLastMessage(message.chatId, message);
      };

      const handleTyping = ({ userId, userName, chatId }: any) => {
        if (selectedChat?._id === chatId && userId !== user._id) {
          setTypingUsers(prev => new Set([...prev, userName]));
          setTimeout(() => {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(userName);
              return newSet;
            });
          }, 3000);
        }
      };

      socket.on('message_received', handleMessageReceived);
      socket.on('message_sent', handleMessageSent);
      socket.on('user_typing', handleTyping);

      return () => {
        socket.off('message_received', handleMessageReceived);
        socket.off('message_sent', handleMessageSent);
        socket.off('user_typing', handleTyping);
      };
    }
  }, [socket, user, selectedChat]);

  const updateChatLastMessage = (chatId: string, message: Message) => {
    setChats(prev => prev.map(chat => 
      chat._id === chatId 
        ? { 
            ...chat, 
            lastMessage: message,
            unreadCount: selectedChat?._id === chatId ? 0 : (chat.unreadCount || 0) + 1
          }
        : chat
    ));
  };

  const loadChats = async () => {
    try {
      setIsLoading(true);
      const response = await chatService.getChats(1, 50);
      
      if (response.success && response.data?.chats) {
        setChats(response.data.chats);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (chat: Chat) => {
    try {
      setIsLoading(true);
      const response = await chatService.getChat(chat._id);
      
      if (response.success && response.data?.messages) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectChat = async (chat: Chat) => {
    setSelectedChat(chat);
    navigate(`/chat/${chat._id}`);
    await loadMessages(chat);
    
    // Join chat room for real-time updates
    if (socket) {
      socket.emit('join_chat', chat._id);
    }

    // Reset unread count
    setChats(prev => prev.map(c => 
      c._id === chat._id 
        ? { ...c, unreadCount: 0 }
        : c
    ));
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || isSending) return;

    try {
      setIsSending(true);
      
      const response = await chatService.sendMessage(selectedChat._id, {
        content: { text: newMessage.trim() },
        messageType: 'text'
      });

      if (response.success) {
        // Emit to socket for real-time delivery
        if (socket) {
          socket.emit('send_message', {
            chatId: selectedChat._id,
            content: newMessage.trim(),
            sender: user
          });
        }

        setNewMessage("");
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getOtherParticipant = (chat: Chat) => {
    return chat.participants.find(p => p.user._id !== user?._id);
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredChats = chats.filter(chat => {
    const otherParticipant = getOtherParticipant(chat);
    return otherParticipant?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar - Chat List */}
      <div className="w-80 border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-lg font-semibold">Messages</h1>
          </div>
          <Button variant="ghost" size="icon">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No conversations yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Start chatting with your doctors
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredChats.map((chat) => {
                const otherParticipant = getOtherParticipant(chat);
                const isSelected = selectedChat?._id === chat._id;
                
                return (
                  <div
                    key={chat._id}
                    className={`p-4 cursor-pointer transition-colors hover:bg-secondary/50 ${
                      isSelected ? 'bg-secondary' : ''
                    }`}
                    onClick={() => handleSelectChat(chat)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>
                          {otherParticipant?.user?.name?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium truncate">
                            Dr. {otherParticipant?.user?.name}
                          </h4>
                          <div className="flex items-center gap-1">
                            {chat.lastMessage && (
                              <span className="text-xs text-muted-foreground">
                                {formatMessageTime(chat.lastMessage.createdAt)}
                              </span>
                            )}
                            {(chat.unreadCount || 0) > 0 && (
                              <Badge className="bg-primary text-primary-foreground text-xs ml-1">
                                {chat.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {chat.lastMessage && (
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {chat.lastMessage.sender._id === user?._id ? 'You: ' : ''}
                            {chat.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>
                    {getOtherParticipant(selectedChat)?.user?.name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium">
                    Dr. {getOtherParticipant(selectedChat)?.user?.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">Online</p>
                </div>
              </div>
                          
              <div className="flex gap-2">
                <Button variant="ghost" size="icon">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Video className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>
                        
            {/* Tabbed Interface */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="chat">Doctor Chat</TabsTrigger>
                <TabsTrigger value="medical-assistant">
                  <Bot className="w-4 h-4 mr-2" />
                  Medical Assistant
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="chat" className="flex-1 flex flex-col mt-0">
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No messages yet</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Start the conversation!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message, index) => {
                        const isOwn = message.sender._id === user?._id;
                        const showAvatar = index === 0 || 
                          messages[index - 1].sender._id !== message.sender._id;
                        
                        return (
                          <ChatMessage
                            key={message._id}
                            message={message}
                            isOwn={isOwn}
                            showAvatar={showAvatar}
                          />
                        );
                      })}
                      
                      {/* Typing indicator */}
                      {typingUsers.size > 0 && (
                        <div className="flex gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs">
                              {getOtherParticipant(selectedChat)?.user?.name?.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="bg-secondary rounded-lg p-3">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isSending}
                      />
                    </div>
                    <Button variant="ghost" size="icon">
                      <Smile className="w-4 h-4" />
                    </Button>
                    <Button 
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || isSending}
                      size="icon"
                    >
                      {isSending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="medical-assistant" className="flex-1 mt-0">
                <div className="p-4 h-full">
                  <MedicalChatbot />
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}