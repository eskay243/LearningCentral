import type { Express } from "express";
import { storage } from "./storage";
import { isAuthenticated, requireRole } from "./auth";
import { videoConferencingService } from "./videoConferencing";
import { WebSocket } from 'ws';

export function registerEnhancedLiveSessionRoutes(app: Express) {
  // Create Live Session with Video Conferencing
  app.post("/api/live-sessions", isAuthenticated, requireRole(['mentor', 'admin']), async (req, res) => {
    try {
      const sessionData = {
        ...req.body,
        createdBy: (req.user as any).id,
        hostName: `${(req.user as any).firstName} ${(req.user as any).lastName}`,
        hostEmail: (req.user as any).email
      };

      // Create meeting with video provider
      const meetingInfo = await videoConferencingService.createMeeting(
        sessionData.provider || 'google_meet',
        sessionData
      );

      // Create session in database
      const session = await storage.createLiveSession({
        ...sessionData,
        meetingUrl: meetingInfo.meetingUrl,
        providerMeetingId: meetingInfo.meetingId,
        hostKey: meetingInfo.hostUrl,
        passcode: meetingInfo.passcode
      });

      res.status(201).json({
        ...session,
        meetingInfo
      });
    } catch (error) {
      console.error("Error creating live session:", error);
      res.status(500).json({ message: "Failed to create live session" });
    }
  });

  // Get Live Sessions
  app.get("/api/live-sessions", isAuthenticated, async (req, res) => {
    try {
      const { courseId, status, upcoming } = req.query;
      const options: any = {};
      
      if (courseId) options.courseId = parseInt(courseId as string);
      if (status) options.status = status as string;
      if (upcoming === 'true') options.upcoming = true;

      const sessions = await storage.getLiveSessions(options);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching live sessions:", error);
      res.status(500).json({ message: "Failed to fetch live sessions" });
    }
  });

  // Get Single Live Session
  app.get("/api/live-sessions/:id", isAuthenticated, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const session = await storage.getLiveSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Live session not found" });
      }

      // Get real-time attendance count
      const attendance = await storage.getSessionAttendance(sessionId);
      
      res.json({
        ...session,
        currentAttendance: attendance.length,
        attendees: attendance
      });
    } catch (error) {
      console.error("Error fetching live session:", error);
      res.status(500).json({ message: "Failed to fetch live session" });
    }
  });

  // Update Live Session
  app.put("/api/live-sessions/:id", isAuthenticated, requireRole(['mentor', 'admin']), async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const updateData = req.body;

      // Update meeting with provider if necessary
      const session = await storage.getLiveSession(sessionId);
      if (session && session.providerMeetingId && updateData.provider) {
        await videoConferencingService.updateMeeting(
          session.provider,
          session.providerMeetingId,
          updateData
        );
      }

      const updatedSession = await storage.updateLiveSession(sessionId, updateData);
      res.json(updatedSession);
    } catch (error) {
      console.error("Error updating live session:", error);
      res.status(500).json({ message: "Failed to update live session" });
    }
  });

  // Start Live Session
  app.post("/api/live-sessions/:id/start", isAuthenticated, requireRole(['mentor', 'admin']), async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      
      const updatedSession = await storage.updateLiveSession(sessionId, {
        status: 'live',
        actualStartTime: new Date()
      });

      // Notify all connected clients
      wss.clients.forEach((client: WebSocket) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'SESSION_STARTED',
            sessionId,
            session: updatedSession
          }));
        }
      });

      res.json(updatedSession);
    } catch (error) {
      console.error("Error starting live session:", error);
      res.status(500).json({ message: "Failed to start live session" });
    }
  });

  // End Live Session
  app.post("/api/live-sessions/:id/end", isAuthenticated, requireRole(['mentor', 'admin']), async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      
      const updatedSession = await storage.updateLiveSession(sessionId, {
        status: 'completed',
        actualEndTime: new Date()
      });

      // Get recordings if available
      const session = await storage.getLiveSession(sessionId);
      if (session && session.providerMeetingId) {
        try {
          const recordings = await videoConferencingService.getRecordings(
            session.provider,
            session.providerMeetingId
          );
          
          if (recordings.length > 0) {
            await storage.updateLiveSession(sessionId, {
              recordingUrl: recordings[0].download_url || recordings[0].play_url
            });
          }
        } catch (recordingError) {
          console.warn("Could not fetch recordings:", recordingError);
        }
      }

      // Notify all connected clients
      wss.clients.forEach((client: WebSocket) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'SESSION_ENDED',
            sessionId,
            session: updatedSession
          }));
        }
      });

      res.json(updatedSession);
    } catch (error) {
      console.error("Error ending live session:", error);
      res.status(500).json({ message: "Failed to end live session" });
    }
  });

  // Join Live Session (Record Attendance)
  app.post("/api/live-sessions/:id/join", isAuthenticated, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const userId = (req.user as any).id;

      // Record attendance
      await storage.recordSessionAttendance({
        sessionId,
        userId,
        joinTime: new Date(),
        status: 'joined'
      });

      // Update session attendee count
      const attendance = await storage.getSessionAttendance(sessionId);
      await storage.updateLiveSession(sessionId, {
        attendeeCount: attendance.length
      });

      // Notify other participants
      wss.clients.forEach((client: WebSocket) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'USER_JOINED',
            sessionId,
            userId,
            userName: `${(req.user as any).firstName} ${(req.user as any).lastName}`,
            attendeeCount: attendance.length
          }));
        }
      });

      res.json({ message: "Successfully joined session", attendeeCount: attendance.length });
    } catch (error) {
      console.error("Error joining live session:", error);
      res.status(500).json({ message: "Failed to join live session" });
    }
  });

  // Leave Live Session
  app.post("/api/live-sessions/:id/leave", isAuthenticated, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const userId = (req.user as any).id;

      // Update attendance record
      await storage.updateSessionAttendance(sessionId, userId, {
        leaveTime: new Date(),
        status: 'left',
        lastActivity: new Date()
      });

      // Update session attendee count
      const attendance = await storage.getActiveSessionAttendance(sessionId);
      await storage.updateLiveSession(sessionId, {
        attendeeCount: attendance.length
      });

      // Notify other participants
      wss.clients.forEach((client: WebSocket) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'USER_LEFT',
            sessionId,
            userId,
            attendeeCount: attendance.length
          }));
        }
      });

      res.json({ message: "Successfully left session" });
    } catch (error) {
      console.error("Error leaving live session:", error);
      res.status(500).json({ message: "Failed to leave live session" });
    }
  });

  // Get Session Attendance
  app.get("/api/live-sessions/:id/attendance", isAuthenticated, requireRole(['mentor', 'admin']), async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const attendance = await storage.getSessionAttendance(sessionId);
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching session attendance:", error);
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  // Interactive Features - Create Poll
  app.post("/api/live-sessions/:id/polls", isAuthenticated, requireRole(['mentor', 'admin']), async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const pollData = {
        ...req.body,
        sessionId,
        createdBy: (req.user as any).id
      };

      const poll = await storage.createSessionPoll(pollData);

      // Notify all session participants
      wss.clients.forEach((client: WebSocket) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'NEW_POLL',
            sessionId,
            poll
          }));
        }
      });

      res.status(201).json(poll);
    } catch (error) {
      console.error("Error creating poll:", error);
      res.status(500).json({ message: "Failed to create poll" });
    }
  });

  // Submit Poll Response
  app.post("/api/live-sessions/:sessionId/polls/:pollId/respond", isAuthenticated, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const pollId = parseInt(req.params.pollId);
      const userId = (req.user as any).id;
      const { answer } = req.body;

      const response = await storage.submitPollResponse({
        pollId,
        userId,
        answer,
        submittedAt: new Date()
      });

      // Get updated poll results
      const pollResults = await storage.getPollResults(pollId);

      // Notify session participants of updated results
      wss.clients.forEach((client: WebSocket) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'POLL_RESULTS_UPDATED',
            sessionId,
            pollId,
            results: pollResults
          }));
        }
      });

      res.json(response);
    } catch (error) {
      console.error("Error submitting poll response:", error);
      res.status(500).json({ message: "Failed to submit poll response" });
    }
  });

  // Get Poll Results
  app.get("/api/live-sessions/:sessionId/polls/:pollId/results", isAuthenticated, async (req, res) => {
    try {
      const pollId = parseInt(req.params.pollId);
      const results = await storage.getPollResults(pollId);
      res.json(results);
    } catch (error) {
      console.error("Error fetching poll results:", error);
      res.status(500).json({ message: "Failed to fetch poll results" });
    }
  });

  // Q&A Features - Ask Question
  app.post("/api/live-sessions/:id/questions", isAuthenticated, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const questionData = {
        ...req.body,
        sessionId,
        askedBy: (req.user as any).id,
        askedAt: new Date()
      };

      const question = await storage.createSessionQuestion(questionData);

      // Notify session host/mentors
      wss.clients.forEach((client: WebSocket) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'NEW_QUESTION',
            sessionId,
            question: {
              ...question,
              askedByName: `${(req.user as any).firstName} ${(req.user as any).lastName}`
            }
          }));
        }
      });

      res.status(201).json(question);
    } catch (error) {
      console.error("Error creating question:", error);
      res.status(500).json({ message: "Failed to create question" });
    }
  });

  // Answer Question
  app.post("/api/live-sessions/:sessionId/questions/:questionId/answer", isAuthenticated, requireRole(['mentor', 'admin']), async (req, res) => {
    try {
      const questionId = parseInt(req.params.questionId);
      const sessionId = parseInt(req.params.sessionId);
      const { answer } = req.body;

      const updatedQuestion = await storage.answerSessionQuestion(questionId, {
        answer,
        answeredBy: (req.user as any).id,
        answeredAt: new Date()
      });

      // Notify all session participants
      wss.clients.forEach((client: WebSocket) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'QUESTION_ANSWERED',
            sessionId,
            question: updatedQuestion
          }));
        }
      });

      res.json(updatedQuestion);
    } catch (error) {
      console.error("Error answering question:", error);
      res.status(500).json({ message: "Failed to answer question" });
    }
  });

  // Get Session Questions
  app.get("/api/live-sessions/:id/questions", isAuthenticated, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const questions = await storage.getSessionQuestions(sessionId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching session questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  // Chat Features - Send Message
  app.post("/api/live-sessions/:id/chat", isAuthenticated, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const messageData = {
        ...req.body,
        sessionId,
        senderId: (req.user as any).id,
        sentAt: new Date()
      };

      const message = await storage.createSessionMessage(messageData);

      // Broadcast message to all session participants
      wss.clients.forEach((client: WebSocket) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'NEW_CHAT_MESSAGE',
            sessionId,
            message: {
              ...message,
              senderName: `${(req.user as any).firstName} ${(req.user as any).lastName}`,
              senderRole: (req.user as any).role
            }
          }));
        }
      });

      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending chat message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Get Chat Messages
  app.get("/api/live-sessions/:id/chat", isAuthenticated, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const { limit = 50, before } = req.query;
      
      const messages = await storage.getSessionMessages(sessionId, {
        limit: parseInt(limit as string),
        before: before ? parseInt(before as string) : undefined
      });
      
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Recording Features - Get Recordings
  app.get("/api/live-sessions/:id/recordings", isAuthenticated, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const session = await storage.getLiveSession(sessionId);
      
      if (!session || !session.providerMeetingId) {
        return res.json([]);
      }

      const recordings = await videoConferencingService.getRecordings(
        session.provider,
        session.providerMeetingId
      );

      res.json(recordings);
    } catch (error) {
      console.error("Error fetching recordings:", error);
      res.status(500).json({ message: "Failed to fetch recordings" });
    }
  });

  // Analytics - Session Analytics
  app.get("/api/live-sessions/:id/analytics", isAuthenticated, requireRole(['mentor', 'admin']), async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      
      const analytics = await storage.getSessionAnalytics(sessionId);
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching session analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Delete Live Session
  app.delete("/api/live-sessions/:id", isAuthenticated, requireRole(['mentor', 'admin']), async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const session = await storage.getLiveSession(sessionId);
      
      // Delete meeting from provider
      if (session && session.providerMeetingId) {
        try {
          await videoConferencingService.deleteMeeting(
            session.provider,
            session.providerMeetingId
          );
        } catch (providerError) {
          console.warn("Could not delete meeting from provider:", providerError);
        }
      }

      await storage.deleteLiveSession(sessionId);
      res.json({ message: "Live session deleted successfully" });
    } catch (error) {
      console.error("Error deleting live session:", error);
      res.status(500).json({ message: "Failed to delete live session" });
    }
  });
}