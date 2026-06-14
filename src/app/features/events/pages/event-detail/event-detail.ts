import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { QRCodeComponent } from 'angularx-qrcode';
import { Spinner } from '../../../../components/spinner/spinner';
import { EventService } from '../../services/event.service';
import { CaptureService, Capture } from '../../services/capture.service';
import { EventResponse } from '../../../../shared/interfaces/event.interface';
import { EventGradient, EVENT_GRADIENTS } from '../../../../shared/constants/gradients';
import {
  EVENT_STATUS_LABELS,
  PHOTO_FILTER_LABELS,
} from '../../../../shared/constants/event-labels';
import { LOCALE } from '../../../../shared/constants/locale';
import { formatShort } from '../../../../shared/utils/date.util';
import { buildJoinUrl } from '../../../../shared/utils/join-url.util';
import { ClipboardService, COPY_FEEDBACK_MS } from '../../../../common/services/clipboard.service';

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

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventService = inject(EventService);
  private readonly captureService = inject(CaptureService);
  private readonly doc = inject(DOCUMENT);
  private readonly clipboard = inject(ClipboardService);
  private readonly destroyRef = inject(DestroyRef);

  readonly event = signal<EventResponse | null>(null);
  readonly loading = signal(true);
  readonly copied = signal(false);
  readonly showQr = signal(false);
  readonly captureError = signal<string | null>(null);
  readonly captures = signal<Capture[]>([]);
  readonly capturesLoading = signal(false);
  readonly hasMore = signal(true);

  private capturesPage = 0;
  private observer: IntersectionObserver | null = null;

  private readonly gradient = signal<EventGradient>(
    (this.doc.defaultView?.history.state as { gradient?: EventGradient } | null)?.gradient ??
      'crimson-ember',
  );

  readonly heroClass = computed(
    () => `relative h-64 bg-linear-to-br ${EVENT_GRADIENTS[this.gradient()]}`,
  );

  readonly joinUrl = computed(() => {
    const e = this.event();
    return e ? buildJoinUrl(this.doc.location.origin, e.invitationToken) : '';
  });

  readonly statusLabel = computed(() => {
    const e = this.event();
    return e ? EVENT_STATUS_LABELS[e.status] : '';
  });

  readonly filterLabel = computed(() => {
    const filter = this.event()?.photoFilter;
    return filter ? PHOTO_FILTER_LABELS[filter] : PHOTO_FILTER_LABELS.normal;
  });

  readonly startsShort = computed(() => formatShort(this.event()?.startsAt));
  readonly revealShort = computed(() => formatShort(this.event()?.revealAt));

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

  onCapturePress(): void {
    const e = this.event();
    if (!e) return;

    const now = Date.now();
    const startsAt = new Date(e.startsAt).getTime();
    const endsAt = new Date(e.endsAt).getTime();

    let error: string | null = null;

    if (e.status !== 'live') {
      error = 'El film aún no está en curso.';
    } else if (now < startsAt) {
      const when = new Date(e.startsAt).toLocaleString(LOCALE, {
        timeZone: e.timezone,
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
      error = `El film comienza el ${when} (${e.timezone}).`;
    } else if (now > endsAt) {
      const when = new Date(e.endsAt).toLocaleString(LOCALE, {
        timeZone: e.timezone,
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
      error = `El film terminó el ${when}.`;
    }

    if (error) {
      this.captureError.set(error);
      setTimeout(() => this.captureError.set(null), 3000);
      return;
    }

    this.router.navigate(['/eventos', this.route.snapshot.paramMap.get('id'), 'capturar']);
  }

  goBack(): void {
    this.router.navigate(['/eventos']);
  }

  copyLink(): void {
    this.clipboard.copy(this.joinUrl()).then((ok) => {
      if (!ok) return;
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), COPY_FEEDBACK_MS);
    });
  }

  share(): void {
    const url = this.joinUrl();
    const name = this.event()?.name ?? '';
    const nav = this.doc.defaultView?.navigator as Navigator & {
      share?: (d: ShareData) => Promise<void>;
    };
    if (nav?.share) {
      nav.share({ title: name, url });
    } else {
      this.copyLink();
    }
  }

  private loadCaptures(): void {
    const e = this.event();
    if (!e || this.capturesLoading() || !this.hasMore()) return;

    this.capturesLoading.set(true);
    this.captureService
      .getCaptures(e.id, this.capturesPage + 1)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ captures, hasMore }) => {
        this.capturesPage++;
        this.captures.update((prev) => [...prev, ...captures]);
        this.hasMore.set(hasMore);
        this.capturesLoading.set(false);
      });
  }
}
