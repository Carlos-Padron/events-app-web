import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="cardClass()">
      <div class="font-display text-xl text-ember leading-none mb-1">{{ value() }}</div>
      <div [class]="labelClass()">{{ label() }}</div>
    </div>
  `,
})
export class StatCard {
  value = input.required<string | number>();
  label = input.required<string>();
  dark  = input<boolean>(false);

  cardClass = computed(() =>
    this.dark()
      ? 'bg-ink border border-paper/10 rounded-xl p-3 text-center'
      : 'bg-paper-warm border border-bone rounded-xl p-3 text-center'
  );

  labelClass = computed(() =>
    `text-[9px] tracking-widest uppercase ${this.dark() ? 'text-paper/50' : 'text-earth'}`
  );
}
