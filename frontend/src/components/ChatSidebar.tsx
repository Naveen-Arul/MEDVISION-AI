import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Send, 
  Search, 
  Phone, 
  Video, 
  MoreVertical,
  Clock,
  CheckCheck,
  User,
  X,
  Paperclip,
  Smile
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { chatService } from "@/lib/services";
import { Chat, Message } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedChatId?: string;
}

export function ChatSidebar({ isOpen, onClose, selectedChatId }: ChatSidebarProps) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  // Load chats on mount
  useEffect(() => {
    if (isOpen) {
      loadChats();
    }
  }, [isOpen]);

  // Auto-select chat if provided
  useEffect(() => {
    if (selectedChatId && chats.length > 0) {
      const chat = chats.find(c => c._id === selectedChatId);
      if (chat) {
        handleSelectChat(chat);
      }
    }
  }, [selectedChatId, chats]);

  // Socket event listeners
  useEffect(() => {
    if (socket) {
      // Join user's personal room for receiving messages
      socket.emit('join_user_room', user?.id);

      // Message events
      socket.on('message_received', (message: Message) => {
        setMessages(prev => [...prev, message]);
        
        // Update chat's last message
        setChats(prev => prev.map(chat => 
          chat._id === message.chatId 
            ? { ...chat, lastMessage: message, unreadCount: (chat.unreadCount || 0) + 1 }
            : chat
        ));

        // Show notification if not in current chat
        if (!selectedChat || selectedChat._id !== message.chatId) {
          const senderName = message.sender.name;
          toast({
            title: `New message from ${senderName}`,
            description: message.content,
          });
        }

        scrollToBottom();
      });

      socket.on('message_sent', (message: Message) => {
        setMessages(prev => [...prev, message]);
        
        // Update chat's last message
        setChats(prev => prev.map(chat => 
          chat._id === message.chatId 
            ? { ...chat, lastMessage: message }
            : chat
        ));

        scrollToBottom();
      });

      socket.on('message_delivered', ({ messageId, deliveredAt }) => {
        setMessages(prev => prev.map(msg => 
          msg._id === messageId 
            ? { ...msg, deliveredAt }
            : msg
        ));
      });

      socket.on('message_read', ({ messageId, readAt }) => {
        setMessages(prev => prev.map(msg => 
          msg._id === messageId 
            ? { ...msg, readAt }
            : msg
        ));
      });

      // Typing events
      socket.on('user_typing', ({ userId, userName, chatId }) => {
        if (selectedChat?._id === chatId && userId !== user?._id) {
          setTypingUsers(prev => new Set([...prev, userName]));
          
          // Clear typing after 3 seconds
          setTimeout(() => {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(userName);
              return newSet;
            });
          }, 3000);
        }
      });

      socket.on('user_stop_typing', ({ userName, chatId }) => {
        if (selectedChat?._id === chatId) {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(userName);
            return newSet;
          });
        }
      });

      // Online status events
      socket.on('user_online', ({ userId }) => {
        setOnlineUsers(prev => new Set([...prev, userId]));
      });

      socket.on('user_offline', ({ userId }) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      });

      return () => {
        socket.off('message_received');
        socket.off('message_sent');
        socket.off('message_delivered');
        socket.off('message_read');
        socket.off('user_typing');
        socket.off('user_stop_typing');
        socket.off('user_online');
        socket.off('user_offline');
      };
    }
  }, [socket, user?._id, selectedChat, toast]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChats = async () => {
    try {
      setIsLoading(true);
      const response = await chatService.getUserChats(1, 50);
      
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

  const loadMessages = async (chatId: string) => {
    try {
      setIsLoading(true);
      const response = await chatService.getChatMessages(chatId, 1, 50);
      
      if (response.success && response.data?.messages) {
        setMessages(response.data.messages);
        
        // Mark messages as read
        await chatService.markAsRead(chatId);
        
        // Update unread count
        setChats(prev => prev.map(chat => 
          chat._id === chatId 
            ? { ...chat, unreadCount: 0 }
            : chat
        ));
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
    await loadMessages(chat._id);
    
    // Join chat room for real-time updates
    if (socket) {
      socket.emit('join_chat', chat._id);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || isSending) return;

    try {
      setIsSending(true);
      
      const response = await chatService.sendMessage(selectedChat._id, {
        content: { text: newMessage.trim() },
        messageType: 'text'
      });

      if (response.success && response.data) {
        // Emit to socket for real-time delivery
        if (socket) {
          socket.emit('send_message', {
            chatId: selectedChat._id,
            message: response.data
          });
        }

        setNewMessage("");
        inputRef.current?.focus();
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

  const handleTyping = () => {
    if (socket && selectedChat) {
      socket.emit('typing', {
        chatId: selectedChat._id,
        userId: user?._id,
        userName: user?.name
      });
    }
  };

  const getOtherParticipant = (chat: Chat) => {
    return chat.participants.find(p => p.user._id !== user?._id);
  };

  const isUserOnline = (userId: string) => {
    return onlineUsers.has(userId);
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
    return otherParticipant?.user.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
      <Card className="w-full max-w-md h-full rounded-none border-l">
        <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
          <CardTitle className="text-lg">Messages</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <div className="flex flex-col h-[calc(100vh-4rem)]">
          {!selectedChat ? (
            /* Chat List View */
            <>
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
                    <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No conversations yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Start chatting with your doctors through consultations
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredChats.map((chat) => {
                      const otherParticipant = getOtherParticipant(chat);
                      const isOnline = otherParticipant && isUserOnline(otherParticipant.user._id);
                      
                      return (
                        <div
                          key={chat._id}
                          className="p-4 hover:bg-secondary/50 cursor-pointer transition-colors"
                          onClick={() => handleSelectChat(chat)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback>
                                  {otherParticipant?.user?.name?.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {isOnline && (
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                              )}
                            </div>
                            
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
                              
                              {isOnline && (
                                <p className="text-xs text-green-600 mt-1">Online</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </>
          ) : (
            /* Chat View */
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedChat(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  
                  <div className="relative">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>
                        {getOtherParticipant(selectedChat)?.user?.name?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {getOtherParticipant(selectedChat) && 
                     isUserOnline(getOtherParticipant(selectedChat)!._id) && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-background"></div>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-medium">
                      Dr. {getOtherParticipant(selectedChat)?.user?.name}
                    </h4>
                    {getOtherParticipant(selectedChat) && 
                     isUserOnline(getOtherParticipant(selectedChat)!.user._id) && (
                      <p className="text-xs text-green-600">Online</p>
                    )}
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
                        <div
                          key={message._id}
                          className={cn(
                            "flex gap-2",
                            isOwn ? "justify-end" : "justify-start"
                          )}
                        >
                          {!isOwn && showAvatar && (
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs">
                                {message.sender.name?.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {!isOwn && !showAvatar && <div className="w-6" />}
                          
                          <div
                            className={cn(
                              "max-w-[70%] rounded-lg p-3",
                              isOwn
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary"
                            )}
                          >
                            <p className="text-sm">{message.content}</p>
                            <div className={cn(
                              "flex items-center gap-1 mt-1",
                              isOwn ? "justify-end" : "justify-start"
                            )}>
                              <span className={cn(
                                "text-xs opacity-70",
                                isOwn ? "text-primary-foreground" : "text-muted-foreground"
                              )}>
                                {formatMessageTime(message.createdAt)}
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
                    })}
                    
                    {/* Typing indicator */}
                    {typingUsers.size > 0 && (
                      <div className="flex gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">
                            {getOtherParticipant(selectedChat)?.name?.slice(0, 2).toUpperCase()}
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
                    
                    <div ref={messagesEndRef} />
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
                      ref={inputRef}
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                      }}
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
            </>
          )}
        </div>
      </Card>
    </div>
  );
}