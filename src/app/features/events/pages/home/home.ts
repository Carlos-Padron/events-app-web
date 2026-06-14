import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '../../../../components/button/button';
import { Spinner } from '../../../../components/spinner/spinner';
import { EventService } from '../../services/event.service';
import { EventResponse, EventStatus } from '../../../../shared/interfaces/event.interface';
import {
  EventGradient,
  EVENT_GRADIENTS,
  EVENT_GRADIENT_KEYS,
} from '../../../../shared/constants/gradients';
import { EVENT_STATUS_LABELS } from '../../../../shared/constants/event-labels';
import { formatMedium } from '../../../../shared/utils/date.util';

interface EventItem {
  id: string;
  title: string;
  details: string;
  status: EventStatus;
  gradient: EventGradient;
}

@Component({
  selector: 'app-home-event',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex-1 flex flex-col min-h-0' },
  imports: [RouterLink, Button, Spinner],
  templateUrl: './home.html',
})
export class HomeEvent implements OnInit {
  private readonly eventService = inject(EventService);

  readonly events = signal<EventItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly joinSheetOpen = signal(false);
  readonly joinCode = signal('');

  readonly liveEvents = computed(() => this.events().filter((e) => e.status === 'live'));
  readonly scheduledEvents = computed(() => this.events().filter((e) => e.status === 'scheduled'));
  readonly pastEvents = computed(() =>
    this.events().filter((e) => e.status === 'closed' || e.status === 'archived'),
  );
  readonly hasLive = computed(() => this.liveEvents().length > 0);

  // Exposed for the template's status badges.
  readonly statusLabel = EVENT_STATUS_LABELS;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.eventService.getMyEvents().subscribe({
      next: ({ data }) => {
        this.events.set(
          data.filter((e) => e.status !== 'deleted').map((e, i) => this.toItem(e, i)),
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
    return `relative rounded-2xl overflow-hidden w-full bg-linear-to-br ${EVENT_GRADIENTS[e.gradient]} ${opacity}`;
  }

  private toItem(e: EventResponse, index: number): EventItem {
    return {
      id: e.id,
      title: e.name,
      details: this.buildDetails(e),
      status: e.status,
      gradient: EVENT_GRADIENT_KEYS[index % EVENT_GRADIENT_KEYS.length],
    };
  }

  private buildDetails(e: EventResponse): string {
    const photos = `${e.captureCount} fotos`;
    if (e.status === 'live' || e.status === 'scheduled') {
      return `${e.participantCount} participantes · ${photos}`;
    }
    return `${formatMedium(e.startsAt)} · ${photos}`;
  }
}
