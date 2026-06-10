import { Injectable, OnDestroy, signal } from '@angular/core';
import { PhotoFilter, ParticipantLimit } from '../../../../shared/interfaces/event.interface';

export type { PhotoFilter, ParticipantLimit };

export interface EventDraft {
  name:                string;
  date:                Date | null;
  filter:              PhotoFilter;
  coverFile:           File | null;
  revealDate:          Date | null;
  participantLimit:    ParticipantLimit;
  shotsPerParticipant: number | null;
}

const DEFAULT_DRAFT: EventDraft = {
  name:                '',
  date:                null,
  filter:              'normal',
  coverFile:           null,
  revealDate:          null,
  participantLimit:    5,
  shotsPerParticipant: 10,
};

@Injectable()
export class EventDraftService implements OnDestroy {
  readonly data            = signal<EventDraft>({ ...DEFAULT_DRAFT });
  readonly coverPreviewUrl = signal<string | null>(null);

  patch(partial: Partial<EventDraft>): void {
    this.data.update(d => ({ ...d, ...partial }));
  }

  setCover(file: File): void {
    const prev = this.coverPreviewUrl();
    if (prev) URL.revokeObjectURL(prev);
    this.patch({ coverFile: file });
    this.coverPreviewUrl.set(URL.createObjectURL(file));
  }

  ngOnDestroy(): void {
    const url = this.coverPreviewUrl();
    if (url) URL.revokeObjectURL(url);
  }
}
