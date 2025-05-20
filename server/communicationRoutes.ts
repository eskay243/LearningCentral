import { Router } from "express";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { storage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { UserRole } from "@shared/schema";
import { hasRole } from "./middleware";

// Create a router specifically for communication features
const router = Router();

// Middleware to ensure a user can access a conversation
const canAccessConversation = async (req: any, res: any, next: any) => {
  const conversationId = parseInt(req.params.conversationId);
  const userId = req.user.claims.sub;
  
  if (isNaN(conversationId)) {
    return res.status(400).json({ message: "Invalid conversation ID" });
  }
  
  try {
    // Get the conversation
    const conversation = await storage.getConversation(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    
    // Check if user is a participant in the conversation
    const participants = await storage.getConversationParticipants(conversationId);
    const isParticipant = participants.some(p => p.userId === userId);
    
    // Allow access if user is a participant or an admin
    if (isParticipant || req.user.claims.role === UserRole.ADMIN) {
      return next();
    }
    
    // Check if it's a course conversation and the user is a mentor for that course
    if (conversation.courseId && req.user.claims.role === UserRole.MENTOR) {
      const mentors = await storage.getMentorsByCourse(conversation.courseId);
      const isMentor = mentors.some(m => m.id === userId);
      
      if (isMentor) {
        return next();
      }
    }
    
    // User is not authorized to access this conversation
    return res.status(403).json({ message: "You don't have access to this conversation" });
  } catch (error) {
    console.error("Error checking conversation access:", error);
    return res.status(500).json({ message: "Failed to verify access" });
  }
};

// Create a new conversation
router.post("/conversations", isAuthenticated, async (req: any, res) => {
  try {
    const { title, type, courseId, participants } = req.body;
    
    // Create the conversation
    const conversation = await storage.createConversation({
      title,
      type,
      courseId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Add creator as a participant and admin
    await storage.addParticipantToConversation({
      conversationId: conversation.id,
      userId: req.user.claims.sub,
      joinedAt: new Date(),
      isAdmin: true
    });
    
    // Add other participants
    if (participants && Array.isArray(participants)) {
      for (const participantId of participants) {
        // Check if user exists
        const user = await storage.getUser(participantId);
        if (user) {
          await storage.addParticipantToConversation({
            conversationId: conversation.id,
            userId: participantId,
            joinedAt: new Date(),
            isAdmin: false
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

// Get user's conversations
router.get("/conversations", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const conversations = await storage.getUserConversations(userId);
    
    // Get participant information for each conversation
    const conversationsWithParticipants = await Promise.all(
      conversations.map(async (conversation) => {
        const participants = await storage.getConversationParticipants(conversation.id);
        const participantUsers = await Promise.all(
          participants.map(async (p) => {
            const user = await storage.getUser(p.userId);
            return {
              ...p,
              user: user ? {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                profileImageUrl: user.profileImageUrl,
                email: user.email
              } : null
            };
          })
        );
        
        return {
          ...conversation,
          participants: participantUsers
        };
      })
    );
    
    res.json(conversationsWithParticipants);
  } catch (error) {
    console.error("Error getting conversations:", error);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
});

// Get a specific conversation
router.get("/conversations/:conversationId", isAuthenticated, canAccessConversation, async (req: any, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    const conversation = await storage.getConversation(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    
    // Get participants
    const participants = await storage.getConversationParticipants(conversationId);
    const participantUsers = await Promise.all(
      participants.map(async (p) => {
        const user = await storage.getUser(p.userId);
        return {
          ...p,
          user: user ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl,
            email: user.email
          } : null
        };
      })
    );
    
    // Get latest messages
    const messages = await storage.getChatMessages(conversationId, { limit: 50 });
    
    res.json({
      ...conversation,
      participants: participantUsers,
      messages
    });
  } catch (error) {
    console.error("Error getting conversation:", error);
    res.status(500).json({ message: "Failed to fetch conversation" });
  }
});

// Add a participant to a conversation
router.post("/conversations/:conversationId/participants", isAuthenticated, canAccessConversation, async (req: any, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    const { userId } = req.body;
    
    // Verify the user exists
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Add the participant
    const participant = await storage.addParticipantToConversation({
      conversationId,
      userId,
      joinedAt: new Date(),
      isAdmin: false
    });
    
    res.status(201).json(participant);
  } catch (error) {
    console.error("Error adding participant:", error);
    res.status(500).json({ message: "Failed to add participant" });
  }
});

// Remove a participant from a conversation
router.delete("/conversations/:conversationId/participants/:userId", isAuthenticated, canAccessConversation, async (req: any, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    const userId = req.params.userId;
    
    // Check if the current user is an admin of the conversation
    const participants = await storage.getConversationParticipants(conversationId);
    const currentUserParticipant = participants.find(p => p.userId === req.user.claims.sub);
    
    // Only conversation admins or global admins can remove participants
    if (!currentUserParticipant?.isAdmin && req.user.claims.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: "Only conversation admins can remove participants" });
    }
    
    await storage.removeParticipantFromConversation(conversationId, userId);
    res.status(204).send();
  } catch (error) {
    console.error("Error removing participant:", error);
    res.status(500).json({ message: "Failed to remove participant" });
  }
});

// Send a message in a conversation
router.post("/conversations/:conversationId/messages", isAuthenticated, canAccessConversation, async (req: any, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    const { content, contentType = "text", attachmentUrl = null, replyToId = null } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: "Message content is required" });
    }
    
    const message = await storage.createChatMessage({
      conversationId,
      senderId: req.user.claims.sub,
      content,
      contentType,
      attachmentUrl,
      sentAt: new Date(),
      isEdited: false,
      replyToId
    });
    
    // Mark as read by sender
    const participants = await storage.getConversationParticipants(conversationId);
    const senderParticipant = participants.find(p => p.userId === req.user.claims.sub);
    
    if (senderParticipant) {
      await storage.updateLastReadMessage(conversationId, req.user.claims.sub, message.id);
    }
    
    // Get sender information to include in response
    const sender = await storage.getUser(req.user.claims.sub);
    
    res.status(201).json({
      ...message,
      sender: sender ? {
        id: sender.id,
        firstName: sender.firstName,
        lastName: sender.lastName,
        profileImageUrl: sender.profileImageUrl
      } : null
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
});

// Get messages in a conversation
router.get("/conversations/:conversationId/messages", isAuthenticated, canAccessConversation, async (req: any, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    const before = req.query.before ? parseInt(req.query.before) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    
    const messages = await storage.getChatMessages(conversationId, { before, limit });
    
    // Get sender information for each message
    const messagesWithSenders = await Promise.all(
      messages.map(async (message) => {
        const sender = await storage.getUser(message.senderId);
        return {
          ...message,
          sender: sender ? {
            id: sender.id,
            firstName: sender.firstName,
            lastName: sender.lastName,
            profileImageUrl: sender.profileImageUrl
          } : null
        };
      })
    );
    
    // Mark conversation as read by this user
    if (messages.length > 0) {
      const latestMessageId = Math.max(...messages.map(m => m.id));
      await storage.updateLastReadMessage(conversationId, req.user.claims.sub, latestMessageId);
    }
    
    res.json(messagesWithSenders);
  } catch (error) {
    console.error("Error getting messages:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

// Edit a message
router.put("/messages/:messageId", isAuthenticated, async (req: any, res) => {
  try {
    const messageId = parseInt(req.params.messageId);
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: "Message content is required" });
    }
    
    // Get the message to check permissions
    const message = await storage.getChatMessage(messageId);
    
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    
    // Only the sender or admins can edit messages
    if (message.senderId !== req.user.claims.sub && req.user.claims.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: "You don't have permission to edit this message" });
    }
    
    const updatedMessage = await storage.updateChatMessage(messageId, content);
    
    // Get sender information
    const sender = await storage.getUser(updatedMessage.senderId);
    
    res.json({
      ...updatedMessage,
      sender: sender ? {
        id: sender.id,
        firstName: sender.firstName,
        lastName: sender.lastName,
        profileImageUrl: sender.profileImageUrl
      } : null
    });
  } catch (error) {
    console.error("Error editing message:", error);
    res.status(500).json({ message: "Failed to edit message" });
  }
});

// Delete a message
router.delete("/messages/:messageId", isAuthenticated, async (req: any, res) => {
  try {
    const messageId = parseInt(req.params.messageId);
    
    // Get the message to check permissions
    const message = await storage.getChatMessage(messageId);
    
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    
    // Only the sender or admins can delete messages
    if (message.senderId !== req.user.claims.sub && req.user.claims.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: "You don't have permission to delete this message" });
    }
    
    await storage.deleteChatMessage(messageId);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ message: "Failed to delete message" });
  }
});

// Add a reaction to a message
router.post("/messages/:messageId/reactions", isAuthenticated, async (req: any, res) => {
  try {
    const messageId = parseInt(req.params.messageId);
    const { reaction } = req.body;
    
    if (!reaction) {
      return res.status(400).json({ message: "Reaction type is required" });
    }
    
    // Get the message to ensure it exists
    const message = await storage.getChatMessage(messageId);
    
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    
    // Check if user can access the conversation
    const participants = await storage.getConversationParticipants(message.conversationId);
    const isParticipant = participants.some(p => p.userId === req.user.claims.sub);
    
    if (!isParticipant && req.user.claims.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: "You don't have permission to react to this message" });
    }
    
    const messageReaction = await storage.addMessageReaction({
      messageId,
      userId: req.user.claims.sub,
      reaction,
      createdAt: new Date()
    });
    
    res.status(201).json(messageReaction);
  } catch (error) {
    console.error("Error adding reaction:", error);
    res.status(500).json({ message: "Failed to add reaction" });
  }
});

// Remove a reaction from a message
router.delete("/messages/:messageId/reactions/:reaction", isAuthenticated, async (req: any, res) => {
  try {
    const messageId = parseInt(req.params.messageId);
    const { reaction } = req.params;
    
    await storage.removeMessageReaction(messageId, req.user.claims.sub, reaction);
    res.status(204).send();
  } catch (error) {
    console.error("Error removing reaction:", error);
    res.status(500).json({ message: "Failed to remove reaction" });
  }
});

// Course Announcements

// Create a course announcement
router.post("/courses/:courseId/announcements", isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req: any, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const { title, content, isPinned = false, attachmentUrl = null } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }
    
    // Verify the course exists
    const course = await storage.getCourse(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    // If user is a mentor, verify they are assigned to this course
    if (req.user.claims.role === UserRole.MENTOR) {
      const mentors = await storage.getMentorsByCourse(courseId);
      const isMentor = mentors.some(m => m.id === req.user.claims.sub);
      
      if (!isMentor) {
        return res.status(403).json({ message: "You are not a mentor for this course" });
      }
    }
    
    const announcement = await storage.createCourseAnnouncement({
      title,
      content,
      courseId,
      authorId: req.user.claims.sub,
      publishedAt: new Date(),
      updatedAt: new Date(),
      isPinned,
      attachmentUrl
    });
    
    // Get author information
    const author = await storage.getUser(req.user.claims.sub);
    
    res.status(201).json({
      ...announcement,
      author: author ? {
        id: author.id,
        firstName: author.firstName,
        lastName: author.lastName,
        profileImageUrl: author.profileImageUrl
      } : null
    });
  } catch (error) {
    console.error("Error creating announcement:", error);
    res.status(500).json({ message: "Failed to create announcement" });
  }
});

// Get announcements for a course
router.get("/courses/:courseId/announcements", isAuthenticated, async (req: any, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    
    // Verify the user has access to this course
    const enrollment = await storage.getCourseEnrollment(courseId, req.user.claims.sub);
    const isMentor = req.user.claims.role === UserRole.MENTOR && (await storage.getMentorsByCourse(courseId)).some(m => m.id === req.user.claims.sub);
    const isAdmin = req.user.claims.role === UserRole.ADMIN;
    
    if (!enrollment && !isMentor && !isAdmin) {
      return res.status(403).json({ message: "You don't have access to this course" });
    }
    
    const announcements = await storage.getCourseAnnouncementsByCourse(courseId);
    
    // Get author information for each announcement
    const announcementsWithAuthors = await Promise.all(
      announcements.map(async (announcement) => {
        const author = await storage.getUser(announcement.authorId);
        return {
          ...announcement,
          author: author ? {
            id: author.id,
            firstName: author.firstName,
            lastName: author.lastName,
            profileImageUrl: author.profileImageUrl
          } : null
        };
      })
    );
    
    res.json(announcementsWithAuthors);
  } catch (error) {
    console.error("Error getting announcements:", error);
    res.status(500).json({ message: "Failed to fetch announcements" });
  }
});

// Get a specific announcement
router.get("/announcements/:announcementId", isAuthenticated, async (req: any, res) => {
  try {
    const announcementId = parseInt(req.params.announcementId);
    
    const announcement = await storage.getCourseAnnouncement(announcementId);
    
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }
    
    // Verify the user has access to the course this announcement belongs to
    if (announcement.courseId) {
      const enrollment = await storage.getCourseEnrollment(announcement.courseId, req.user.claims.sub);
      const isMentor = req.user.claims.role === UserRole.MENTOR && (await storage.getMentorsByCourse(announcement.courseId)).some(m => m.id === req.user.claims.sub);
      const isAdmin = req.user.claims.role === UserRole.ADMIN;
      
      if (!enrollment && !isMentor && !isAdmin) {
        return res.status(403).json({ message: "You don't have access to this announcement" });
      }
    }
    
    // Get author information
    const author = await storage.getUser(announcement.authorId);
    
    res.json({
      ...announcement,
      author: author ? {
        id: author.id,
        firstName: author.firstName,
        lastName: author.lastName,
        profileImageUrl: author.profileImageUrl
      } : null
    });
  } catch (error) {
    console.error("Error getting announcement:", error);
    res.status(500).json({ message: "Failed to fetch announcement" });
  }
});

// Update an announcement
router.put("/announcements/:announcementId", isAuthenticated, async (req: any, res) => {
  try {
    const announcementId = parseInt(req.params.announcementId);
    const { title, content, isPinned, attachmentUrl } = req.body;
    
    // Get the announcement
    const announcement = await storage.getCourseAnnouncement(announcementId);
    
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }
    
    // Check if user has permission to edit
    if (announcement.authorId !== req.user.claims.sub && req.user.claims.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: "You don't have permission to update this announcement" });
    }
    
    // Update the announcement
    const updateData: any = { updatedAt: new Date() };
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (isPinned !== undefined) updateData.isPinned = isPinned;
    if (attachmentUrl !== undefined) updateData.attachmentUrl = attachmentUrl;
    
    const updatedAnnouncement = await storage.updateCourseAnnouncement(announcementId, updateData);
    
    // Get author information
    const author = await storage.getUser(updatedAnnouncement.authorId);
    
    res.json({
      ...updatedAnnouncement,
      author: author ? {
        id: author.id,
        firstName: author.firstName,
        lastName: author.lastName,
        profileImageUrl: author.profileImageUrl
      } : null
    });
  } catch (error) {
    console.error("Error updating announcement:", error);
    res.status(500).json({ message: "Failed to update announcement" });
  }
});

// Delete an announcement
router.delete("/announcements/:announcementId", isAuthenticated, async (req: any, res) => {
  try {
    const announcementId = parseInt(req.params.announcementId);
    
    // Get the announcement
    const announcement = await storage.getCourseAnnouncement(announcementId);
    
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }
    
    // Check if user has permission to delete
    if (announcement.authorId !== req.user.claims.sub && req.user.claims.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: "You don't have permission to delete this announcement" });
    }
    
    await storage.deleteCourseAnnouncement(announcementId);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting announcement:", error);
    res.status(500).json({ message: "Failed to delete announcement" });
  }
});

export default router;