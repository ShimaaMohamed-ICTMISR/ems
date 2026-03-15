import axios from 'axios';

// Meeting service uses a separate microservice
const MEETING_API_BASE = import.meta.env.DEV 
  ? '/api/meeting' 
  : 'https://ems-meeting-service.onrender.com';

const meetingClient = axios.create({
  baseURL: MEETING_API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
meetingClient.interceptors.request.use(
  (config) => {
    // Use the service ticket provided by backend team
    const serviceTicket = 'auH2RtYi9df5vO79WXl5XyaUck6GNwClJ54ayehPU9A=';
    config.headers['X-Service-Ticket'] = serviceTicket;
    
    // Also add user auth token for user identification
    const userToken = localStorage.getItem('authToken');
    if (userToken) {
      config.headers.Authorization = `Bearer ${userToken}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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

// ============= MEETING ENDPOINTS =============

// Get all meetings
export const getMeetings = async (status?: MeetingStatus): Promise<Meeting[]> => {
  try {
    const params = status ? { status } : {};
    const response = await meetingClient.get('/meetings', { params });
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
  const response = await meetingClient.post('/meetings', data);
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
