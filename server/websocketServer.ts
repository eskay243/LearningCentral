import { WebSocketServer, type WebSocket } from 'ws';
import { type Server } from 'http';
import { storage } from './storage';

// Connected clients map
type ConnectedClient = {
  userId: string;
  socket: WebSocket;
  heartbeat: number; // Timestamp of last heartbeat
};

type WebSocketMessage = {
  type: string;
  payload: any;
};

export class MessageWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, ConnectedClient> = new Map();
  private heartbeatInterval: NodeJS.Timeout;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.setupWebSocketServer();
    
    // Set up heartbeat interval (ping clients every 30 seconds)
    this.heartbeatInterval = setInterval(() => {
      this.checkHeartbeats();
    }, 30000);
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (socket, req) => {
      console.log('WebSocket client connected');
      
      // Extract user ID from query params
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const userId = url.searchParams.get('userId');
      
      if (!userId) {
        console.error('Client connected without userId, closing connection');
        socket.close(1008, 'User ID is required');
        return;
      }
      
      // Register client
      const client: ConnectedClient = {
        userId,
        socket,
        heartbeat: Date.now()
      };
      this.clients.set(userId, client);
      
      // Handle messages
      socket.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString()) as WebSocketMessage;
          await this.handleMessage(userId, message);
          
          // Update heartbeat
          const client = this.clients.get(userId);
          if (client) {
            client.heartbeat = Date.now();
          }
        } catch (error) {
          console.error('Error processing message:', error);
          this.sendToClient(userId, {
            type: 'error',
            payload: { message: 'Error processing message' }
          });
        }
      });
      
      // Handle disconnection
      socket.on('close', () => {
        console.log(`WebSocket client disconnected: ${userId}`);
        this.clients.delete(userId);
      });
      
      // Send initial connection successful message
      this.sendToClient(userId, {
        type: 'connection_established',
        payload: { userId }
      });
    });
  }
  
  private async handleMessage(userId: string, message: WebSocketMessage) {
    const { type, payload } = message;
    
    switch (type) {
      case 'ping':
        this.sendToClient(userId, { type: 'pong', payload: {} });
        break;
        
      case 'send_message':
        await this.handleSendMessage(userId, payload);
        break;
        
      case 'message_read':
        await this.handleMessageRead(userId, payload);
        break;
        
      case 'join_conversation':
        await this.handleJoinConversation(userId, payload);
        break;
        
      case 'typing':
        await this.handleTypingIndicator(userId, payload);
        break;
        
      case 'add_reaction':
        await this.handleAddReaction(userId, payload);
        break;
        
      case 'remove_reaction':
        await this.handleRemoveReaction(userId, payload);
        break;
        
      default:
        console.warn(`Unknown message type: ${type}`);
        this.sendToClient(userId, {
          type: 'error',
          payload: { message: `Unknown message type: ${type}` }
        });
    }
  }
  
  private async handleSendMessage(userId: string, payload: any) {
    const { conversationId, content, contentType, attachmentUrl, replyToId } = payload;
    
    try {
      // Check if user is part of the conversation
      const isParticipant = await storage.isConversationParticipant(userId, conversationId);
      if (!isParticipant) {
        this.sendToClient(userId, {
          type: 'error',
          payload: { message: 'You are not authorized to send messages to this conversation' }
        });
        return;
      }
      
      // Send message through storage
      const message = await storage.sendMessage({
        conversationId,
        senderId: userId,
        content,
        contentType: contentType || 'text',
        attachmentUrl: attachmentUrl || null,
        replyToId: replyToId || null
      });
      
      // Get participants of the conversation to broadcast the message
      const participants = await storage.getConversationParticipants(conversationId);
      
      // Broadcast message to all participants
      participants.forEach(participant => {
        this.sendToClient(participant.userId, {
          type: 'new_message',
          payload: message
        });
      });
      
      // Send confirmation to sender
      this.sendToClient(userId, {
        type: 'message_sent',
        payload: { messageId: message.id }
      });
    } catch (error) {
      console.error('Error sending message:', error);
      this.sendToClient(userId, {
        type: 'error',
        payload: { message: 'Failed to send message' }
      });
    }
  }
  
  private async handleMessageRead(userId: string, payload: any) {
    const { conversationId, messageId } = payload;
    
    try {
      // Update last read message
      await storage.updateLastReadMessage(conversationId, userId, messageId);
      
      // Get other participants to notify them
      const participants = await storage.getConversationParticipants(conversationId);
      
      // Notify other participants about read status
      participants
        .filter(p => p.userId !== userId)
        .forEach(participant => {
          this.sendToClient(participant.userId, {
            type: 'message_read',
            payload: { conversationId, userId, messageId }
          });
        });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }
  
  private async handleJoinConversation(userId: string, payload: any) {
    const { conversationId } = payload;
    
    try {
      // Check if user is part of the conversation
      const isParticipant = await storage.isConversationParticipant(userId, conversationId);
      if (!isParticipant) {
        this.sendToClient(userId, {
          type: 'error',
          payload: { message: 'You are not authorized to join this conversation' }
        });
        return;
      }
      
      // Get recent messages
      const messages = await storage.getConversationMessages(conversationId);
      
      // Send recent messages to the user
      this.sendToClient(userId, {
        type: 'conversation_history',
        payload: { conversationId, messages }
      });
    } catch (error) {
      console.error('Error joining conversation:', error);
      this.sendToClient(userId, {
        type: 'error',
        payload: { message: 'Failed to join conversation' }
      });
    }
  }
  
  private async handleTypingIndicator(userId: string, payload: any) {
    const { conversationId, isTyping } = payload;
    
    try {
      // Get participants to notify them
      const participants = await storage.getConversationParticipants(conversationId);
      
      // Broadcast typing status to other participants
      participants
        .filter(p => p.userId !== userId)
        .forEach(participant => {
          this.sendToClient(participant.userId, {
            type: 'typing_indicator',
            payload: { conversationId, userId, isTyping }
          });
        });
    } catch (error) {
      console.error('Error broadcasting typing indicator:', error);
    }
  }
  
  private async handleAddReaction(userId: string, payload: any) {
    const { messageId, reaction } = payload;
    
    try {
      // Add reaction
      await storage.addMessageReaction(messageId, userId, reaction);
      
      // Get message details to find conversation
      const message = await storage.getMessage(messageId);
      if (!message) {
        this.sendToClient(userId, {
          type: 'error',
          payload: { message: 'Message not found' }
        });
        return;
      }
      
      // Get participants to notify them
      const participants = await storage.getConversationParticipants(message.conversationId);
      
      // Broadcast reaction to all participants
      participants.forEach(participant => {
        this.sendToClient(participant.userId, {
          type: 'message_reaction_added',
          payload: { messageId, userId, reaction }
        });
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
      this.sendToClient(userId, {
        type: 'error',
        payload: { message: 'Failed to add reaction' }
      });
    }
  }
  
  private async handleRemoveReaction(userId: string, payload: any) {
    const { messageId, reaction } = payload;
    
    try {
      // Remove reaction
      await storage.removeMessageReaction(messageId, userId, reaction);
      
      // Get message details to find conversation
      const message = await storage.getMessage(messageId);
      if (!message) {
        this.sendToClient(userId, {
          type: 'error',
          payload: { message: 'Message not found' }
        });
        return;
      }
      
      // Get participants to notify them
      const participants = await storage.getConversationParticipants(message.conversationId);
      
      // Broadcast reaction removal to all participants
      participants.forEach(participant => {
        this.sendToClient(participant.userId, {
          type: 'message_reaction_removed',
          payload: { messageId, userId, reaction }
        });
      });
    } catch (error) {
      console.error('Error removing reaction:', error);
      this.sendToClient(userId, {
        type: 'error',
        payload: { message: 'Failed to remove reaction' }
      });
    }
  }
  
  private sendToClient(userId: string, message: WebSocketMessage) {
    const client = this.clients.get(userId);
    if (client && client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(JSON.stringify(message));
    }
  }
  
  private checkHeartbeats() {
    const now = Date.now();
    const timeout = 60000; // 1 minute timeout
    
    this.clients.forEach((client, userId) => {
      if (now - client.heartbeat > timeout) {
        console.log(`Client ${userId} timed out (no heartbeat)`);
        client.socket.close(1001, 'Connection timeout');
        this.clients.delete(userId);
      }
    });
  }
  
  // Public method to broadcast system messages (e.g., announcements)
  public broadcastSystemMessage(message: string, targetUserIds?: string[]) {
    const payload = {
      type: 'system_message',
      payload: { message, timestamp: new Date().toISOString() }
    };
    
    if (targetUserIds) {
      // Send to specific users
      targetUserIds.forEach(userId => {
        this.sendToClient(userId, payload);
      });
    } else {
      // Broadcast to all connected clients
      this.clients.forEach((client) => {
        this.sendToClient(client.userId, payload);
      });
    }
  }
  
  // Clean up resources
  public close() {
    clearInterval(this.heartbeatInterval);
    this.wss.close();
  }
}