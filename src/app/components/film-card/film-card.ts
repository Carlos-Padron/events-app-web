import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Badge, BadgeStatus } from '../badge/badge';

type FilmGradient = 'crimson-ember' | 'ember-sun' | 'earth';

@Component({
  selector: 'app-film-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Badge],
  template: `
    <div [class]="cardClass()">
      <div [class]="avatarClass()">{{ initial() }}</div>
      <div class="flex-1 min-w-0">
        <div [class]="titleClass()">{{ title() }}</div>
        <div [class]="detailsClass()">{{ details() }}</div>
      </div>
      <app-badge [status]="status()" />
    </div>
  `,
})
export class FilmCard {
  title    = input.required<string>();
  initial  = input.required<string>();
  details  = input.required<string>();
  status   = input.required<BadgeStatus>();
  gradient = input<FilmGradient>('crimson-ember');

  private isLive     = computed(() => this.status() === 'live');
  private isArchived = computed(() => this.status() === 'archived');

  cardClass = computed(() => {
    const base = 'rounded-2xl p-3.5 flex gap-3 items-center border';
    if (this.isLive())     return `${base} bg-ink border-ink`;
    if (this.isArchived()) return `${base} bg-paper-warm border-bone opacity-60`;
    return `${base} bg-paper-warm border-bone`;
  });

  avatarClass = computed(() => {
    const gradients: Record<FilmGradient, string> = {
      'crimson-ember': 'bg-linear-to-br from-crimson to-ember',
      'ember-sun':     'bg-linear-to-br from-ember to-sun',
      'earth':         'bg-earth/20',
    };
    const textColor = this.isLive() ? 'text-paper' : 'text-ink';
    return `w-14 h-14 ${gradients[this.gradient()]} rounded-xl flex items-center justify-center font-display text-xl flex-shrink-0 ${textColor}`;
  });

  titleClass = computed(() =>
    `font-display text-[15px] font-medium ${this.isLive() ? 'text-paper' : 'text-ink'}`
  );

  detailsClass = computed(() =>
    `text-xs ${this.isLive() ? 'text-paper/60' : 'text-earth'}`
  );
}
