import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '../../../../components/button/button';
import { Spinner } from '../../../../components/spinner/spinner';
import { EventService } from '../../services/event.service';
import { EventResponse, EventStatus } from '../../../../shared/interfaces/event.interface';

type EventGradient = 'crimson-ember' | 'ember-sun' | 'earth';

interface EventItem {
  id:       string;
  title:    string;
  details:  string;
  status:   EventStatus;
  gradient: EventGradient;
}

const GRADIENTS: EventGradient[] = ['crimson-ember', 'ember-sun', 'earth'];

@Component({
  selector: 'app-home-event',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex-1 flex flex-col' },
  imports: [RouterLink, Button, Spinner],
  templateUrl: './home.html',
})
export class HomeEvent implements OnInit {
  private readonly eventService = inject(EventService);

  readonly events  = signal<EventItem[]>([]);
  readonly loading = signal(true);
  readonly error   = signal(false);

  readonly liveEvents = computed(() =>
    this.events().filter(e => e.status === 'active' || e.status === 'scheduled')
  );
  readonly pastEvents = computed(() =>
    this.events().filter(e => e.status === 'closed' || e.status === 'archived')
  );
  readonly hasLive = computed(() => this.liveEvents().length > 0);

  readonly gradientMap: Record<EventGradient, string> = {
    'crimson-ember': 'from-crimson to-ember',
    'ember-sun':     'from-ember to-sun',
    'earth':         'from-earth to-ink-soft',
  };

  readonly statusLabel: Record<EventStatus, string> = {
    scheduled: 'Programado',
    active:    'En vivo',
    closed:    'Cerrado',
    archived:  'Archivado',
    deleted:   'Eliminado',
  };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.eventService.getMyEvents().subscribe({
      next: ({ data }) => {
        this.events.set(data
          .filter(e => e.status !== 'deleted')
          .map((e, i) => this.toItem(e, i))
        );
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  cardClass(e: EventItem): string {
    const opacity = e.status === 'archived' ? 'opacity-60' : '';
    return `relative rounded-2xl overflow-hidden w-full bg-gradient-to-br ${this.gradientMap[e.gradient]} ${opacity}`;
  }

  private toItem(e: EventResponse, index: number): EventItem {
    return {
      id:       e.id,
      title:    e.name,
      details:  this.buildDetails(e),
      status:   e.status,
      gradient: GRADIENTS[index % GRADIENTS.length],
    };
  }

  private buildDetails(e: EventResponse): string {
    const photos = `${e.captureCount} fotos`;
    if (e.status === 'active' || e.status === 'scheduled') {
      return `${e.participantCount} participantes · ${photos}`;
    }
    const date = new Date(e.startsAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${date} · ${photos}`;
  }
}
