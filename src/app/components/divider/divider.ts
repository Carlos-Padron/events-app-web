import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-divider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (text()) {
      <div class="flex items-center gap-3">
        <div class="flex-1 h-px bg-bone"></div>
        <span class="text-[11px] tracking-widest uppercase text-earth">{{ text() }}</span>
        <div class="flex-1 h-px bg-bone"></div>
      </div>
    } @else {
      <hr class="border-bone" />
    }
  `,
})
export class Divider {
  text = input<string>('');
}
