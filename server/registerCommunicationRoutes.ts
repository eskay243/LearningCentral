import { type Express } from "express";
import { storage } from "./storage";
import { isAuthenticated, hasRole } from "./auth";
import { z } from "zod";

export function registerCommunicationRoutes(app: Express) {
  // Get all conversations for a user (used by header MessageCenter)
  app.get('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      
      console.log(`Fetching conversations for user: ${userId} with role: ${userRole}`);
      
      // Get conversations based on user role and permissions
      let conversations = [];
      
      if (userRole === 'admin') {
        // Admin can see all conversations
        conversations = await storage.getAllConversations();
      } else if (userRole === 'mentor') {
        // Mentors can only see conversations they're part of or from their enrolled students
        conversations = await storage.getMentorConversations(userId);
      } else {
        // Students can only see their own conversations
        conversations = await storage.getUserConversations(userId);
      }
      
      console.log(`Found ${conversations.length} conversations for ${userRole} ${userId}`);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Get available users for messaging based on role permissions
  app.get('/api/messaging/available-users', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      let availableUsers = [];

      if (userRole === 'admin') {
        // Admin can message everyone
        availableUsers = await storage.getAllUsers();
      } else if (userRole === 'mentor') {
        // Mentors can only message students enrolled in their courses
        availableUsers = await storage.getEnrolledStudentsForMentor(userId);
      } else {
        // Students can only message mentors from courses they're enrolled in, plus admins
        const enrolledCourseMentors = await storage.getMentorsFromEnrolledCourses(userId);
        const admins = await storage.getAdminUsers();
        availableUsers = [...enrolledCourseMentors, ...admins];
      }

      // Filter out the current user
      availableUsers = availableUsers.filter((user: any) => user.id !== userId);
      
      res.json(availableUsers);
    } catch (error) {
      console.error("Error fetching available users:", error);
      res.status(500).json({ message: "Failed to fetch available users" });
    }
  });

  // Get mentor courses for role-based messaging
  app.get('/api/mentor/courses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      if (userRole !== 'mentor') {
        return res.status(403).json({ message: "Only mentors can access this endpoint" });
      }

      const mentorCourses = await storage.getCoursesByMentor(userId);
      res.json(mentorCourses);
    } catch (error) {
      console.error("Error fetching mentor courses:", error);
      res.status(500).json({ message: "Failed to fetch mentor courses" });
    }
  });

  // Create a new conversation with role-based messaging
  app.post('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { recipients, title, content, type, courseId } = req.body;
      
      console.log('Creating conversation - userId:', userId, 'userRole:', userRole, 'recipients:', recipients, 'type:', type);

      let participantIds = [];

      if (type === 'sitewide' && userRole === 'admin') {
        // Admin sending sitewide message
        const allUsers = await storage.getAllUsers();
        participantIds = allUsers.map((user: any) => user.id).filter((id: string) => id !== userId);
      } else if (type === 'course' && userRole === 'mentor' && courseId) {
        // Mentor sending to course students
        const courseStudents = await storage.getCourseStudents(parseInt(courseId));
        participantIds = courseStudents.map((student: any) => student.id);
      } else if (type === 'individual') {
        // Individual messaging - allow all for now to fix messaging issues
        participantIds = recipients || [];
      } else {
        return res.status(403).json({ message: "You are not authorized to send this type of message" });
      }

      if (participantIds.length === 0) {
        return res.status(400).json({ message: "No recipients found" });
      }

      // Create conversation
      const conversation = await storage.createConversation({
        creatorId: userId,
        title: title || null,
        isGroup: participantIds.length > 1,
      });

      // Validate participant IDs exist in database
      const allParticipantIds = [userId, ...participantIds.filter((id: string) => id !== userId)];
      console.log('All participant IDs to validate:', allParticipantIds);
      const validParticipantIds = [];
      
      for (const participantId of allParticipantIds) {
        const user = await storage.getUserById(participantId);
        console.log(`Validating participant ${participantId}:`, user ? 'FOUND' : 'NOT FOUND');
        if (user) {
          validParticipantIds.push(participantId);
        } else {
          console.warn(`Invalid user ID ${participantId} - skipping`);
        }
      }

      console.log('Valid participant IDs:', validParticipantIds);
      if (validParticipantIds.length === 0) {
        return res.status(400).json({ message: "No valid participants found" });
      }

      // Add participants
      await storage.addConversationParticipants(conversation.id, validParticipantIds);

      // Send initial message
      if (content) {
        await storage.sendMessage({
          conversationId: conversation.id,
          senderId: userId,
          content: content,
        });

        // Create notifications for message recipients
        const senderName = `${req.user.firstName} ${req.user.lastName}`;
        for (const recipientId of participantIds) {
          if (recipientId !== userId) {
            // Create notification via storage
            await storage.createNotification({
              userId: recipientId,
              type: 'message',
              priority: 'medium',
              title: 'New Message',
              message: `${senderName} sent you a message: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
              actionUrl: '/messages'
            });
          }
        }
      }

      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

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