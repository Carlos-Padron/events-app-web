import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { QRCodeComponent } from 'angularx-qrcode';
import { Button } from '../../../../components/button/button';
import { Spinner } from '../../../../components/spinner/spinner';
import { EventService } from '../../services/event.service';
import { EventResponse } from '../../../../shared/interfaces/event.interface';
import { PHOTO_FILTER_LABELS } from '../../../../shared/constants/event-labels';
import { formatShort } from '../../../../shared/utils/date.util';
import { buildJoinUrl } from '../../../../shared/utils/join-url.util';
import { ClipboardService, COPY_FEEDBACK_MS } from '../../../../common/services/clipboard.service';

@Component({
  selector: 'app-event-ready',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex-1 flex flex-col' },
  imports: [QRCodeComponent, Button, Spinner, RouterLink],
  templateUrl: './event-ready.html',
})
export class EventReady implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventService = inject(EventService);
  private readonly doc = inject(DOCUMENT);
  private readonly clipboard = inject(ClipboardService);

  readonly event = signal<EventResponse | null>(null);
  readonly loading = signal(true);
  readonly copied = signal(false);
  readonly coverUrl = signal<string | null>(null);

  readonly joinUrl = computed(() => {
    const e = this.event();
    return e ? buildJoinUrl(this.doc.location.origin, e.invitationToken) : '';
  });

  readonly startsLabel = computed(() => formatShort(this.event()?.startsAt));
  readonly endsLabel = computed(() => formatShort(this.event()?.endsAt));

  readonly filterLabel = computed(() => {
    const filter = this.event()?.photoFilter;
    return filter ? PHOTO_FILTER_LABELS[filter] : PHOTO_FILTER_LABELS.normal;
  });

  ngOnInit(): void {
    const state = this.router.lastSuccessfulNavigation()?.extras.state;
    const navEvent = state?.['event'] as EventResponse | undefined;
    const coverFile = state?.['coverFile'] as File | undefined;

    if (coverFile) {
      this.coverUrl.set(URL.createObjectURL(coverFile));
    }

    if (navEvent) {
      this.event.set(navEvent);
      this.loading.set(false);
      return;
    }

    const id = this.route.snapshot.paramMap.get('id')!;
    this.eventService.getEvent(id).subscribe({
      next: (e) => {
        this.event.set(e);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  ngOnDestroy(): void {
    const url = this.coverUrl();
    if (url) URL.revokeObjectURL(url);
  }

  copyLink(): void {
    this.clipboard.copy(this.joinUrl()).then((ok) => {
      if (!ok) return;
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), COPY_FEEDBACK_MS);
    });
  }
}
