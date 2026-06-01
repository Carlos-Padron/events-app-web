import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '../../../../components/button/button';
import { BadgeStatus } from '../../../../components/badge/badge';

type EventGradient = 'crimson-ember' | 'ember-sun' | 'earth';

interface EventItem {
  id: string;
  title: string;
  details: string;
  status: BadgeStatus;
  gradient: EventGradient;
}

@Component({
  selector: 'app-home-event',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex-1 flex flex-col' },
  imports: [RouterLink, Button],
  templateUrl: './home.html',
})
export class HomeEvent {
  events = signal<EventItem[]>([
    { id: '1', title: 'Boda Ana & Luis',  details: '12 personas · 84 fotos',      status: 'live',     gradient: 'crimson-ember' },
    { id: '2', title: 'París 2025',        details: 'Hace 2 semanas · 142 fotos',  status: 'revealed', gradient: 'ember-sun'     },
    { id: '3', title: 'Cumple de Sofi',    details: 'Expirado · 67 fotos',         status: 'archived', gradient: 'earth'         },
  ]);

  liveEvents     = computed(() => this.events().filter(e => e.status === 'live'));
  pastEvents     = computed(() => this.events().filter(e => e.status !== 'live'));
  hasLive        = computed(() => this.liveEvents().length > 0);

  readonly gradientMap: Record<EventGradient, string> = {
    'crimson-ember': 'from-crimson to-ember',
    'ember-sun':     'from-ember to-sun',
    'earth':         'from-earth to-ink-soft',
  };

  readonly statusLabel: Record<BadgeStatus, string> = {
    live:     'En vivo',
    revealed: 'Revelado',
    draft:    'Borrador',
    archived: 'Archivado',
    expired:  'Expirado',
    popular:  'Popular',
    free:     'Gratis',
  };

  cardClass(e: EventItem): string {
    return `relative rounded-2xl overflow-hidden w-full bg-gradient-to-br ${this.gradientMap[e.gradient]} ${e.status === 'archived' ? 'opacity-60' : ''}`;
  }
}
