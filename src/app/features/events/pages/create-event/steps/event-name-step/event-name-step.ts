import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Input } from '../../../../../../components/input/input';

@Component({
  selector: 'app-event-name-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex-1 flex flex-col' },
  imports: [Input],
  templateUrl: './event-name-step.html',
})
export class EventNameStep {}
