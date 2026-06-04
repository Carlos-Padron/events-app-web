import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Calendar } from '../../../../../../components/calendar/calendar';
import { EventDraftService } from '../../event-draft.service';

@Component({
  selector: 'app-event-date-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex-1 flex flex-col' },
  imports: [Calendar],
  templateUrl: './event-date-step.html',
})
export class EventDateStep {
  readonly draft   = inject(EventDraftService);
  readonly minDate = new Date();
}
