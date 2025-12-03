import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

// Socket Context Types
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  emitEvent: (event: string, data: any) => void;
  onEvent: (event: string, callback: (data: any) => void) => void;
  offEvent: (event: string, callback?: (data: any) => void) => void;
}

// Create Socket Context
const SocketContext = createContext<SocketContextType | undefined>(undefined);

// Socket Provider Props
interface SocketProviderProps {
  children: ReactNode;
}

// Socket Provider Component
export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);

  // Initialize socket connection
  useEffect(() => {
    if (isAuthenticated && user) {
      initializeSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, user]);

  // Initialize socket connection
  const initializeSocket = () => {
    try {
      // Create socket connection
      socketRef.current = io((import.meta as any).env?.VITE_SOCKET_URL || 'https://medvision-ai-d10f.onrender.com', {
        auth: {
          userId: user?.id,
          token: localStorage.getItem('token'),
        },
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
      });

      const socket = socketRef.current;

      // Connection event handlers
      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
        setIsConnected(true);

        // Join user-specific room
        if (user?._id) {
          socket.emit('join-user-room', user._id);
        }
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      // User-specific events
      socket.on('user-joined', (data) => {
        console.log('User joined:', data);
      });

      socket.on('user-left', (data) => {
        console.log('User left:', data);
      });

      // Consultation events
      socket.on('consultation-status-updated', (data) => {
        console.log('Consultation status updated:', data);
        // Handle consultation status updates
      });

      socket.on('consultation-reminder', (data) => {
        console.log('Consultation reminder:', data);
        // Handle consultation reminders
      });

      // Video call events
      socket.on('video-call-started', (data) => {
        console.log('Video call started:', data);
        // Handle video call start
      });

      socket.on('video-call-ended', (data) => {
        console.log('Video call ended:', data);
        // Handle video call end
      });

      socket.on('participant-joined-call', (data) => {
        console.log('Participant joined call:', data);
        // Handle participant joining
      });

      socket.on('participant-left-call', (data) => {
        console.log('Participant left call:', data);
        // Handle participant leaving
      });

      // Chat events
      socket.on('new-message', (data) => {
        console.log('New message:', data);
        // Handle new chat messages
      });

      socket.on('message-updated', (data) => {
        console.log('Message updated:', data);
        // Handle message updates
      });

      // Notification events
      socket.on('notification', (data) => {
        console.log('Notification:', data);
        // Handle general notifications
      });

    } catch (error) {
      console.error('Socket initialization error:', error);
    }
  };

  // Disconnect socket
  const disconnectSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  };

  // Join a room
  const joinRoom = (roomId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join-room', roomId);
      console.log('Joined room:', roomId);
    }
  };

  // Leave a room
  const leaveRoom = (roomId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave-room', roomId);
      console.log('Left room:', roomId);
    }
  };

  // Emit an event
  const emitEvent = (event: string, data: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    }
  };

  // Listen to an event
  const onEvent = (event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  // Stop listening to an event
  const offEvent = (event: string, callback?: (data: any) => void) => {
    if (socketRef.current) {
      if (callback) {
        socketRef.current.off(event, callback);
      } else {
        socketRef.current.off(event);
      }
    }
  };

  // Socket context value
  const value: SocketContextType = {
    socket: socketRef.current,
    isConnected,
    joinRoom,
    leaveRoom,
    emitEvent,
    onEvent,
    offEvent,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// Hook to use socket context
export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  
  return context;
};

// Custom hooks for specific socket events
export const useSocketEvent = (event: string, callback: (data: any) => void) => {
  const { onEvent, offEvent } = useSocket();
  
  useEffect(() => {
    onEvent(event, callback);
    
    return () => {
      offEvent(event, callback);
    };
  }, [event, callback, onEvent, offEvent]);
};

// Hook for consultation events
export const useConsultationEvents = () => {
  const { emitEvent, onEvent, offEvent } = useSocket();
  
  const joinConsultation = (consultationId: string) => {
    emitEvent('join-consultation', { consultationId });
  };
  
  const leaveConsultation = (consultationId: string) => {
    emitEvent('leave-consultation', { consultationId });
  };
  
  const startVideoCall = (consultationId: string, roomUrl: string) => {
    emitEvent('start-video-call', { consultationId, roomUrl });
  };
  
  const endVideoCall = (consultationId: string) => {
    emitEvent('end-video-call', { consultationId });
  };
  
  return {
    joinConsultation,
    leaveConsultation,
    startVideoCall,
    endVideoCall,
    onEvent,
    offEvent,
  };
};

// Hook for chat events
export const useChatEvents = () => {
  const { emitEvent, onEvent, offEvent } = useSocket();
  
  const joinChat = (chatId: string) => {
    emitEvent('join-chat', { chatId });
  };
  
  const leaveChat = (chatId: string) => {
    emitEvent('leave-chat', { chatId });
  };
  
  const sendMessage = (chatId: string, message: string, type: string = 'text') => {
    emitEvent('send-message', { chatId, message, type });
  };
  
  const markAsRead = (chatId: string, messageIds: string[]) => {
    emitEvent('mark-as-read', { chatId, messageIds });
  };
  
  return {
    joinChat,
    leaveChat,
    sendMessage,
    markAsRead,
    onEvent,
    offEvent,
  };
}