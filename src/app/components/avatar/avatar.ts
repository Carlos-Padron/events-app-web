import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type AvatarSize  = 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type AvatarColor = 'ember' | 'sage' | 'crimson' | 'sun' | 'earth' | 'gradient';

@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div [class]="classes()">{{ initial() }}</div>`,
})
export class Avatar {
  initial = input.required<string>();
  size    = input<AvatarSize>('md');
  color   = input<AvatarColor>('ember');

  classes = computed(() => {
    const sizes: Record<AvatarSize, string> = {
      sm:  'w-8 h-8 text-xs',
      md:  'w-10 h-10 text-sm',
      lg:  'w-12 h-12 text-sm',
      xl:  'w-14 h-14 text-base',
      '2xl': 'w-[72px] h-[72px] font-display text-3xl shadow-lg',
    };

    const colors: Record<AvatarColor, string> = {
      ember:    'bg-ember text-ink',
      sage:     'bg-sage text-ink',
      crimson:  'bg-crimson text-paper',
      sun:      'bg-sun text-ink',
      earth:    'bg-earth text-paper',
      gradient: 'bg-gradient-to-br from-ember to-crimson text-paper',
    };

    return `rounded-full flex items-center justify-center font-semibold ${sizes[this.size()]} ${colors[this.color()]}`;
  });
}
