import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

type ParticipantLimit = 5 | 10 | 25 | 50 | 100;

interface LimitOption {
  value: ParticipantLimit;
  label: string;
  description: string;
}

interface ShotOption {
  value: number;
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
  readonly limitOptions: LimitOption[] = [
    { value: 5,   label: 'Hasta 5',   description: 'Ideal para grupos íntimos o reuniones familiares.' },
    { value: 10,  label: 'Hasta 10',  description: 'Perfecto para cenas o celebraciones pequeñas.' },
    { value: 25,  label: 'Hasta 25',  description: 'Adecuado para fiestas medianas o eventos de oficina.' },
    { value: 50,  label: 'Hasta 50',  description: 'Para eventos grandes como bodas o graduaciones.' },
    { value: 100, label: 'Hasta 100', description: 'Festivales, conferencias o eventos masivos.' },
  ];

  readonly shotOptions: ShotOption[] = [
    { value: 1,  label: '1 foto' },
    { value: 3,  label: '3 fotos' },
    { value: 5,  label: '5 fotos' },
    { value: 10, label: '10 fotos' },
  ];

  participantLimit = signal<ParticipantLimit>(10);
  shotsPerParticipant = signal<number>(3);

  selectLimit(value: ParticipantLimit): void {
    this.participantLimit.set(value);
  }

  selectShots(value: number): void {
    this.shotsPerParticipant.set(value);
  }

  limitCardClass(value: ParticipantLimit): string {
    const base = 'w-full text-left rounded-2xl p-4 border transition-colors cursor-pointer';
    return this.participantLimit() === value
      ? `${base} bg-ember/10 border-ember`
      : `${base} bg-paper/5 border-paper/10`;
  }

  limitRadioClass(value: ParticipantLimit): string {
    const base = 'w-4 h-4 rounded-full flex-shrink-0 mt-0.5 transition-all';
    return this.participantLimit() === value
      ? `${base} border-2 border-ember bg-ember shadow-[inset_0_0_0_3px_#1F1B16]`
      : `${base} border border-paper/30`;
  }

  shotCardClass(value: number): string {
    const base = 'flex-1 py-3 rounded-xl border text-sm font-display font-medium transition-colors cursor-pointer';
    return this.shotsPerParticipant() === value
      ? `${base} bg-ember/10 border-ember text-ember`
      : `${base} bg-paper/5 border-paper/10 text-paper/60`;
  }
}
