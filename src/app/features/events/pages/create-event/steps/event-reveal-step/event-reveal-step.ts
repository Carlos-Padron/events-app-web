import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Calendar } from '../../../../../../components/calendar/calendar';
import { EventDraftService } from '../../event-draft.service';
import { formatDayMonthTime } from '../../../../../../shared/utils/date.util';

@Component({
  selector: 'app-event-reveal-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex-1 flex flex-col' },
  imports: [Calendar],
  templateUrl: './event-reveal-step.html',
})
export class EventRevealStep {
  readonly draft = inject(EventDraftService);

  // Returns null (not '') so the template's `?? '—'` fallback still fires.
  eventDateLabel = computed(() => {
    const d = this.draft.data().date;
    return d ? formatDayMonthTime(d) : null;
  });
  revealDateLabel = computed(() => {
    const d = this.draft.data().revealDate;
    return d ? formatDayMonthTime(d) : null;
  });
}
