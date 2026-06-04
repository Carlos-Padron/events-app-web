import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Calendar } from '../../../../../../components/calendar/calendar';
import { EventDraftService } from '../../event-draft.service';

@Component({
  selector: 'app-event-reveal-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex-1 flex flex-col' },
  imports: [Calendar],
  templateUrl: './event-reveal-step.html',
})
export class EventRevealStep {
  readonly draft = inject(EventDraftService);

  eventDateLabel = computed(() => this.formatDate(this.draft.date()));
  revealDateLabel = computed(() => this.formatDate(this.draft.revealDate()));

  private formatDate(d: Date | null): string | null {
    if (!d) return null;
    return d.toLocaleDateString('es-MX', {
      weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit',
    });
  }
}
