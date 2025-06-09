import { randomBytes } from 'crypto';
import { 
  LiveSession, 
  InsertLiveSession, 
  VideoProviderSetting,
  InsertVideoProviderSettings 
} from '@shared/schema';

export interface MeetingCredentials {
  meetingUrl: string;
  meetingId: string;
  meetingPassword?: string;
  hostKey?: string;
  hostUrl?: string;
}

export interface RecordingInfo {
  recordingUrl: string;
  recordingId: string;
  recordingPassword?: string;
  recordingSize?: number;
  recordingDuration?: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  timezone: string;
  meetingUrl: string;
  description?: string;
}

export class VideoConferencingService {
  
  /**
   * Create a meeting based on the selected provider
   */
  async createMeeting(
    session: InsertLiveSession,
    providerSettings: VideoProviderSetting
  ): Promise<MeetingCredentials> {
    const provider = session.provider || 'google_meet';
    
    switch (provider) {
      case 'google_meet':
        return this.createGoogleMeeting(session, providerSettings);
      case 'zoom':
        return this.createZoomMeeting(session, providerSettings);
      case 'zoho':
        return this.createZohoMeeting(session, providerSettings);
      default:
        throw new Error(`Unsupported video provider: ${provider}`);
    }
  }

  /**
   * Create Google Meet meeting
   */
  private async createGoogleMeeting(
    session: InsertLiveSession,
    providerSettings: VideoProviderSetting
  ): Promise<MeetingCredentials> {
    try {
      // Google Meet API integration
      const accessToken = providerSettings.accessToken;
      if (!accessToken) {
        throw new Error('Google Meet access token not found');
      }

      const meetingData = {
        summary: session.title,
        description: session.description || '',
        start: {
          dateTime: session.startTime,
          timeZone: session.timezone || 'UTC',
        },
        end: {
          dateTime: session.endTime,
          timeZone: session.timezone || 'UTC',
        },
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        },
      };

      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(meetingData),
        }
      );

      if (!response.ok) {
        throw new Error(`Google Calendar API error: ${response.statusText}`);
      }

      const data = await response.json();
      const meetingUrl = data.conferenceData?.entryPoints?.[0]?.uri || '';
      const meetingId = data.conferenceData?.conferenceId || '';

      return {
        meetingUrl,
        meetingId,
        hostUrl: meetingUrl,
      };
    } catch (error) {
      console.error('Google Meet creation error:', error);
      // Fallback to generic meeting URL
      return this.createFallbackMeeting(session);
    }
  }

  /**
   * Create Zoom meeting
   */
  private async createZoomMeeting(
    session: InsertLiveSession,
    providerSettings: VideoProviderSetting
  ): Promise<MeetingCredentials> {
    try {
      const accessToken = providerSettings.accessToken;
      if (!accessToken) {
        throw new Error('Zoom access token not found');
      }

      const meetingData = {
        topic: session.title,
        type: 2, // Scheduled meeting
        start_time: session.startTime,
        duration: session.duration,
        timezone: session.timezone || 'UTC',
        password: this.generateMeetingPassword(),
        agenda: session.description || '',
        settings: {
          host_video: true,
          participant_video: true,
          cn_meeting: false,
          in_meeting: false,
          join_before_host: session.waitingRoomEnabled ? false : true,
          mute_upon_entry: true,
          watermark: false,
          use_pmi: false,
          approval_type: 0,
          auto_recording: session.autoRecord ? 'cloud' : 'none',
          enforce_login: false,
          registrants_email_notification: true,
          waiting_room: session.waitingRoomEnabled,
        },
      };

      const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingData),
      });

      if (!response.ok) {
        throw new Error(`Zoom API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        meetingUrl: data.join_url,
        meetingId: data.id.toString(),
        meetingPassword: data.password,
        hostKey: data.host_key,
        hostUrl: data.start_url,
      };
    } catch (error) {
      console.error('Zoom meeting creation error:', error);
      return this.createFallbackMeeting(session);
    }
  }

  /**
   * Create Zoho meeting
   */
  private async createZohoMeeting(
    session: InsertLiveSession,
    providerSettings: VideoProviderSetting
  ): Promise<MeetingCredentials> {
    try {
      const accessToken = providerSettings.accessToken;
      if (!accessToken) {
        throw new Error('Zoho access token not found');
      }

      const meetingData = {
        topic: session.title,
        agenda: session.description || '',
        startTime: session.startTime,
        duration: session.duration,
        timezone: session.timezone || 'UTC',
        password: this.generateMeetingPassword(),
        settings: {
          hostVideo: true,
          participantVideo: true,
          muteUponEntry: true,
          autoRecording: session.autoRecord,
          waitingRoom: session.waitingRoomEnabled,
        },
      };

      const response = await fetch('https://meeting.zoho.com/api/v2/meetings', {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingData),
      });

      if (!response.ok) {
        throw new Error(`Zoho API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        meetingUrl: data.meetingUrl,
        meetingId: data.meetingKey,
        meetingPassword: data.password,
        hostUrl: data.hostUrl,
      };
    } catch (error) {
      console.error('Zoho meeting creation error:', error);
      return this.createFallbackMeeting(session);
    }
  }

  /**
   * Create fallback meeting when API fails
   */
  private createFallbackMeeting(session: InsertLiveSession): MeetingCredentials {
    const meetingId = `live-${Date.now()}`;
    const meetingPassword = this.generateMeetingPassword();
    
    return {
      meetingUrl: `https://meet.codelabeducare.com/room/${meetingId}`,
      meetingId,
      meetingPassword,
      hostUrl: `https://meet.codelabeducare.com/room/${meetingId}?role=host`,
    };
  }

  /**
   * Get meeting recordings
   */
  async getMeetingRecording(
    meetingId: string,
    provider: string,
    providerSettings: VideoProviderSetting
  ): Promise<RecordingInfo | null> {
    switch (provider) {
      case 'zoom':
        return this.getZoomRecording(meetingId, providerSettings);
      case 'google_meet':
        return this.getGoogleMeetRecording(meetingId, providerSettings);
      case 'zoho':
        return this.getZohoRecording(meetingId, providerSettings);
      default:
        return null;
    }
  }

  /**
   * Get Zoom recording
   */
  private async getZoomRecording(
    meetingId: string,
    providerSettings: VideoProviderSetting
  ): Promise<RecordingInfo | null> {
    try {
      const accessToken = providerSettings.accessToken;
      const response = await fetch(
        `https://api.zoom.us/v2/meetings/${meetingId}/recordings`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      const recording = data.recording_files?.[0];

      if (!recording) return null;

      return {
        recordingUrl: recording.download_url,
        recordingId: recording.id,
        recordingSize: recording.file_size,
        recordingDuration: data.duration,
      };
    } catch (error) {
      console.error('Zoom recording fetch error:', error);
      return null;
    }
  }

  /**
   * Get Google Meet recording (Drive integration)
   */
  private async getGoogleMeetRecording(
    meetingId: string,
    providerSettings: VideoProviderSetting
  ): Promise<RecordingInfo | null> {
    try {
      const accessToken = providerSettings.accessToken;
      
      // Search for recording in Google Drive
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name contains '${meetingId}' and mimeType contains 'video'`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      const file = data.files?.[0];

      if (!file) return null;

      return {
        recordingUrl: `https://drive.google.com/file/d/${file.id}/view`,
        recordingId: file.id,
        recordingSize: parseInt(file.size || '0'),
      };
    } catch (error) {
      console.error('Google Meet recording fetch error:', error);
      return null;
    }
  }

  /**
   * Get Zoho recording
   */
  private async getZohoRecording(
    meetingId: string,
    providerSettings: VideoProviderSetting
  ): Promise<RecordingInfo | null> {
    try {
      const accessToken = providerSettings.accessToken;
      const response = await fetch(
        `https://meeting.zoho.com/api/v2/meetings/${meetingId}/recordings`,
        {
          headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
          },
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      const recording = data.recordings?.[0];

      if (!recording) return null;

      return {
        recordingUrl: recording.downloadUrl,
        recordingId: recording.recordingId,
        recordingSize: recording.fileSize,
        recordingDuration: recording.duration,
      };
    } catch (error) {
      console.error('Zoho recording fetch error:', error);
      return null;
    }
  }

  /**
   * Update meeting
   */
  async updateMeeting(
    session: LiveSession,
    providerSettings: VideoProviderSetting,
    updates: Partial<InsertLiveSession>
  ): Promise<MeetingCredentials> {
    const provider = session.provider;
    
    switch (provider) {
      case 'zoom':
        return this.updateZoomMeeting(session, providerSettings, updates);
      case 'google_meet':
        return this.updateGoogleMeeting(session, providerSettings, updates);
      case 'zoho':
        return this.updateZohoMeeting(session, providerSettings, updates);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Update Zoom meeting
   */
  private async updateZoomMeeting(
    session: LiveSession,
    providerSettings: VideoProviderSetting,
    updates: Partial<InsertLiveSession>
  ): Promise<MeetingCredentials> {
    try {
      const accessToken = providerSettings.accessToken;
      const updateData = {
        topic: updates.title || session.title,
        start_time: updates.startTime || session.startTime,
        duration: updates.duration || session.duration,
        agenda: updates.description || session.description,
      };

      const response = await fetch(
        `https://api.zoom.us/v2/meetings/${session.meetingId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        throw new Error(`Zoom update error: ${response.statusText}`);
      }

      return {
        meetingUrl: session.meetingUrl || '',
        meetingId: session.meetingId || '',
        meetingPassword: session.meetingPassword,
        hostKey: session.hostKey,
      };
    } catch (error) {
      console.error('Zoom meeting update error:', error);
      throw error;
    }
  }

  /**
   * Update Google Meet (via Calendar)
   */
  private async updateGoogleMeeting(
    session: LiveSession,
    providerSettings: VideoProviderSetting,
    updates: Partial<InsertLiveSession>
  ): Promise<MeetingCredentials> {
    // Google Meet meetings are updated via Calendar events
    // Implementation would depend on storing the calendar event ID
    return {
      meetingUrl: session.meetingUrl || '',
      meetingId: session.meetingId || '',
    };
  }

  /**
   * Update Zoho meeting
   */
  private async updateZohoMeeting(
    session: LiveSession,
    providerSettings: VideoProviderSetting,
    updates: Partial<InsertLiveSession>
  ): Promise<MeetingCredentials> {
    try {
      const accessToken = providerSettings.accessToken;
      const updateData = {
        topic: updates.title || session.title,
        startTime: updates.startTime || session.startTime,
        duration: updates.duration || session.duration,
        agenda: updates.description || session.description,
      };

      const response = await fetch(
        `https://meeting.zoho.com/api/v2/meetings/${session.meetingId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        throw new Error(`Zoho update error: ${response.statusText}`);
      }

      return {
        meetingUrl: session.meetingUrl || '',
        meetingId: session.meetingId || '',
        meetingPassword: session.meetingPassword,
      };
    } catch (error) {
      console.error('Zoho meeting update error:', error);
      throw error;
    }
  }

  /**
   * Delete meeting
   */
  async deleteMeeting(
    session: LiveSession,
    providerSettings: VideoProviderSetting
  ): Promise<void> {
    const provider = session.provider;
    
    try {
      switch (provider) {
        case 'zoom':
          await this.deleteZoomMeeting(session, providerSettings);
          break;
        case 'google_meet':
          await this.deleteGoogleMeeting(session, providerSettings);
          break;
        case 'zoho':
          await this.deleteZohoMeeting(session, providerSettings);
          break;
      }
    } catch (error) {
      console.error(`Failed to delete ${provider} meeting:`, error);
      // Don't throw error to allow database cleanup to proceed
    }
  }

  /**
   * Delete Zoom meeting
   */
  private async deleteZoomMeeting(
    session: LiveSession,
    providerSettings: VideoProviderSetting
  ): Promise<void> {
    const accessToken = providerSettings.accessToken;
    await fetch(`https://api.zoom.us/v2/meetings/${session.meetingId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
  }

  /**
   * Delete Google Meet (via Calendar)
   */
  private async deleteGoogleMeeting(
    session: LiveSession,
    providerSettings: VideoProviderSetting
  ): Promise<void> {
    // Implementation would require storing calendar event ID
    console.log('Google Meet deletion not implemented - manual cleanup required');
  }

  /**
   * Delete Zoho meeting
   */
  private async deleteZohoMeeting(
    session: LiveSession,
    providerSettings: VideoProviderSetting
  ): Promise<void> {
    const accessToken = providerSettings.accessToken;
    await fetch(`https://meeting.zoho.com/api/v2/meetings/${session.meetingId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
      },
    });
  }

  /**
   * Generate secure meeting password
   */
  private generateMeetingPassword(): string {
    return randomBytes(4).toString('hex').toUpperCase();
  }

  /**
   * Create calendar event for external calendars
   */
  async createCalendarEvent(
    session: LiveSession,
    provider: 'google' | 'outlook' | 'apple'
  ): Promise<CalendarEvent> {
    const event = {
      id: `session-${session.id}`,
      title: session.title,
      startTime: session.startTime?.toISOString() || '',
      endTime: session.endTime?.toISOString() || '',
      timezone: session.timezone || 'UTC',
      meetingUrl: session.meetingUrl || '',
      description: `${session.description || ''}\n\nJoin meeting: ${session.meetingUrl}`,
    };

    return event;
  }

  /**
   * Generate calendar URLs for different providers
   */
  generateCalendarUrls(session: LiveSession): {
    google: string;
    outlook: string;
    apple: string;
  } {
    const title = encodeURIComponent(session.title);
    const details = encodeURIComponent(
      `${session.description || ''}\n\nJoin meeting: ${session.meetingUrl}`
    );
    const startTime = session.startTime?.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endTime = session.endTime?.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    return {
      google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}`,
      outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${startTime}&enddt=${endTime}&body=${details}`,
      apple: `data:text/calendar;charset=utf8,BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${startTime}
DTEND:${endTime}
SUMMARY:${session.title}
DESCRIPTION:${session.description || ''}\\n\\nJoin meeting: ${session.meetingUrl}
END:VEVENT
END:VCALENDAR`,
    };
  }
}

export const videoConferencingService = new VideoConferencingService();