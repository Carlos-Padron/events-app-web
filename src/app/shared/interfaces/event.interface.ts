export type PhotoFilter    = 'normal' | 'vintage' | 'bw';
export type ParticipantLimit = 5 | 10 | 25 | 50 | 100;
export type CoverStatus    = 'none' | 'pending' | 'processing' | 'done' | 'failed';
export type EventStatus    = 'scheduled' | 'live' | 'closed' | 'archived' | 'deleted';

export interface CreateEventDto {
  name:                    string;
  timezone:                string;
  startsAt:                string;   // "YYYY-MM-DDTHH:mm:ss" no Z
  endsAt:                  string;   // "YYYY-MM-DDTHH:mm:ss" no Z
  photoFilter?:            PhotoFilter;
  maxParticipants?:        number;
  maxShotsPerParticipant?: number;   // -1 = unlimited
}

export interface CoverUploadUrlResponse {
  uploadUrl:  string;
  storageKey: string;
}

export interface EventResponse {
  id:                     string;
  name:                   string;
  timezone:               string;
  startsAt:               string;
  endsAt:                 string;
  revealAt:               string;
  coverStatus:            CoverStatus;
  coverStorageKey:        string | null;
  photoFilter:            PhotoFilter | null;
  maxParticipants:        number | null;
  maxShotsPerParticipant: number | null;
  videoEnabled:           boolean;
  maxVideoDurationMs:     number;
  status:                 EventStatus;
  description:            string | null;
  participantCount:       number;
  captureCount:           number;
  storageExpiresAt:       string | null;
  invitationToken:        string;
  organizerId:            string;
  createdAt:              string;
  updatedAt:              string;
}

export interface PaginatedResponse<T> {
  data:       T[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}
