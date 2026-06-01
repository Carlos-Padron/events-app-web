import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { Calendar } from '../../../../../../components/calendar/calendar';

type RevealMode = 'on-close' | 'scheduled';

@Component({
  selector: 'app-event-reveal-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex-1 flex flex-col' },
  imports: [Calendar],
  templateUrl: './event-reveal-step.html',
})
export class EventRevealStep {
  selectedMode  = signal<RevealMode>('on-close');
  scheduledDate = signal<Date | null>(null);
  scheduledTime = signal('20:00');

  isScheduled = computed(() => this.selectedMode() === 'scheduled');

  formattedSchedule = computed(() => {
    const date = this.scheduledDate();
    if (!date) return null;
    const label = date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
    return `${label} · ${this.scheduledTime()}`;
  });

  select(mode: RevealMode): void {
    this.selectedMode.set(mode);
  }

  cardClass(mode: RevealMode): string {
    const base = 'w-full text-left rounded-2xl p-4 border transition-colors cursor-pointer';
    return this.selectedMode() === mode
      ? `${base} bg-ember/10 border-ember`
      : `${base} bg-paper/5 border-paper/10`;
  }

  radioClass(mode: RevealMode): string {
    const base = 'w-4 h-4 rounded-full flex-shrink-0 mt-0.5 transition-all';
    return this.selectedMode() === mode
      ? `${base} border-2 border-ember bg-ember shadow-[inset_0_0_0_3px_#1F1B16]`
      : `${base} border border-paper/30`;
  }
}
