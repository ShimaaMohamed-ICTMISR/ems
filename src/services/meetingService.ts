import axios from 'axios';

// Meeting service uses a separate microservice - call directly
const MEETING_API_BASE = 'https://ems-meeting-service.onrender.com';

const meetingClient = axios.create({
  baseURL: MEETING_API_BASE,
  timeout: 15000, // 15 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for better error handling
meetingClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Enhanced error handling
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timeout - meeting service is taking too long to respond';
    } else if (error.response?.status === 401) {
      error.message = 'Authentication failed - service ticket required or invalid';
    } else if (error.response?.status === 500) {
      error.message = 'Meeting service internal error (500)';
    } else if (error.response?.status === 503) {
      error.message = 'Meeting service unavailable (503)';
    } else if (error.response?.status === 404) {
      error.message = 'Meeting service endpoint not found (404)';
    } else if (!error.response) {
      error.message = 'Network error - unable to reach meeting service';
    }
    
    console.error('Meeting service error:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    });
    
    return Promise.reject(error);
  }
);
// Add token to requests if available
meetingClient.interceptors.request.use(
  (config) => {
    // Use the service ticket provided by backend team
    const serviceTicket = 'auH2RtYi9df5vO79WXl5XyaUck6GNwClJ54ayehPU9A=';
    config.headers['x-service-ticket'] = serviceTicket; // Changed to lowercase
    
    // Also add user auth token for user identification
    const userToken = localStorage.getItem('authToken');
    if (userToken) {
      config.headers.Authorization = `Bearer ${userToken}`;
    }
    
    // Debug logging
    console.log('Meeting service request headers:', {
      'x-service-ticket': config.headers['x-service-ticket'],
      'Authorization': config.headers.Authorization,
      'url': config.url,
      'method': config.method
    });
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const toPermissionList = (payload: unknown): string[] => {
  if (Array.isArray(payload)) {
    return payload
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const typedItem = item as {
            permissionCode?: string;
            code?: string;
            key?: string;
            permission?: string;
            name?: string;
          };

          return (
            typedItem.permissionCode ||
            typedItem.code ||
            typedItem.key ||
            typedItem.permission ||
            typedItem.name ||
            ''
          );
        }

        return '';
      })
      .filter(Boolean);
  }

  if (payload && typeof payload === 'object') {
    const typedPayload = payload as {
      permissions?: unknown;
      data?: unknown;
      items?: unknown;
    };

    const fromPermissions = toPermissionList(typedPayload.permissions);
    if (fromPermissions.length > 0) return fromPermissions;

    const fromData = toPermissionList(typedPayload.data);
    if (fromData.length > 0) return fromData;

    const fromItems = toPermissionList(typedPayload.items);
    if (fromItems.length > 0) return fromItems;
  }

  return [];
};

// ============= INTERFACES =============

export type MeetingStatus = 'DRAFT' | 'SCHEDULED' | 'CANCELLED';
export type ParticipantResponse = 'ACCEPTED' | 'DECLINED' | 'TENTATIVE';
export type ActionItemStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: MeetingStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  zoomMeetingId?: string;
  zoomJoinUrl?: string;
  zoomStartUrl?: string;
  zoomPassword?: string;
  participants?: Participant[];
  organizers?: Organizer[];
  agendaItems?: AgendaItem[];
  minutes?: Minutes;
  actionItems?: ActionItem[];
}

export interface Participant {
  id: string;
  meetingId: string;
  userId: string;
  response?: ParticipantResponse;
  createdAt: string;
  updatedAt: string;
}

export interface Organizer {
  id: string;
  meetingId: string;
  userId: string;
  createdAt: string;
}

export interface AgendaItem {
  id: string;
  meetingId: string;
  title: string;
  durationMinutes?: number;
  ownerUserId?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Minutes {
  id: string;
  meetingId: string;
  notes?: string;
  decisions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActionItem {
  id: string;
  meetingId: string;
  title: string;
  assignedToUserId: string;
  dueDate?: string;
  status: ActionItemStatus;
  createdAt: string;
  updatedAt: string;
}

// ============= DTOs =============

export interface CreateParticipantDto {
  userId: string;
}

export interface CreateOrganizerDto {
  userId: string;
}

export interface CreateMeetingDto {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  status?: MeetingStatus;
  participants?: CreateParticipantDto[];
  organizers?: CreateOrganizerDto[];
}

export interface UpdateMeetingDto {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  status?: MeetingStatus;
}

export interface AddParticipantDto {
  userId: string;
}

export interface UpdateParticipantDto {
  response: ParticipantResponse;
}

// ============= HEALTH CHECK =============

// Check if meeting service is available
export const checkServiceHealth = async (): Promise<{ status: 'healthy' | 'unhealthy', message: string }> => {
  try {
    // Try a simple request to check if service is responding
    await meetingClient.get('/health', { timeout: 5000 });
    return { status: 'healthy', message: 'Meeting service is operational' };
  } catch (error: any) {
    if (error.response?.status === 404) {
      // If /health endpoint doesn't exist, try the main endpoint
      try {
        await meetingClient.get('/meetings', { timeout: 5000 });
        return { status: 'healthy', message: 'Meeting service is operational' };
      } catch (fallbackError: any) {
        return { 
          status: 'unhealthy', 
          message: `Service unavailable: ${fallbackError.message || 'Unknown error'}` 
        };
      }
    }
    return { 
      status: 'unhealthy', 
      message: `Service check failed: ${error.message || 'Unknown error'}` 
    };
  }
};

export const getMeetingPermissions = async (): Promise<string[]> => {
  const response = await meetingClient.get('/permissions');
  const permissions = toPermissionList(response.data);
  return Array.from(new Set(permissions));
};

// ============= MEETING ENDPOINTS =============

// Get all meetings
export const getMeetings = async (status?: MeetingStatus): Promise<Meeting[]> => {
  try {
    const params = status ? { status } : {};
    const response = await meetingClient.get('/meetings', { params });
    console.log('Meetings loaded:', response.data);
    
    // Log Zoom details for each meeting
    response.data.forEach((meeting: Meeting, index: number) => {
      console.log(`Meeting ${index} (${meeting.title}) Zoom details:`, {
        id: meeting.id,
        zoomMeetingId: meeting.zoomMeetingId,
        zoomJoinUrl: meeting.zoomJoinUrl,
        zoomStartUrl: meeting.zoomStartUrl,
        zoomPassword: meeting.zoomPassword,
        hasZoomUrl: !!meeting.zoomJoinUrl
      });
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching meetings:', error);
    throw error;
  }
};

// Get meeting by ID
export const getMeetingById = async (id: string): Promise<Meeting> => {
  const response = await meetingClient.get(`/meetings/${id}`);
  return response.data;
};

// Create a new meeting
export const createMeeting = async (data: CreateMeetingDto): Promise<Meeting> => {
  console.log('Creating meeting with data:', data);
  const response = await meetingClient.post('/meetings', data);
  console.log('Meeting created successfully:', response.data);
  console.log('Zoom details in response:', {
    zoomMeetingId: response.data.zoomMeetingId,
    zoomJoinUrl: response.data.zoomJoinUrl,
    zoomStartUrl: response.data.zoomStartUrl,
    zoomPassword: response.data.zoomPassword
  });
  return response.data;
};

// Update a meeting
export const updateMeeting = async (id: string, data: UpdateMeetingDto): Promise<Meeting> => {
  const response = await meetingClient.patch(`/meetings/${id}`, data);
  return response.data;
};

// Delete a meeting
export const deleteMeeting = async (id: string): Promise<void> => {
  await meetingClient.delete(`/meetings/${id}`);
};

// Cancel a meeting
export const cancelMeeting = async (id: string): Promise<Meeting> => {
  const response = await meetingClient.post(`/meetings/${id}/cancel`);
  return response.data;
};

// ============= PARTICIPANT ENDPOINTS =============

// Get meeting participants
export const getMeetingParticipants = async (meetingId: string): Promise<Participant[]> => {
  const response = await meetingClient.get(`/meetings/${meetingId}/participants`);
  return response.data;
};

// Add participant to meeting
export const addParticipant = async (meetingId: string, data: AddParticipantDto): Promise<Meeting> => {
  const response = await meetingClient.post(`/meetings/${meetingId}/participants`, data);
  return response.data;
};

// Update participant response
export const updateParticipantResponse = async (
  meetingId: string,
  participantId: string,
  data: UpdateParticipantDto
): Promise<Meeting> => {
  const response = await meetingClient.patch(`/meetings/${meetingId}/participants/${participantId}`, data);
  return response.data;
};

// Remove participant from meeting
export const removeParticipant = async (meetingId: string, participantId: string): Promise<void> => {
  await meetingClient.delete(`/meetings/${meetingId}/participants/${participantId}`);
};
