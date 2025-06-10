import { google } from 'googleapis';
import axios from 'axios';

// Video Conferencing Provider Interface
export interface VideoProvider {
  createMeeting(sessionData: any): Promise<any>;
  updateMeeting(meetingId: string, updateData: any): Promise<any>;
  deleteMeeting(meetingId: string): Promise<void>;
  getMeetingInfo(meetingId: string): Promise<any>;
  getRecordings(meetingId: string): Promise<any[]>;
}

// Google Meet Integration
export class GoogleMeetProvider implements VideoProvider {
  private calendar: any;

  constructor() {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });
    this.calendar = google.calendar({ version: 'v3', auth });
  }

  async createMeeting(sessionData: any): Promise<any> {
    try {
      const event = {
        summary: sessionData.title,
        description: sessionData.description,
        start: {
          dateTime: sessionData.scheduledAt,
          timeZone: sessionData.timezone || 'UTC',
        },
        end: {
          dateTime: new Date(new Date(sessionData.scheduledAt).getTime() + sessionData.duration * 60000).toISOString(),
          timeZone: sessionData.timezone || 'UTC',
        },
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        },
        attendees: sessionData.attendees || [],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 15 },
          ],
        },
      };

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        conferenceDataVersion: 1,
      });

      return {
        meetingId: response.data.id,
        meetingUrl: response.data.conferenceData?.entryPoints?.[0]?.uri,
        hostUrl: response.data.conferenceData?.entryPoints?.[0]?.uri,
        provider: 'google_meet'
      };
    } catch (error) {
      console.error('Error creating Google Meet:', error);
      throw new Error('Failed to create Google Meet session');
    }
  }

  async updateMeeting(meetingId: string, updateData: any): Promise<any> {
    try {
      const response = await this.calendar.events.patch({
        calendarId: 'primary',
        eventId: meetingId,
        resource: updateData,
      });
      return response.data;
    } catch (error) {
      console.error('Error updating Google Meet:', error);
      throw error;
    }
  }

  async deleteMeeting(meetingId: string): Promise<void> {
    try {
      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId: meetingId,
      });
    } catch (error) {
      console.error('Error deleting Google Meet:', error);
      throw error;
    }
  }

  async getMeetingInfo(meetingId: string): Promise<any> {
    try {
      const response = await this.calendar.events.get({
        calendarId: 'primary',
        eventId: meetingId,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching Google Meet info:', error);
      throw error;
    }
  }

  async getRecordings(meetingId: string): Promise<any[]> {
    // Google Meet recordings are handled through Google Drive
    // This would require additional implementation
    return [];
  }
}

// Zoom Integration
export class ZoomProvider implements VideoProvider {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl = 'https://api.zoom.us/v2';

  constructor() {
    this.apiKey = process.env.ZOOM_API_KEY!;
    this.apiSecret = process.env.ZOOM_API_SECRET!;
  }

  private async getAccessToken(): Promise<string> {
    try {
      const credentials = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');
      const response = await axios.post('https://zoom.us/oauth/token', 
        'grant_type=account_credentials&account_id=' + process.env.ZOOM_ACCOUNT_ID,
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      return response.data.access_token;
    } catch (error) {
      console.error('Error getting Zoom access token:', error);
      throw error;
    }
  }

  async createMeeting(sessionData: any): Promise<any> {
    try {
      const token = await this.getAccessToken();
      const meetingData = {
        topic: sessionData.title,
        type: 2, // Scheduled meeting
        start_time: sessionData.scheduledAt,
        duration: sessionData.duration,
        timezone: sessionData.timezone || 'UTC',
        agenda: sessionData.description,
        settings: {
          host_video: true,
          participant_video: sessionData.allowParticipantCamera !== false,
          cn_meeting: false,
          in_meeting: false,
          join_before_host: false,
          mute_upon_entry: true,
          watermark: false,
          use_pmi: false,
          approval_type: sessionData.waitingRoomEnabled ? 2 : 0,
          audio: 'voip',
          auto_recording: sessionData.isRecorded ? 'cloud' : 'none',
          enforce_login: false,
          registrants_email_notification: true,
        }
      };

      const response = await axios.post(`${this.baseUrl}/users/me/meetings`, meetingData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        meetingId: response.data.id.toString(),
        meetingUrl: response.data.join_url,
        hostUrl: response.data.start_url,
        passcode: response.data.password,
        provider: 'zoom'
      };
    } catch (error) {
      console.error('Error creating Zoom meeting:', error);
      throw new Error('Failed to create Zoom meeting');
    }
  }

  async updateMeeting(meetingId: string, updateData: any): Promise<any> {
    try {
      const token = await this.getAccessToken();
      const response = await axios.patch(`${this.baseUrl}/meetings/${meetingId}`, updateData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating Zoom meeting:', error);
      throw error;
    }
  }

  async deleteMeeting(meetingId: string): Promise<void> {
    try {
      const token = await this.getAccessToken();
      await axios.delete(`${this.baseUrl}/meetings/${meetingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error deleting Zoom meeting:', error);
      throw error;
    }
  }

  async getMeetingInfo(meetingId: string): Promise<any> {
    try {
      const token = await this.getAccessToken();
      const response = await axios.get(`${this.baseUrl}/meetings/${meetingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching Zoom meeting info:', error);
      throw error;
    }
  }

  async getRecordings(meetingId: string): Promise<any[]> {
    try {
      const token = await this.getAccessToken();
      const response = await axios.get(`${this.baseUrl}/meetings/${meetingId}/recordings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data.recording_files || [];
    } catch (error) {
      console.error('Error fetching Zoom recordings:', error);
      return [];
    }
  }
}

// Zoho Meeting Integration
export class ZohoProvider implements VideoProvider {
  private clientId: string;
  private clientSecret: string;
  private refreshToken: string;
  private baseUrl = 'https://meeting.zoho.com/api/v2';

  constructor() {
    this.clientId = process.env.ZOHO_CLIENT_ID!;
    this.clientSecret = process.env.ZOHO_CLIENT_SECRET!;
    this.refreshToken = process.env.ZOHO_REFRESH_TOKEN!;
  }

  private async getAccessToken(): Promise<string> {
    try {
      const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
        params: {
          refresh_token: this.refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'refresh_token'
        }
      });
      return response.data.access_token;
    } catch (error) {
      console.error('Error getting Zoho access token:', error);
      throw error;
    }
  }

  async createMeeting(sessionData: any): Promise<any> {
    try {
      const token = await this.getAccessToken();
      const meetingData = {
        topic: sessionData.title,
        agenda: sessionData.description,
        startTime: sessionData.scheduledAt,
        duration: sessionData.duration,
        timezone: sessionData.timezone || 'UTC',
        presenter: {
          name: sessionData.hostName || 'Host',
          email: sessionData.hostEmail
        },
        meetingOptions: {
          isRecordingEnabled: sessionData.isRecorded || false,
          isParticipantCameraEnabled: sessionData.allowParticipantCamera !== false,
          isParticipantMicEnabled: sessionData.allowParticipantMicrophone !== false,
          isChatEnabled: sessionData.allowChat !== false,
          isScreenShareEnabled: sessionData.allowScreenShare !== false
        }
      };

      const response = await axios.post(`${this.baseUrl}/meetings`, meetingData, {
        headers: {
          'Authorization': `Zoho-oauthtoken ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        meetingId: response.data.meeting.meetingKey,
        meetingUrl: response.data.meeting.joinUrl,
        hostUrl: response.data.meeting.startUrl,
        provider: 'zoho_meeting'
      };
    } catch (error) {
      console.error('Error creating Zoho meeting:', error);
      throw new Error('Failed to create Zoho meeting');
    }
  }

  async updateMeeting(meetingId: string, updateData: any): Promise<any> {
    try {
      const token = await this.getAccessToken();
      const response = await axios.put(`${this.baseUrl}/meetings/${meetingId}`, updateData, {
        headers: {
          'Authorization': `Zoho-oauthtoken ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating Zoho meeting:', error);
      throw error;
    }
  }

  async deleteMeeting(meetingId: string): Promise<void> {
    try {
      const token = await this.getAccessToken();
      await axios.delete(`${this.baseUrl}/meetings/${meetingId}`, {
        headers: {
          'Authorization': `Zoho-oauthtoken ${token}`
        }
      });
    } catch (error) {
      console.error('Error deleting Zoho meeting:', error);
      throw error;
    }
  }

  async getMeetingInfo(meetingId: string): Promise<any> {
    try {
      const token = await this.getAccessToken();
      const response = await axios.get(`${this.baseUrl}/meetings/${meetingId}`, {
        headers: {
          'Authorization': `Zoho-oauthtoken ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching Zoho meeting info:', error);
      throw error;
    }
  }

  async getRecordings(meetingId: string): Promise<any[]> {
    try {
      const token = await this.getAccessToken();
      const response = await axios.get(`${this.baseUrl}/meetings/${meetingId}/recordings`, {
        headers: {
          'Authorization': `Zoho-oauthtoken ${token}`
        }
      });
      return response.data.recordings || [];
    } catch (error) {
      console.error('Error fetching Zoho recordings:', error);
      return [];
    }
  }
}

// Video Conferencing Service Factory
export class VideoConferencingService {
  private providers: Map<string, VideoProvider> = new Map();

  constructor() {
    this.providers.set('google_meet', new GoogleMeetProvider());
    this.providers.set('zoom', new ZoomProvider());
    this.providers.set('zoho_meeting', new ZohoProvider());
  }

  getProvider(providerName: string): VideoProvider {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Unsupported video provider: ${providerName}`);
    }
    return provider;
  }

  async createMeeting(providerName: string, sessionData: any): Promise<any> {
    const provider = this.getProvider(providerName);
    return await provider.createMeeting(sessionData);
  }

  async updateMeeting(providerName: string, meetingId: string, updateData: any): Promise<any> {
    const provider = this.getProvider(providerName);
    return await provider.updateMeeting(meetingId, updateData);
  }

  async deleteMeeting(providerName: string, meetingId: string): Promise<void> {
    const provider = this.getProvider(providerName);
    await provider.deleteMeeting(meetingId);
  }

  async getMeetingInfo(providerName: string, meetingId: string): Promise<any> {
    const provider = this.getProvider(providerName);
    return await provider.getMeetingInfo(meetingId);
  }

  async getRecordings(providerName: string, meetingId: string): Promise<any[]> {
    const provider = this.getProvider(providerName);
    return await provider.getRecordings(meetingId);
  }
}

export const videoConferencingService = new VideoConferencingService();