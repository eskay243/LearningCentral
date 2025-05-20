import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

type WebSocketMessage = {
  type: string;
  payload: any;
};

export interface UseWebSocketOptions {
  onMessage?: (messageType: string, payload: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { 
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    autoReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5
  } = options;
  
  const { user } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clean up previous reconnect attempt if exists
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);
  
  // Initialize connection to WebSocket server
  const connect = useCallback(() => {
    if (!user?.id) return;
    
    // Clean up any existing socket
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    
    setIsConnecting(true);
    
    // Determine WebSocket URL (using secure connection if on HTTPS)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?userId=${user.id}`;
    
    // Create WebSocket connection
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;
    
    // Connection opened
    socket.addEventListener('open', () => {
      setIsConnected(true);
      setIsConnecting(false);
      reconnectAttemptsRef.current = 0;
      
      // Set up ping interval (every 30 seconds) to prevent connection timeouts
      const pingInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping', payload: {} }));
        } else {
          clearInterval(pingInterval);
        }
      }, 30000);
      
      if (onConnect) onConnect();
    });
    
    // Connection closed
    socket.addEventListener('close', (event) => {
      setIsConnected(false);
      setIsConnecting(false);
      
      if (onDisconnect) onDisconnect();
      
      // Attempt to reconnect if enabled
      if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
        clearReconnectTimeout();
        reconnectAttemptsRef.current += 1;
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectInterval);
        
        toast({
          title: "Connection lost",
          description: `Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`,
          variant: "destructive"
        });
      } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        toast({
          title: "Connection failed",
          description: "Unable to connect to messaging server. Please refresh the page.",
          variant: "destructive"
        });
      }
    });
    
    // Connection error
    socket.addEventListener('error', (error) => {
      if (onError) onError(error);
      
      toast({
        title: "Connection error",
        description: "Error connecting to messaging server.",
        variant: "destructive"
      });
    });
    
    // Listen for messages
    socket.addEventListener('message', (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        // Handle specific message types internally
        switch (message.type) {
          case 'pong':
            // Heartbeat response, no action needed
            break;
            
          case 'connection_established':
            toast({
              title: "Connected",
              description: "Real-time messaging is now active.",
              variant: "default"
            });
            break;
            
          case 'error':
            toast({
              title: "Error",
              description: message.payload.message || "An error occurred",
              variant: "destructive"
            });
            break;
            
          default:
            // Pass all other messages to the callback
            if (onMessage) {
              onMessage(message.type, message.payload);
            }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    return () => {
      socket.close();
    };
  }, [user?.id, onConnect, onDisconnect, onError, onMessage, autoReconnect, reconnectInterval, maxReconnectAttempts, toast, clearReconnectTimeout]);
  
  useEffect(() => {
    if (user?.id) {
      connect();
    }
    
    return () => {
      // Clean up on unmount
      if (socketRef.current) {
        socketRef.current.close();
      }
      clearReconnectTimeout();
    };
  }, [user?.id, connect, clearReconnectTimeout]);
  
  // Send a message through the WebSocket
  const sendMessage = useCallback((type: string, payload: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, payload }));
      return true;
    }
    return false;
  }, []);
  
  // Join a conversation to get history and real-time updates
  const joinConversation = useCallback((conversationId: number) => {
    return sendMessage('join_conversation', { conversationId });
  }, [sendMessage]);
  
  // Send a chat message to a conversation
  const sendChatMessage = useCallback((conversationId: number, content: string, options?: { contentType?: string, attachmentUrl?: string, replyToId?: number }) => {
    return sendMessage('send_message', {
      conversationId,
      content,
      contentType: options?.contentType || 'text',
      attachmentUrl: options?.attachmentUrl,
      replyToId: options?.replyToId
    });
  }, [sendMessage]);
  
  // Mark messages as read
  const markMessageRead = useCallback((conversationId: number, messageId: number) => {
    return sendMessage('message_read', { conversationId, messageId });
  }, [sendMessage]);
  
  // Send typing indicator
  const sendTypingIndicator = useCallback((conversationId: number, isTyping: boolean) => {
    return sendMessage('typing', { conversationId, isTyping });
  }, [sendMessage]);
  
  // Add a reaction to a message
  const addReaction = useCallback((messageId: number, reaction: string) => {
    return sendMessage('add_reaction', { messageId, reaction });
  }, [sendMessage]);
  
  // Remove a reaction from a message
  const removeReaction = useCallback((messageId: number, reaction: string) => {
    return sendMessage('remove_reaction', { messageId, reaction });
  }, [sendMessage]);
  
  return {
    isConnected,
    isConnecting,
    connect,
    joinConversation,
    sendChatMessage,
    markMessageRead,
    sendTypingIndicator,
    addReaction,
    removeReaction
  };
}