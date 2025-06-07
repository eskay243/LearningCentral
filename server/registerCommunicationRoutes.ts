import { type Express } from "express";
import { storage } from "./storage";
import { isAuthenticated } from "./simpleAuth";
import { z } from "zod";

export function registerCommunicationRoutes(app: Express) {
  // Get all conversations for a user
  app.get('/api/messages/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const conversations = await storage.getUserConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Get messages for a specific conversation
  app.get('/api/messages/conversations/:conversationId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const conversationId = parseInt(req.params.conversationId);
      
      // Check if user is part of this conversation
      const isParticipant = await storage.isConversationParticipant(userId, conversationId);
      if (!isParticipant) {
        return res.status(403).json({ message: "You are not authorized to view this conversation" });
      }
      
      const messages = await storage.getConversationMessages(conversationId);
      
      // Mark messages as read
      await storage.markMessagesAsRead(conversationId, userId);
      
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Create a new conversation
  app.post('/api/messages/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const participantIds = req.body.participantIds || [];
      
      // Validate
      if (!participantIds.length) {
        return res.status(400).json({ message: "You must include at least one participant" });
      }
      
      // Create conversation
      const conversation = await storage.createConversation({
        creatorId: userId,
        title: req.body.title || null,
        isGroup: participantIds.length > 1,
      });
      
      // Add participants
      await storage.addConversationParticipants(
        conversation.id, 
        [userId, ...participantIds.filter((id: string) => id !== userId)]
      );
      
      // Send initial message if provided
      if (req.body.initialMessage) {
        await storage.sendMessage({
          conversationId: conversation.id,
          senderId: userId,
          content: req.body.initialMessage,
        });
      }
      
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  // Send a message
  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const senderId = req.user.id;
      const { conversationId, content } = req.body;
      
      // Validate
      const schema = z.object({
        conversationId: z.number(),
        content: z.string().min(1),
      });
      schema.parse({ conversationId, content });
      
      // Check if user is part of this conversation
      const isParticipant = await storage.isConversationParticipant(senderId, conversationId);
      if (!isParticipant) {
        return res.status(403).json({ message: "You are not authorized to send messages to this conversation" });
      }
      
      // Send message
      const message = await storage.sendMessage({
        conversationId,
        senderId,
        content,
      });
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Add participants to a conversation
  app.post('/api/messages/conversations/:conversationId/participants', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const conversationId = parseInt(req.params.conversationId);
      const participantIds = req.body.participantIds || [];
      
      // Validate
      if (!participantIds.length) {
        return res.status(400).json({ message: "You must include at least one participant" });
      }
      
      // Check if user is part of this conversation
      const isParticipant = await storage.isConversationParticipant(userId, conversationId);
      if (!isParticipant) {
        return res.status(403).json({ message: "You are not authorized to add participants to this conversation" });
      }
      
      // Add participants
      await storage.addConversationParticipants(conversationId, participantIds);
      
      res.status(201).json({ message: "Participants added successfully" });
    } catch (error) {
      console.error("Error adding participants:", error);
      res.status(500).json({ message: "Failed to add participants" });
    }
  });

  // Get all announcements
  app.get('/api/announcements', isAuthenticated, async (req: any, res) => {
    try {
      const announcements = await storage.getAnnouncements({
        limit: parseInt(req.query.limit) || 10,
        offset: parseInt(req.query.offset) || 0,
      });
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  // Get course announcements
  app.get('/api/courses/:courseId/announcements', isAuthenticated, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const announcements = await storage.getCourseAnnouncements(courseId, {
        limit: parseInt(req.query.limit) || 10,
        offset: parseInt(req.query.offset) || 0,
      });
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching course announcements:", error);
      res.status(500).json({ message: "Failed to fetch course announcements" });
    }
  });

  // Get users by role (for creating conversations)
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const role = req.query.role;
      const users = await storage.getUsersByRole(role);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
}