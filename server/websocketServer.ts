import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from './storage';
import { db } from './db';

interface WebSocketMessage {
  type: string;
  payload: any;
}

interface AuthenticatedClient extends WebSocket {
  userId?: string;
  conversationIds?: Set<number>;
}

interface MessageReaction {
  messageId: number;
  emoji: string;
  userId: string;
}

export function setupWebSocketServer(server: Server) {
  // Create WebSocket server on a distinct path
  const wss = new WebSocketServer({ server, path: '/ws' });
  
  // Track connected clients
  const clients = new Map<string, AuthenticatedClient>();
  
  // Track conversations and their participants
  const conversations = new Map<number, Set<string>>();
  
  // Track live session participants
  const liveSessions = new Map<string, Map<string, LiveSessionParticipant>>();
  
  interface LiveSessionParticipant {
    userId: string;
    userName: string;
    userRole: string;
    ws: AuthenticatedClient;
    joinedAt: Date;
    isMuted: boolean;
    hasVideo: boolean;
    isScreenSharing: boolean;
  }
  
  console.log('WebSocket server initialized');

  wss.on('connection', (ws: AuthenticatedClient) => {
    console.log('New WebSocket connection');
    ws.conversationIds = new Set();

    // Handle messages
    ws.on('message', async (data: WebSocket.Data) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        console.log(`Received message: ${message.type}`);

        // Process message based on type
        switch (message.type) {
          case 'authenticate':
            handleAuthentication(ws, message.payload);
            break;
          
          case 'join_conversation':
            handleJoinConversation(ws, message.payload);
            break;
          
          case 'send_message':
            await handleSendMessage(ws, message.payload);
            break;
          
          case 'mark_read':
            await handleMarkRead(ws, message.payload);
            break;
          
          case 'typing_indicator':
            handleTypingIndicator(ws, message.payload);
            break;
          
          case 'add_reaction':
            await handleAddReaction(ws, message.payload);
            break;
          
          case 'remove_reaction':
            await handleRemoveReaction(ws, message.payload);
            break;
          
          // WebRTC Live Session Support
          case 'join-session':
            handleJoinLiveSession(ws, message);
            break;
          
          case 'leave-session':
            handleLeaveLiveSession(ws, message);
            break;
          
          case 'webrtc-offer':
            handleWebRTCOffer(ws, message);
            break;
          
          case 'webrtc-answer':
            handleWebRTCAnswer(ws, message);
            break;
          
          case 'webrtc-ice-candidate':
            handleWebRTCIceCandidate(ws, message);
            break;
          
          case 'chat-message':
            handleLiveSessionChat(ws, message);
            break;
          
          case 'media-state-change':
            handleMediaStateChange(ws, message);
            break;
            
          default:
            console.warn(`Unknown message type: ${message.type}`);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      if (ws.userId) {
        clients.delete(ws.userId);
        console.log(`User disconnected: ${ws.userId}`);
        
        // Remove user from all conversations
        if (ws.conversationIds) {
          ws.conversationIds.forEach(conversationId => {
            const participants = conversations.get(conversationId);
            if (participants) {
              participants.delete(ws.userId!);
              if (participants.size === 0) {
                conversations.delete(conversationId);
              }
            }
          });
        }
      }
    });
  });

  // Authentication handler
  function handleAuthentication(ws: AuthenticatedClient, payload: { userId: string }) {
    const { userId } = payload;
    
    if (!userId) {
      return;
    }
    
    ws.userId = userId;
    clients.set(userId, ws);
    console.log(`User authenticated: ${userId}`);
    
    // Send confirmation
    sendToClient(ws, 'authentication_success', { userId });
  }

  // Join conversation handler
  function handleJoinConversation(ws: AuthenticatedClient, payload: { conversationId: number }) {
    const { conversationId } = payload;
    
    if (!ws.userId || !conversationId) {
      return;
    }
    
    // Add user to conversation
    if (!conversations.has(conversationId)) {
      conversations.set(conversationId, new Set());
    }
    
    const participants = conversations.get(conversationId)!;
    participants.add(ws.userId);
    
    // Add conversation to user's subscribed conversations
    ws.conversationIds!.add(conversationId);
    
    console.log(`User ${ws.userId} joined conversation ${conversationId}`);
    
    // Send confirmation
    sendToClient(ws, 'joined_conversation', { conversationId });
  }

  // Send message handler
  async function handleSendMessage(ws: AuthenticatedClient, payload: {
    conversationId: number;
    content: string;
    contentType?: string;
    attachmentUrl?: string;
    replyToId?: number;
  }) {
    if (!ws.userId) {
      return;
    }
    
    const { conversationId, content, contentType, attachmentUrl, replyToId } = payload;
    
    try {
      // Store message in database
      const message = await storage.createMessage({
        conversationId,
        senderId: ws.userId,
        content,
        contentType: contentType || 'text',
        attachmentUrl: attachmentUrl || null,
        replyToId: replyToId || null,
        sentAt: new Date(),
        isEdited: false
      });
      
      // Get sender info
      const sender = await storage.getUser(ws.userId);
      
      // Broadcast message to all participants in the conversation
      broadcastToConversation(conversationId, 'new_message', {
        ...message,
        sender: {
          firstName: sender?.firstName,
          lastName: sender?.lastName,
          profileImageUrl: sender?.profileImageUrl
        }
      });
      
      console.log(`Message sent in conversation ${conversationId} by user ${ws.userId}`);
    } catch (error) {
      console.error('Error saving message:', error);
      sendToClient(ws, 'error', { message: 'Failed to send message' });
    }
  }

  // Mark message as read handler
  async function handleMarkRead(ws: AuthenticatedClient, payload: {
    conversationId: number;
    messageId: number;
  }) {
    if (!ws.userId) {
      return;
    }
    
    const { conversationId, messageId } = payload;
    
    try {
      // Update message read status in database
      await storage.markMessageRead(conversationId, ws.userId, messageId);
      
      // Broadcast read status to conversation participants
      broadcastToConversation(conversationId, 'message_read', {
        conversationId,
        messageId,
        userId: ws.userId
      });
      
      console.log(`Message ${messageId} marked as read by user ${ws.userId}`);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  // Typing indicator handler
  function handleTypingIndicator(ws: AuthenticatedClient, payload: {
    conversationId: number;
    isTyping: boolean;
  }) {
    if (!ws.userId) {
      return;
    }
    
    const { conversationId, isTyping } = payload;
    
    // Broadcast typing status to conversation participants (except sender)
    broadcastToConversation(
      conversationId, 
      'typing_indicator', 
      { conversationId, userId: ws.userId, isTyping },
      ws.userId
    );
    
    console.log(`User ${ws.userId} ${isTyping ? 'is typing' : 'stopped typing'} in conversation ${conversationId}`);
  }

  // Add reaction handler
  async function handleAddReaction(ws: AuthenticatedClient, payload: {
    messageId: number;
    emoji: string;
  }) {
    if (!ws.userId) {
      return;
    }
    
    const { messageId, emoji } = payload;
    
    try {
      // Save reaction in database
      const reaction = await storage.addMessageReaction({
        messageId,
        emoji,
        userId: ws.userId
      });
      
      // Get the conversation ID for the message
      const message = await storage.getMessage(messageId);
      
      if (message) {
        // Broadcast reaction to conversation participants
        broadcastToConversation(message.conversationId, 'message_reaction_added', {
          messageId,
          reaction: emoji,
          userId: ws.userId
        });
        
        console.log(`User ${ws.userId} added reaction ${emoji} to message ${messageId}`);
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
      sendToClient(ws, 'error', { message: 'Failed to add reaction' });
    }
  }

  // Remove reaction handler
  async function handleRemoveReaction(ws: AuthenticatedClient, payload: {
    messageId: number;
    emoji: string;
  }) {
    if (!ws.userId) {
      return;
    }
    
    const { messageId, emoji } = payload;
    
    try {
      // Remove reaction from database
      await storage.removeMessageReaction(messageId, ws.userId, emoji);
      
      // Get the conversation ID for the message
      const message = await storage.getMessage(messageId);
      
      if (message) {
        // Broadcast reaction removal to conversation participants
        broadcastToConversation(message.conversationId, 'message_reaction_removed', {
          messageId,
          reaction: emoji,
          userId: ws.userId
        });
        
        console.log(`User ${ws.userId} removed reaction ${emoji} from message ${messageId}`);
      }
    } catch (error) {
      console.error('Error removing reaction:', error);
      sendToClient(ws, 'error', { message: 'Failed to remove reaction' });
    }
  }

  // Helper to send message to a specific client
  function sendToClient(client: WebSocket, type: string, payload: any) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type, payload }));
    }
  }

  // Helper to broadcast message to all participants in a conversation
  function broadcastToConversation(
    conversationId: number, 
    type: string, 
    payload: any,
    excludeUserId?: string
  ) {
    const participants = conversations.get(conversationId) || new Set();
    
    participants.forEach(userId => {
      if (excludeUserId && userId === excludeUserId) {
        return; // Skip excluded user
      }
      
      const client = clients.get(userId);
      if (client && client.readyState === WebSocket.OPEN) {
        sendToClient(client, type, payload);
      }
    });
  }

  // WebRTC Live Session Handlers
  function handleJoinLiveSession(ws: AuthenticatedClient, message: any) {
    const { sessionId, userId, userName, userRole } = message;
    
    if (!sessionId || !userId || !userName) {
      return;
    }
    
    // Initialize session if it doesn't exist
    if (!liveSessions.has(sessionId)) {
      liveSessions.set(sessionId, new Map());
    }
    
    const sessionParticipants = liveSessions.get(sessionId)!;
    
    // Add participant to session
    const participant: LiveSessionParticipant = {
      userId,
      userName,
      userRole,
      ws,
      joinedAt: new Date(),
      isMuted: true,
      hasVideo: false,
      isScreenSharing: false
    };
    
    sessionParticipants.set(userId, participant);
    
    console.log(`User ${userName} (${userId}) joined live session ${sessionId}`);
    
    // Notify other participants about new user
    broadcastToLiveSession(sessionId, 'user-joined', {
      userId,
      userName,
      userRole,
      joinedAt: participant.joinedAt
    }, userId);
    
    // Send current participants list to new user
    const participants = Array.from(sessionParticipants.values()).map(p => ({
      id: p.userId,
      name: p.userName,
      role: p.userRole,
      isHost: p.userRole === 'mentor' || p.userRole === 'admin',
      isMuted: p.isMuted,
      hasVideo: p.hasVideo,
      isScreenSharing: p.isScreenSharing
    }));
    
    sendToClient(ws, 'participants-update', { participants });
  }
  
  function handleLeaveLiveSession(ws: AuthenticatedClient, message: any) {
    const { sessionId } = message;
    
    if (!sessionId || !ws.userId) {
      return;
    }
    
    const sessionParticipants = liveSessions.get(sessionId);
    if (!sessionParticipants) {
      return;
    }
    
    const participant = sessionParticipants.get(ws.userId);
    if (!participant) {
      return;
    }
    
    // Remove participant from session
    sessionParticipants.delete(ws.userId);
    
    console.log(`User ${participant.userName} (${ws.userId}) left live session ${sessionId}`);
    
    // Notify other participants
    broadcastToLiveSession(sessionId, 'user-left', {
      userId: ws.userId,
      userName: participant.userName
    });
    
    // Clean up empty session
    if (sessionParticipants.size === 0) {
      liveSessions.delete(sessionId);
    }
  }
  
  function handleWebRTCOffer(ws: AuthenticatedClient, message: any) {
    const { sessionId, targetId, offer } = message;
    
    if (!sessionId || !targetId || !offer || !ws.userId) {
      return;
    }
    
    const sessionParticipants = liveSessions.get(sessionId);
    if (!sessionParticipants) {
      return;
    }
    
    const targetParticipant = sessionParticipants.get(targetId);
    if (!targetParticipant) {
      return;
    }
    
    // Forward offer to target participant
    sendToClient(targetParticipant.ws, 'webrtc-offer', {
      senderId: ws.userId,
      offer
    });
  }
  
  function handleWebRTCAnswer(ws: AuthenticatedClient, message: any) {
    const { sessionId, targetId, answer } = message;
    
    if (!sessionId || !targetId || !answer || !ws.userId) {
      return;
    }
    
    const sessionParticipants = liveSessions.get(sessionId);
    if (!sessionParticipants) {
      return;
    }
    
    const targetParticipant = sessionParticipants.get(targetId);
    if (!targetParticipant) {
      return;
    }
    
    // Forward answer to target participant
    sendToClient(targetParticipant.ws, 'webrtc-answer', {
      senderId: ws.userId,
      answer
    });
  }
  
  function handleWebRTCIceCandidate(ws: AuthenticatedClient, message: any) {
    const { sessionId, targetId, candidate } = message;
    
    if (!sessionId || !targetId || !candidate || !ws.userId) {
      return;
    }
    
    const sessionParticipants = liveSessions.get(sessionId);
    if (!sessionParticipants) {
      return;
    }
    
    const targetParticipant = sessionParticipants.get(targetId);
    if (!targetParticipant) {
      return;
    }
    
    // Forward ICE candidate to target participant
    sendToClient(targetParticipant.ws, 'webrtc-ice-candidate', {
      senderId: ws.userId,
      candidate
    });
  }
  
  function handleLiveSessionChat(ws: AuthenticatedClient, message: any) {
    const { sessionId, message: chatMessage } = message;
    
    if (!sessionId || !chatMessage || !ws.userId) {
      return;
    }
    
    const sessionParticipants = liveSessions.get(sessionId);
    if (!sessionParticipants) {
      return;
    }
    
    const participant = sessionParticipants.get(ws.userId);
    if (!participant) {
      return;
    }
    
    // Broadcast chat message to all participants
    broadcastToLiveSession(sessionId, 'chat-message', {
      senderId: ws.userId,
      senderName: participant.userName,
      message: chatMessage,
      timestamp: new Date().toISOString()
    });
  }
  
  function handleMediaStateChange(ws: AuthenticatedClient, message: any) {
    const { sessionId, isMuted, hasVideo, isScreenSharing } = message;
    
    if (!sessionId || !ws.userId) {
      return;
    }
    
    const sessionParticipants = liveSessions.get(sessionId);
    if (!sessionParticipants) {
      return;
    }
    
    const participant = sessionParticipants.get(ws.userId);
    if (!participant) {
      return;
    }
    
    // Update participant media state
    participant.isMuted = isMuted;
    participant.hasVideo = hasVideo;
    participant.isScreenSharing = isScreenSharing;
    
    // Broadcast media state change to all participants
    broadcastToLiveSession(sessionId, 'media-state-changed', {
      userId: ws.userId,
      isMuted,
      hasVideo,
      isScreenSharing
    });
  }
  
  // Helper to broadcast message to all participants in a live session
  function broadcastToLiveSession(
    sessionId: string, 
    type: string, 
    payload: any,
    excludeUserId?: string
  ) {
    const sessionParticipants = liveSessions.get(sessionId);
    if (!sessionParticipants) {
      return;
    }
    
    sessionParticipants.forEach((participant, userId) => {
      if (excludeUserId && userId === excludeUserId) {
        return; // Skip excluded user
      }
      
      if (participant.ws.readyState === WebSocket.OPEN) {
        sendToClient(participant.ws, type, payload);
      }
    });
  }

  return wss;
}