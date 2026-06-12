import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DOCUMENT, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { QRCodeComponent } from 'angularx-qrcode';
import { Spinner } from '../../../../components/spinner/spinner';
import { EventService } from '../../services/event.service';
import { EventResponse, EventStatus } from '../../../../shared/interfaces/event.interface';

type EventGradient = 'crimson-ember' | 'ember-sun' | 'earth';

const GRADIENT_MAP: Record<EventGradient, string> = {
  'crimson-ember': 'from-crimson to-ember',
  'ember-sun':     'from-ember to-sun',
  'earth':         'from-earth to-ink-soft',
};

@Component({
  selector: 'app-event-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex-1 flex flex-col' },
  imports: [QRCodeComponent, Spinner],
  templateUrl: './event-detail.html',
})
export class EventDetail implements OnInit {
  private readonly route        = inject(ActivatedRoute);
  private readonly eventService = inject(EventService);
  private readonly location     = inject(Location);
  private readonly doc          = inject(DOCUMENT);

  readonly event   = signal<EventResponse | null>(null);
  readonly loading = signal(true);
  readonly copied  = signal(false);
  readonly showQr  = signal(false);

  // Use gradient passed from home card while the API call is in flight.
  private readonly gradient = signal<EventGradient>(
    ((this.doc.defaultView?.history.state as { gradient?: EventGradient } | null)?.gradient)
      ?? 'crimson-ember'
  );

  readonly heroClass = computed(() =>
    `relative h-64 bg-gradient-to-br ${GRADIENT_MAP[this.gradient()]}`
  );

  readonly joinUrl = computed(() => {
    const e = this.event();
    return e ? `${this.doc.location.origin}/join/${e.invitationToken}` : '';
  });

  readonly statusLabel = computed(() => {
    const labels: Record<EventStatus, string> = {
      scheduled: 'Programado',
      active:    'Activo',
      closed:    'Cerrado',
      archived:  'Archivado',
      deleted:   'Eliminado',
    };
    const e = this.event();
    return e ? labels[e.status] : '';
  });

  readonly filterLabel = computed(() => {
    const filter = this.event()?.photoFilter;
    if (!filter) return 'Normal';
    return ({ normal: 'Normal', vintage: 'Vintage', bw: 'B & N' })[filter] ?? 'Normal';
  });

  readonly startsLabel = computed(() => this.formatDate(this.event()?.startsAt));
  readonly revealLabel = computed(() => this.formatDate(this.event()?.revealAt));

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.eventService.getEvent(id).subscribe({
      next:  (e) => { this.event.set(e); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  goBack(): void {
    this.location.back();
  }

  copyLink(): void {
    const url = this.joinUrl();
    if (!url) return;
    this.doc.defaultView?.navigator.clipboard.writeText(url).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  share(): void {
    const url  = this.joinUrl();
    const name = this.event()?.name ?? '';
    const nav  = this.doc.defaultView?.navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (nav?.share) {
      nav.share({ title: name, url });
    } else {
      this.copyLink();
    }
  }

  private formatDate(isoString?: string): string {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('es-MX', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }
}
