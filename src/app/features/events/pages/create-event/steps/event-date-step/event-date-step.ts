import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Calendar } from '../../../../../../components/calendar/calendar';

@Component({
  selector: 'app-event-date-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex-1 flex flex-col' },
  imports: [Calendar],
  templateUrl: './event-date-step.html',
})
export class EventDateStep {
  selectedDate = signal<Date | null>(null);

  onDateSelected(date: Date): void {
    this.selectedDate.set(date);
  }
}
