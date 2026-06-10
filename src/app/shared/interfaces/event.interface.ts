export type PhotoFilter     = 'normal' | 'vintage' | 'bw';
export type ParticipantLimit = 5 | 10 | 25 | 50 | 100;

export interface EventResponse {
  id:                  string;
  name:                string;
  date:                string;
  revealDate:          string;
  filter:              PhotoFilter;
  coverUrl:            string | null;
  participantLimit:    ParticipantLimit;
  shotsPerParticipant: number | null;
  ownerId:             string;
  createdAt:           string;
}
