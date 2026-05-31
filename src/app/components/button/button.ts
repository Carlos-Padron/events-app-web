import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button [type]="type()" [disabled]="disabled()" [class]="classes()">
      <ng-content />
    </button>
  `,
})
export class Button {
  variant  = input<ButtonVariant>('primary');
  size     = input<ButtonSize>('md');
  type     = input<'button' | 'submit' | 'reset'>('button');
  fullWidth = input<boolean>(false);
  disabled = input<boolean>(false);

  classes = computed(() => {
    const base = 'rounded-full font-semibold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed';

    const sizes: Record<ButtonSize, string> = {
      sm: 'px-4 py-2 text-xs',
      md: 'px-6 py-3 text-sm',
      lg: 'px-8 py-4 text-base',
    };

    const variants: Record<ButtonVariant, string> = {
      primary:   'bg-ink text-paper hover:bg-ink-soft disabled:opacity-40',
      accent:    'bg-ember text-ink hover:bg-ember-deep disabled:opacity-40',
      secondary: 'bg-paper-warm text-ink border border-bone hover:bg-bone disabled:opacity-40',
      ghost:     'bg-transparent text-ink hover:bg-paper-warm disabled:opacity-40',
      danger:    'bg-transparent text-crimson border border-crimson hover:bg-crimson hover:text-paper disabled:opacity-40',
    };

    return [base, sizes[this.size()], variants[this.variant()], this.fullWidth() ? 'w-full' : '']
      .filter(Boolean)
      .join(' ');
  });
}
