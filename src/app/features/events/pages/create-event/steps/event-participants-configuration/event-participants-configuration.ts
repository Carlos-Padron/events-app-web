import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { EventDraftService, ParticipantLimit } from '../../event-draft.service';

interface LimitOption {
  value: ParticipantLimit;
  label: string;
}

interface ShotOption {
  value: number | null;
  label: string;
}

@Component({
  selector: 'app-event-participants-configuration',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex-1 flex flex-col' },
  imports: [],
  templateUrl: './event-participants-configuration.html',
})
export class EventParticipantsConfiguration {
  readonly draft = inject(EventDraftService);

  readonly limitOptions: LimitOption[] = [
    { value: 5,   label: '5' },
    { value: 10,  label: '10' },
    { value: 25,  label: '25' },
    { value: 50,  label: '50' },
    { value: 100, label: '100' },
  ];

  readonly shotOptions: ShotOption[] = [
    { value: 5,    label: '5' },
    { value: 10,   label: '10' },
    { value: 16,   label: '16' },
    { value: 24,   label: '24' },
    { value: 36,   label: '36' },
    { value: null, label: '∞' },
  ];

  selectLimit(value: ParticipantLimit): void {
    this.draft.participantLimit.set(value);
  }

  selectShots(value: number | null): void {
    this.draft.shotsPerParticipant.set(value);
  }

  limitPillClass(value: ParticipantLimit): string {
    const base = 'flex-1 py-2 rounded-xl text-sm font-display font-medium border transition-colors cursor-pointer';
    return this.draft.participantLimit() === value
      ? `${base} bg-ember border-ember text-ink`
      : `${base} bg-paper/5 border-paper/10 text-paper/50`;
  }

  shotPillClass(value: number | null): string {
    const base = 'flex-1 py-2.5 rounded-xl text-sm font-display font-medium border transition-colors cursor-pointer';
    return this.draft.shotsPerParticipant() === value
      ? `${base} bg-ember border-ember text-ink`
      : `${base} bg-paper/5 border-paper/10 text-paper/50`;
  }
}
