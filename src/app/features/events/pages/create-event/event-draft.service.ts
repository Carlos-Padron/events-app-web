import { Injectable, OnDestroy, signal } from '@angular/core';

export type PhotoFilter = 'normal' | 'vintage' | 'bw';
export type ParticipantLimit = 5 | 10 | 25 | 50 | 100;

@Injectable()
export class EventDraftService implements OnDestroy {
  name            = signal('');
  date            = signal<Date | null>(null);
  filter          = signal<PhotoFilter>('normal');
  coverFile       = signal<File | null>(null);
  coverPreviewUrl = signal<string | null>(null);
  revealDate      = signal<Date | null>(null);
  participantLimit    = signal<ParticipantLimit>(5);
  shotsPerParticipant = signal<number | null>(10);

  setCover(file: File): void {
    const prev = this.coverPreviewUrl();
    if (prev) URL.revokeObjectURL(prev);
    this.coverFile.set(file);
    this.coverPreviewUrl.set(URL.createObjectURL(file));
  }

  ngOnDestroy(): void {
    const url = this.coverPreviewUrl();
    if (url) URL.revokeObjectURL(url);
  }
}
