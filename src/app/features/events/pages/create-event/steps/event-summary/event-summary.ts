import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { Button } from '../../../../../../components/button/button';
import { EventDraftService } from '../../event-draft.service';
import { PHOTO_FILTER_LABELS } from '../../../../../../shared/constants/event-labels';
import { LOCALE } from '../../../../../../shared/constants/locale';
import { formatFullDate } from '../../../../../../shared/utils/date.util';

@Component({
  selector: 'app-event-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'absolute inset-0 flex flex-col' },
  imports: [Button],
  templateUrl: './event-summary.html',
})
export class EventSummary {
  readonly draft = inject(EventDraftService);
  readonly create = output<void>();
  readonly retryUpload = output<void>();
  readonly isLoading = input(false);
  readonly errorType = input<'event' | 'cover' | null>(null);
  readonly errorMessages = input<string[]>([]);

  filterLabel = computed(() => PHOTO_FILTER_LABELS[this.draft.data().filter]);

  revealLabel = computed(() => {
    const d = this.draft.data().revealDate;
    if (!d) return 'Sin fecha';
    const label = d.toLocaleDateString(LOCALE, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${label} · ${h}:${m}`;
  });

  dateLabel = computed(() => {
    const d = this.draft.data().date;
    return d ? formatFullDate(d) : 'Sin fecha';
  });

  shotsLabel = computed(() => {
    const shots = this.draft.data().shotsPerParticipant;
    return shots === null ? 'Ilimitadas' : `${shots} por persona`;
  });
}
