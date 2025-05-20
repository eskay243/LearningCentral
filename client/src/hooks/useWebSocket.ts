import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface WebSocketHookProps {
  onMessage: (type: string, payload: any) => void;
}

interface WebSocketMessage {
  type: string;
  payload: any;
}

export function useWebSocket({ onMessage }: WebSocketHookProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_TIMEOUT = 3000; // 3 seconds

  // Initialize WebSocket connection
  const initializeSocket = useCallback(() => {
    if (!user) return;

    try {
      // Create WebSocket URL using the current protocol and host
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      // Close any existing socket before creating a new one
      if (socketRef.current) {
        socketRef.current.close();
      }

      // Create new WebSocket connection
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      // Setup event handlers
      socket.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;
        
        // Send authentication message once connected
        sendMessage('authenticate', { userId: user.id });
      };

      socket.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          
          // Call the provided callback with message type and payload
          if (data && data.type) {
            onMessage(data.type, data.payload);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: 'Connection Error',
          description: 'There was an error with the messaging connection',
          variant: 'destructive'
        });
      };

      socket.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect unless the maximum attempts is reached
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectTimerRef.current = setTimeout(() => {
            reconnectAttempts.current += 1;
            console.log(`Attempting to reconnect (${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})...`);
            initializeSocket();
          }, RECONNECT_TIMEOUT);
        } else {
          toast({
            title: 'Connection Lost',
            description: 'Unable to reconnect to the messaging service',
            variant: 'destructive'
          });
        }
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  }, [user, onMessage, toast]);

  // Helper function to send messages through the WebSocket
  const sendMessage = useCallback((type: string, payload: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = { type, payload };
      socketRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // Join a conversation
  const joinConversation = useCallback((conversationId: number) => {
    return sendMessage('join_conversation', { conversationId });
  }, [sendMessage]);

  // Send a chat message
  const sendChatMessage = useCallback((
    conversationId: number, 
    content: string, 
    options?: {
      contentType?: string;
      attachmentUrl?: string;
      replyToId?: number;
    }
  ) => {
    return sendMessage('send_message', {
      conversationId,
      content,
      contentType: options?.contentType || 'text',
      attachmentUrl: options?.attachmentUrl,
      replyToId: options?.replyToId
    });
  }, [sendMessage]);

  // Mark message as read
  const markMessageRead = useCallback((conversationId: number, messageId: number) => {
    return sendMessage('mark_read', { conversationId, messageId });
  }, [sendMessage]);

  // Send typing indicator
  const sendTypingIndicator = useCallback((conversationId: number, isTyping: boolean) => {
    return sendMessage('typing_indicator', { conversationId, isTyping });
  }, [sendMessage]);

  // Add reaction to message
  const addReaction = useCallback((messageId: number, emoji: string) => {
    return sendMessage('add_reaction', { messageId, emoji });
  }, [sendMessage]);

  // Remove reaction from message
  const removeReaction = useCallback((messageId: number, emoji: string) => {
    return sendMessage('remove_reaction', { messageId, emoji });
  }, [sendMessage]);

  // Initialize WebSocket when component mounts or user changes
  useEffect(() => {
    if (user) {
      initializeSocket();
    }
    
    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [user, initializeSocket]);

  return {
    isConnected,
    joinConversation,
    sendChatMessage,
    markMessageRead,
    sendTypingIndicator,
    addReaction,
    removeReaction
  };
}