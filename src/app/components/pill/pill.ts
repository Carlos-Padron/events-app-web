import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-pill',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span [class]="classes()"><ng-content /></span>`,
})
export class Pill {
  selected = input<boolean>(false);

  classes = computed(() => {
    const base = 'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer';
    return this.selected()
      ? `${base} bg-ink text-paper border-ink`
      : `${base} bg-paper-warm text-earth border-bone hover:bg-bone`;
  });
}
