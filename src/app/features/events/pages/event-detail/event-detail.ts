import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
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

interface Capture {
  id:         string;
  takenBy:    string;
  gradient:   string;
  isRevealed: boolean;
}

const GRADIENT_MAP: Record<EventGradient, string> = {
  'crimson-ember': 'from-crimson to-ember',
  'ember-sun':     'from-ember to-sun',
  'earth':         'from-earth to-ink-soft',
};

const CAPTURE_GRADIENTS = [
  'from-crimson to-ember',
  'from-ember to-sun',
  'from-earth to-ink-soft',
  'from-sage to-earth',
  'from-crimson-light to-crimson',
  'from-ember-deep to-earth',
];

const MOCK_NAMES = [
  'Ana García', 'Luis Martínez', 'Carlos Padrón', 'María López',
  'Juan Hernández', 'Sofía Ramírez', 'Pedro Sánchez', 'Laura Torres',
  'Miguel Flores', 'Isabel Castro', 'Diego Morales', 'Valentina Ruiz',
];

const MAX_PAGES          = 3;
const CAPTURES_PER_PAGE  = 6;

@Component({
  selector: 'app-event-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex-1 flex flex-col' },
  imports: [QRCodeComponent, Spinner],
  templateUrl: './event-detail.html',
})
export class EventDetail implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('sentinel', { static: true })
  private readonly sentinel!: ElementRef<HTMLDivElement>;

  private readonly route        = inject(ActivatedRoute);
  private readonly eventService = inject(EventService);
  private readonly location     = inject(Location);
  private readonly doc          = inject(DOCUMENT);

  readonly event           = signal<EventResponse | null>(null);
  readonly loading         = signal(true);
  readonly copied          = signal(false);
  readonly showQr          = signal(false);
  readonly captures        = signal<Capture[]>([]);
  readonly capturesLoading = signal(false);
  readonly hasMore         = signal(true);

  private capturesPage = 0;
  private observer: IntersectionObserver | null = null;

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
      live:      'En vivo',
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

  readonly startsShort = computed(() => this.formatShortDate(this.event()?.startsAt));
  readonly revealShort = computed(() => this.formatShortDate(this.event()?.revealAt));

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.eventService.getEvent(id).subscribe({
      next: (e) => {
        this.event.set(e);
        this.loading.set(false);
        this.loadCaptures();
      },
      error: () => this.loading.set(false),
    });
  }

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && this.event() && this.hasMore() && !this.capturesLoading()) {
          this.loadCaptures();
        }
      },
      { threshold: 0.1 },
    );
    this.observer.observe(this.sentinel.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
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

  private loadCaptures(): void {
    if (this.capturesLoading() || !this.hasMore()) return;
    this.capturesPage++;
    if (this.capturesPage > MAX_PAGES) {
      this.hasMore.set(false);
      return;
    }

    this.capturesLoading.set(true);
    setTimeout(() => {
      const batch = this.generateMockCaptures(this.capturesPage, CAPTURES_PER_PAGE);
      this.captures.update(prev => [...prev, ...batch]);
      this.capturesLoading.set(false);
      if (this.capturesPage >= MAX_PAGES) this.hasMore.set(false);
    }, 600);
  }

  private generateMockCaptures(page: number, count: number): Capture[] {
    return Array.from({ length: count }, (_, i) => {
      const idx = (page - 1) * count + i;
      return {
        id:         `mock-${idx}`,
        takenBy:    MOCK_NAMES[idx % MOCK_NAMES.length],
        gradient:   CAPTURE_GRADIENTS[idx % CAPTURE_GRADIENTS.length],
        isRevealed: idx % 4 !== 2,
      };
    });
  }

  private formatShortDate(isoString?: string): string {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  }
}
