import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Input } from '../../../../../../components/input/input';
import { EventDraftService } from '../../event-draft.service';

@Component({
  selector: 'app-event-name-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex-1 flex flex-col' },
  imports: [Input, ReactiveFormsModule],
  templateUrl: './event-name-step.html',
})
export class EventNameStep {
  private readonly draft = inject(EventDraftService);

  readonly nameControl = new FormControl(this.draft.name(), { nonNullable: true });

  constructor() {
    this.nameControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(v => this.draft.name.set(v));
  }
}
