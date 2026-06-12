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

@Component({
  selector: 'app-event-ready',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex-1 flex flex-col' },
  imports: [QRCodeComponent, Button, Spinner, RouterLink],
  templateUrl: './event-ready.html',
})
export class EventReady implements OnInit, OnDestroy {
  private readonly route        = inject(ActivatedRoute);
  private readonly router       = inject(Router);
  private readonly eventService = inject(EventService);
  private readonly doc          = inject(DOCUMENT);

  readonly event    = signal<EventResponse | null>(null);
  readonly loading  = signal(true);
  readonly copied   = signal(false);
  readonly coverUrl = signal<string | null>(null);

  readonly joinUrl = computed(() => {
    const e = this.event();
    if (!e) return '';
    return `${this.doc.location.origin}/join/${e.invitationToken}`;
  });

  readonly startsLabel = computed(() => {
    const e = this.event();
    if (!e) return '';
    return this.formatDate(e.startsAt);
  });

  readonly endsLabel = computed(() => {
    const e = this.event();
    if (!e) return '';
    return this.formatDate(e.endsAt);
  });

  readonly filterLabel = computed(() => {
    const filter = this.event()?.photoFilter;
    if (!filter) return 'Normal';
    return ({ normal: 'Normal', vintage: 'Vintage', bw: 'B & N' })[filter] ?? 'Normal';
  });

  ngOnInit(): void {
    const state = this.router.lastSuccessfulNavigation()?.extras.state;
    const navEvent  = state?.['event']    as EventResponse | undefined;
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
      next:  (e) => { this.event.set(e); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  ngOnDestroy(): void {
    const url = this.coverUrl();
    if (url) URL.revokeObjectURL(url);
  }

  copyLink(): void {
    const url = this.joinUrl();
    if (!url) return;
    this.doc.defaultView?.navigator.clipboard.writeText(url).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  private formatDate(isoString: string): string {
    const d = new Date(isoString);
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  }
}
