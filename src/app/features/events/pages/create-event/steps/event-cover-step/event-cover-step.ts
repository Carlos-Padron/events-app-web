import { ChangeDetectionStrategy, Component, input, OnDestroy, signal } from '@angular/core';
import { Button } from '../../../../../../components/button/button';

@Component({
  selector: 'app-event-cover-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex-1 flex flex-col' },
  imports: [Button],
  templateUrl: './event-cover-step.html',
})
export class EventCoverStep implements OnDestroy {
  title = input<string>('Nombre del evento');
  date  = input<string>('');

  coverUrl = signal<string | null>(null);

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const prev = this.coverUrl();
    if (prev) URL.revokeObjectURL(prev);

    this.coverUrl.set(URL.createObjectURL(file));
  }

  ngOnDestroy(): void {
    const url = this.coverUrl();
    if (url) URL.revokeObjectURL(url);
  }
}
