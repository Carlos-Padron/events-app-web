import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Button } from '../../../../../../components/button/button';
import { EventDraftService } from '../../event-draft.service';

@Component({
  selector: 'app-event-cover-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex-1 flex flex-col' },
  imports: [Button],
  templateUrl: './event-cover-step.html',
})
export class EventCoverStep {
  readonly draft = inject(EventDraftService);

  dateLabel = computed(() => {
    const d = this.draft.date();
    if (!d) return '';
    return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  });

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.draft.setCover(file);
  }
}
