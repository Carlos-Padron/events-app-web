import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type BadgeStatus = 'live' | 'revealed' | 'draft' | 'archived' | 'expired' | 'popular' | 'free';

@Component({
  selector: 'app-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (status() === 'live') {
      <span class="inline-flex items-center gap-1.5 text-[9px] tracking-widest uppercase font-semibold text-sun">
        <span class="w-1.5 h-1.5 bg-sun rounded-full animate-pulse-dot"></span> En vivo
      </span>
    } @else if (status() === 'popular') {
      <span class="bg-ember text-ink text-[9px] tracking-widest uppercase font-semibold px-2 py-0.5 rounded-full">Popular</span>
    } @else if (status() === 'free') {
      <span class="bg-sage text-ink text-[9px] tracking-widest uppercase font-semibold px-2 py-0.5 rounded-full">Gratis</span>
    } @else {
      <span [class]="textClasses()">{{ label() }}</span>
    }
  `,
})
export class Badge {
  status = input.required<BadgeStatus>();

  label = computed(() => {
    const map: Record<BadgeStatus, string> = {
      live:      'En vivo',
      revealed:  'Revelado',
      draft:     'Borrador',
      archived:  'Archivado',
      expired:   'Expirado',
      popular:   'Popular',
      free:      'Gratis',
    };
    return map[this.status()];
  });

  textClasses = computed(() => {
    const colorMap: Record<BadgeStatus, string> = {
      live:     'text-sun',
      revealed: 'text-ember',
      draft:    'text-earth',
      archived: 'text-earth/50',
      expired:  'text-crimson',
      popular:  'text-ink',
      free:     'text-ink',
    };
    return `text-[9px] tracking-widest uppercase font-semibold flex-shrink-0 ${colorMap[this.status()]}`;
  });
}
