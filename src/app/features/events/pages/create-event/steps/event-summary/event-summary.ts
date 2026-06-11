import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { Button } from '../../../../../../components/button/button';
import { EventDraftService } from '../../event-draft.service';

@Component({
  selector: 'app-event-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'absolute inset-0 flex flex-col' },
  imports: [Button],
  templateUrl: './event-summary.html',
})
export class EventSummary {
  readonly draft       = inject(EventDraftService);
  readonly create      = output<void>();
  readonly retryUpload = output<void>();
  readonly isLoading   = input(false);
  readonly errorType   = input<'event' | 'cover' | null>(null);

  filterLabel = computed(() =>
    ({ normal: 'Normal', vintage: 'Vintage', bw: 'B & N' })[this.draft.data().filter]
  );

  revealLabel = computed(() => {
    const d = this.draft.data().revealDate;
    if (!d) return 'Sin fecha';
    const label = d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${label} · ${h}:${m}`;
  });

  dateLabel = computed(() => {
    const d = this.draft.data().date;
    if (!d) return 'Sin fecha';
    return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  });

  shotsLabel = computed(() => {
    const shots = this.draft.data().shotsPerParticipant;
    return shots === null ? 'Ilimitadas' : `${shots} por persona`;
  });
}
