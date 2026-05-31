import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      @if (current() !== null || total() !== null) {
        <div class="flex justify-between items-center mb-1">
          <span class="text-xs text-earth">{{ value() }}%</span>
          @if (current() !== null && total() !== null) {
            <span class="font-display text-sm text-earth">
              <strong class="text-ink">{{ current() }}</strong>/{{ total() }}
            </span>
          }
        </div>
      }
      <div
        class="h-1 bg-bone rounded-full overflow-hidden"
        role="progressbar"
        [attr.aria-valuenow]="value()"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div [class]="barClass()" [style.width.%]="value()"></div>
      </div>
    </div>
  `,
})
export class Progress {
  value   = input.required<number>();
  total   = input<number | null>(null);
  current = input<number | null>(null);

  barClass = computed(() =>
    `h-full rounded-full ${this.value() >= 100 ? 'bg-sage' : 'bg-ember'}`
  );
}
