import { Request, Response, Express } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { videoConferencingService } from "./videoConferencingService";
import { isAuthenticated, hasRole } from "./auth";
import { 
  insertLiveSessionSchema,
  insertLiveSessionAttendanceSchema,
  insertLiveSessionMessageSchema,
  insertLiveSessionQASchema,
  insertLiveSessionPollSchema,
  insertLiveSessionPollResponseSchema,
  insertCalendarEventSchema
} from "@shared/schema";

export function registerLiveSessionRoutes(app: Express) {
  
  // Get live sessions for a course
  app.get('/api/courses/:courseId/live-sessions', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const sessions = await storage.getLiveSessionsByCourse(courseId);
      res.json(sessions);
    } catch (error: any) {
      console.error('Error fetching live sessions:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get upcoming live sessions for student
  app.get('/api/student/upcoming-sessions', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const sessions = await storage.getUpcomingSessionsForStudent(userId);
      res.json(sessions);
    } catch (error: any) {
      console.error('Error fetching upcoming sessions:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get student schedule - all live classes automatically updated
  app.get('/api/student/schedule', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { startDate, endDate, status } = req.query;
      
      // Get all sessions for courses the student is enrolled in
      const enrolledCourses = await storage.getStudentEnrollments(userId);
      const courseIds = enrolledCourses.map(enrollment => enrollment.courseId);
      
      let allSessions: any[] = [];
      
      // Fetch sessions for each enrolled course
      for (const courseId of courseIds) {
        const courseSessions = await storage.getLiveSessionsByCourse(courseId);
        allSessions = [...allSessions, ...courseSessions];
      }
      
      // Filter by date range if provided
      if (startDate || endDate) {
        allSessions = allSessions.filter(session => {
          const sessionDate = new Date(session.startTime);
          if (startDate && sessionDate < new Date(startDate)) return false;
          if (endDate && sessionDate > new Date(endDate)) return false;
          return true;
        });
      }
      
      // Filter by status if provided (upcoming, past, live)
      if (status) {
        const now = new Date();
        allSessions = allSessions.filter(session => {
          const start = new Date(session.startTime);
          const end = new Date(session.endTime);
          
          switch (status) {
            case 'upcoming':
              return start > now;
            case 'live':
              return start <= now && end >= now;
            case 'past':
              return end < now;
            default:
              return true;
          }
        });
      }
      
      // Sort by start time
      allSessions.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      
      res.json(allSessions);
    } catch (error: any) {
      console.error('Error fetching student schedule:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get live sessions for mentor
  app.get('/api/mentor/live-sessions', isAuthenticated, hasRole(['mentor', 'admin']), async (req: any, res: Response) => {
    try {
      const mentorId = req.user.id;
      const sessions = await storage.getLiveSessionsByMentor(mentorId);
      res.json(sessions);
    } catch (error: any) {
      console.error('Error fetching mentor sessions:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Create new live session
  app.post('/api/live-sessions', isAuthenticated, hasRole(['mentor', 'admin']), async (req: any, res: Response) => {
    try {
      console.log('Raw request body:', JSON.stringify(req.body, null, 2));
      
      // Parse the raw request body first
      const rawData = { ...req.body };
      
      console.log('Before date conversion:', {
        startTime: rawData.startTime,
        startTimeType: typeof rawData.startTime,
        endTime: rawData.endTime,
        endTimeType: typeof rawData.endTime
      });
      
      // Ensure proper date conversion for datetime-local inputs
      if (rawData.startTime) {
        if (typeof rawData.startTime === 'string') {
          // Handle datetime-local format (YYYY-MM-DDTHH:MM)
          const startDate = new Date(rawData.startTime);
          if (isNaN(startDate.getTime())) {
            return res.status(400).json({ message: 'Invalid start time format' });
          }
          rawData.startTime = startDate;
          console.log('Converted startTime to Date object:', rawData.startTime);
        }
      }
      if (rawData.endTime) {
        if (typeof rawData.endTime === 'string') {
          // Handle datetime-local format (YYYY-MM-DDTHH:MM)
          const endDate = new Date(rawData.endTime);
          if (isNaN(endDate.getTime())) {
            return res.status(400).json({ message: 'Invalid end time format' });
          }
          rawData.endTime = endDate;
          console.log('Converted endTime to Date object:', rawData.endTime);
        }
      }
      
      console.log('After date conversion:', {
        startTime: rawData.startTime,
        startTimeType: typeof rawData.startTime,
        endTime: rawData.endTime,
        endTimeType: typeof rawData.endTime
      });
      
      // Skip schema validation for now and create the session data manually
      console.log('Creating session data manually...');
      const sessionData: any = {
        title: rawData.title,
        description: rawData.description,
        courseId: parseInt(rawData.courseId),
        lessonId: rawData.lessonId || null, // Allow null for course-level sessions
        startTime: rawData.startTime, // Already converted to Date object
        endTime: rawData.endTime, // Already converted to Date object
        duration: rawData.duration || 60,
        provider: rawData.provider || 'google_meet',
        timezone: rawData.timezone || 'UTC',
        mentorId: req.user.id
      };
      
      console.log('Final sessionData before storage:', {
        ...sessionData,
        startTime: sessionData.startTime?.constructor?.name,
        endTime: sessionData.endTime?.constructor?.name
      });

      // Generate meeting credentials automatically
      try {
        const meetingCredentials = videoConferencingService.generateMeetingCredentials(sessionData);
        sessionData.meetingUrl = meetingCredentials.meetingUrl;
        sessionData.meetingId = meetingCredentials.meetingId;
        sessionData.meetingPassword = meetingCredentials.meetingPassword;
        sessionData.hostKey = meetingCredentials.hostUrl;
      } catch (error) {
        console.error('Failed to generate meeting credentials:', error);
        // Still create session without meeting details
      }

      const session = await storage.createLiveSession(sessionData);
      
      // Auto-enroll course students
      await storage.enrollStudentsInSession(session.id, session.courseId);

      res.status(201).json(session);
    } catch (error: any) {
      console.error('Error creating live session:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        res.status(500).json({ message: error.message });
      }
    }
  });

  // Update live session
  app.put('/api/live-sessions/:sessionId', isAuthenticated, hasRole(['mentor', 'admin']), async (req: any, res: Response) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const updateData = insertLiveSessionSchema.partial().parse(req.body);
      
      // Convert string dates to Date objects
      if (updateData.startTime && typeof updateData.startTime === 'string') {
        updateData.startTime = new Date(updateData.startTime);
      }
      if (updateData.endTime && typeof updateData.endTime === 'string') {
        updateData.endTime = new Date(updateData.endTime);
      }
      
      const existingSession = await storage.getLiveSession(sessionId);
      if (!existingSession) {
        return res.status(404).json({ message: 'Session not found' });
      }

      // Check if user is the mentor or admin
      if (existingSession.mentorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to update this session' });
      }

      // Update meeting if meeting details changed
      if (updateData.title || updateData.startTime || updateData.endTime || updateData.description) {
        const providerSettings = await storage.getVideoProviderSettings(req.user.id, existingSession.provider);
        if (providerSettings && existingSession.meetingId) {
          try {
            await videoConferencingService.updateMeeting(existingSession, providerSettings, updateData);
          } catch (error) {
            console.error('Failed to update video meeting:', error);
          }
        }
      }

      const updatedSession = await storage.updateLiveSession(sessionId, updateData);
      res.json(updatedSession);
    } catch (error: any) {
      console.error('Error updating live session:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        res.status(500).json({ message: error.message });
      }
    }
  });

  // Delete live session
  app.delete('/api/live-sessions/:sessionId', isAuthenticated, hasRole(['mentor', 'admin']), async (req: any, res: Response) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      
      const session = await storage.getLiveSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      // Check if user is the mentor or admin
      if (session.mentorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to delete this session' });
      }

      // Delete meeting from video conferencing provider
      const providerSettings = await storage.getVideoProviderSettings(req.user.id, session.provider);
      if (providerSettings && session.meetingId) {
        try {
          await videoConferencingService.deleteMeeting(session, providerSettings);
        } catch (error) {
          console.error('Failed to delete video meeting:', error);
        }
      }

      await storage.deleteLiveSession(sessionId);
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting live session:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Join live session
  app.post('/api/live-sessions/:sessionId/join', isAuthenticated, async (req: any, res: Response) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const userId = req.user.id;

      const session = await storage.getLiveSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      // Check if user is enrolled in the course
      const isEnrolled = await storage.isUserEnrolledInCourse(userId, session.courseId);
      if (!isEnrolled && req.user.role !== 'admin' && session.mentorId !== userId) {
        return res.status(403).json({ message: 'Not enrolled in this course' });
      }

      // Record attendance
      const attendanceData = {
        sessionId,
        userId,
        joinedAt: new Date(),
        status: 'present' as const,
      };

      await storage.recordSessionAttendance(attendanceData);

      // Return session details with meeting URL
      res.json({
        session,
        meetingUrl: session.meetingUrl,
        calendarUrls: videoConferencingService.generateCalendarUrls(session),
      });
    } catch (error: any) {
      console.error('Error joining live session:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Leave live session
  app.post('/api/live-sessions/:sessionId/leave', isAuthenticated, async (req: any, res: Response) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const userId = req.user.id;

      await storage.updateSessionAttendance(sessionId, userId, {
        leftTime: new Date(),
        status: 'present',
      });

      res.status(204).send();
    } catch (error: any) {
      console.error('Error leaving live session:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get session attendance
  app.get('/api/live-sessions/:sessionId/attendance', isAuthenticated, hasRole(['mentor', 'admin']), async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const attendance = await storage.getSessionAttendance(sessionId);
      res.json(attendance);
    } catch (error: any) {
      console.error('Error fetching session attendance:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Start roll call
  app.post('/api/live-sessions/:sessionId/roll-call', isAuthenticated, hasRole(['mentor', 'admin']), async (req: any, res: Response) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const initiatedBy = req.user.id;
      const { duration = 60 } = req.body; // Default 60 seconds

      const expiresAt = new Date(Date.now() + duration * 1000);
      
      const rollCall = await storage.createRollCall(sessionId, initiatedBy, expiresAt);
      res.status(201).json(rollCall);
    } catch (error: any) {
      console.error('Error starting roll call:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Respond to roll call
  app.post('/api/live-sessions/:sessionId/roll-call/:rollCallId/respond', isAuthenticated, async (req: any, res: Response) => {
    try {
      const rollCallId = parseInt(req.params.rollCallId);
      const userId = req.user.id;
      const { responseMethod = 'app' } = req.body;

      const response = await storage.respondToRollCall(rollCallId, userId, responseMethod);
      res.status(201).json(response);
    } catch (error: any) {
      console.error('Error responding to roll call:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Send message in live session
  app.post('/api/live-sessions/:sessionId/messages', isAuthenticated, async (req: any, res: Response) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const messageData = insertLiveSessionMessageSchema.parse(req.body);
      messageData.sessionId = sessionId;
      messageData.userId = req.user.id;

      const message = await storage.createSessionMessage(messageData);
      res.status(201).json(message);
    } catch (error: any) {
      console.error('Error sending session message:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        res.status(500).json({ message: error.message });
      }
    }
  });

  // Get session messages
  app.get('/api/live-sessions/:sessionId/messages', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const { page = 1, limit = 50 } = req.query;
      
      const messages = await storage.getSessionMessages(
        sessionId, 
        parseInt(page as string), 
        parseInt(limit as string)
      );
      res.json(messages);
    } catch (error: any) {
      console.error('Error fetching session messages:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Ask question in Q&A
  app.post('/api/live-sessions/:sessionId/qa', isAuthenticated, async (req: any, res: Response) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const qaData = insertLiveSessionQASchema.parse(req.body);
      qaData.sessionId = sessionId;
      qaData.studentId = req.user.id;

      const question = await storage.createSessionQuestion(qaData);
      res.status(201).json(question);
    } catch (error: any) {
      console.error('Error creating Q&A question:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        res.status(500).json({ message: error.message });
      }
    }
  });

  // Answer question in Q&A
  app.put('/api/live-sessions/:sessionId/qa/:questionId/answer', isAuthenticated, hasRole(['mentor', 'admin']), async (req: any, res: Response) => {
    try {
      const questionId = parseInt(req.params.questionId);
      const { answer } = req.body;
      const mentorId = req.user.id;

      const updatedQuestion = await storage.answerSessionQuestion(questionId, answer, mentorId);
      res.json(updatedQuestion);
    } catch (error: any) {
      console.error('Error answering Q&A question:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get Q&A for session
  app.get('/api/live-sessions/:sessionId/qa', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const { status } = req.query;
      
      const questions = await storage.getSessionQuestions(sessionId, status as string);
      res.json(questions);
    } catch (error: any) {
      console.error('Error fetching Q&A questions:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Create poll
  app.post('/api/live-sessions/:sessionId/polls', isAuthenticated, hasRole(['mentor', 'admin']), async (req: any, res: Response) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const pollData = insertLiveSessionPollSchema.parse(req.body);
      pollData.sessionId = sessionId;
      pollData.createdBy = req.user.id;

      const poll = await storage.createSessionPoll(pollData);
      res.status(201).json(poll);
    } catch (error: any) {
      console.error('Error creating session poll:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        res.status(500).json({ message: error.message });
      }
    }
  });

  // Respond to poll
  app.post('/api/live-sessions/:sessionId/polls/:pollId/respond', isAuthenticated, async (req: any, res: Response) => {
    try {
      const pollId = parseInt(req.params.pollId);
      const responseData = insertLiveSessionPollResponseSchema.parse(req.body);
      responseData.pollId = pollId;
      responseData.userId = req.user.id;

      const response = await storage.respondToPoll(responseData);
      res.status(201).json(response);
    } catch (error: any) {
      console.error('Error responding to poll:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        res.status(500).json({ message: error.message });
      }
    }
  });

  // Get poll results
  app.get('/api/live-sessions/:sessionId/polls/:pollId/results', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const pollId = parseInt(req.params.pollId);
      const results = await storage.getPollResults(pollId);
      res.json(results);
    } catch (error: any) {
      console.error('Error fetching poll results:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get session recording
  app.get('/api/live-sessions/:sessionId/recording', isAuthenticated, async (req: any, res: Response) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      
      const session = await storage.getLiveSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      // Check if user has access to recording
      const isEnrolled = await storage.isUserEnrolledInCourse(req.user.id, session.courseId);
      if (!isEnrolled && req.user.role !== 'admin' && session.mentorId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to access recording' });
      }

      if (!session.recordingUrl) {
        // Try to fetch recording from provider
        const providerSettings = await storage.getVideoProviderSettings(session.mentorId!, session.provider);
        if (providerSettings && session.meetingId) {
          try {
            const recordingInfo = await videoConferencingService.getMeetingRecording(
              session.meetingId,
              session.provider,
              providerSettings
            );
            
            if (recordingInfo) {
              // Update session with recording info
              await storage.updateLiveSession(sessionId, {
                recordingUrl: recordingInfo.recordingUrl,
                recordingId: recordingInfo.recordingId,
                recordingPassword: recordingInfo.recordingPassword,
                recordingSize: recordingInfo.recordingSize,
                recordingDuration: recordingInfo.recordingDuration,
              });
              
              return res.json(recordingInfo);
            }
          } catch (error) {
            console.error('Failed to fetch recording:', error);
          }
        }
        
        return res.status(404).json({ message: 'Recording not available' });
      }

      res.json({
        recordingUrl: session.recordingUrl,
        recordingId: session.recordingId,
        recordingPassword: session.recordingPassword,
        recordingSize: session.recordingSize,
        recordingDuration: session.recordingDuration,
      });
    } catch (error: any) {
      console.error('Error fetching session recording:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Generate calendar event
  app.get('/api/live-sessions/:sessionId/calendar', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const { provider = 'google' } = req.query;
      
      const session = await storage.getLiveSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      const calendarEvent = await videoConferencingService.createCalendarEvent(
        session,
        provider as 'google' | 'outlook' | 'apple'
      );
      
      res.json(calendarEvent);
    } catch (error: any) {
      console.error('Error generating calendar event:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get calendar URLs
  app.get('/api/live-sessions/:sessionId/calendar-urls', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      
      const session = await storage.getLiveSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      const calendarUrls = videoConferencingService.generateCalendarUrls(session);
      res.json(calendarUrls);
    } catch (error: any) {
      console.error('Error generating calendar URLs:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get session analytics
  app.get('/api/live-sessions/:sessionId/analytics', isAuthenticated, hasRole(['mentor', 'admin']), async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const analytics = await storage.getSessionAnalytics(sessionId);
      res.json(analytics);
    } catch (error: any) {
      console.error('Error fetching session analytics:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Video provider settings routes
  app.get('/api/video-providers/settings', isAuthenticated, hasRole(['mentor', 'admin']), async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const settings = await storage.getAllVideoProviderSettings(userId);
      res.json(settings);
    } catch (error: any) {
      console.error('Error fetching video provider settings:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/video-providers/settings', isAuthenticated, hasRole(['mentor', 'admin']), async (req: any, res: Response) => {
    try {
      const settingsData = req.body;
      settingsData.userId = req.user.id;
      
      const settings = await storage.saveVideoProviderSettings(settingsData);
      res.status(201).json(settings);
    } catch (error: any) {
      console.error('Error saving video provider settings:', error);
      res.status(500).json({ message: error.message });
    }
  });
}