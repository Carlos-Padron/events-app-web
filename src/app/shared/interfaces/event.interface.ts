export type PhotoFilter = 'normal' | 'vintage' | 'bw';
export type ParticipantLimit = 5 | 10 | 25 | 50 | 100;
export type EventStatus = 'scheduled' | 'live' | 'closed' | 'archived' | 'deleted';

export interface CreateEventDto {
  name: string;
  timezone: string;
  startsAt: string; // "YYYY-MM-DDTHH:mm:ss" no Z
  endsAt: string; // "YYYY-MM-DDTHH:mm:ss" no Z
  photoFilter?: PhotoFilter;
  maxParticipants?: number;
  maxShotsPerParticipant?: number; // -1 = unlimited
}

export interface CoverUploadUrlResponse {
  uploadUrl: string;
  storageKey: string;
}

export interface EventResponse {
  id: string;
  name: string;
  timezone: string;
  startsAt: string;
  endsAt: string;
  status: EventStatus;
  maxParticipants: number | null;
  maxShotsPerParticipant: number | null;
  participantCount: number;
  captureCount: number;
  coverUrl: string | null;
  invitationToken: string;
}

export interface EventSummary {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  status: EventStatus;
  participantCount: number;
  captureCount: number;
  coverUrl: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
