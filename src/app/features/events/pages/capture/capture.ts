import {
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
import { DOCUMENT, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { fromEvent } from 'rxjs';
import { filter } from 'rxjs/operators';
import { QRCodeComponent } from 'angularx-qrcode';
import { EventService } from '../../services/event.service';
import { EventResponse } from '../../../../shared/interfaces/event.interface';
import { buildJoinUrl } from '../../../../shared/utils/join-url.util';
import { CaptureQueueService } from '../../services/capture-queue.service';
import { SyncService } from '../../services/sync.service';

@Component({
  selector: 'app-capture',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex-1 flex flex-col' },
  imports: [QRCodeComponent],
  templateUrl: './capture.html',
})
export class Capture implements OnInit, OnDestroy {
  @ViewChild('videoEl', { static: true }) private videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasEl', { static: true }) private canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly route = inject(ActivatedRoute);
  private readonly eventService = inject(EventService);
  private readonly location = inject(Location);
  private readonly doc = inject(DOCUMENT);
  private readonly captureQueue = inject(CaptureQueueService);
  private readonly sync = inject(SyncService);
  // DestroyRef lets us use takeUntilDestroyed() outside the constructor,
  // which is required here because the subscription is set up in ngOnInit.
  private readonly destroyRef = inject(DestroyRef);

  readonly event = signal<EventResponse | null>(null);
  readonly loading = signal(true);
  readonly cameraError = signal<string | null>(null);
  readonly facingMode = signal<'environment' | 'user'>('environment');
  readonly zoom = signal<1 | 2>(1);
  readonly zoomSupported = signal(false);
  readonly shotsTaken = signal(0);
  readonly lastPhotoUrl = signal<string | null>(null);
  readonly showQr = signal(false);
  // Aliases into the queue/sync services so the template can read them without
  // going through the service references directly.
  readonly pendingCount = this.captureQueue.pendingCount;
  readonly failedCount = this.captureQueue.failedCount;
  readonly syncing = this.sync.syncing;

  private stream: MediaStream | null = null;

  readonly joinUrl = computed(() => {
    const e = this.event();
    return e ? buildJoinUrl(this.doc.location.origin, e.invitationToken) : '';
  });

  readonly timeLeft = computed(() => {
    const e = this.event();
    if (!e) return '';
    const ms = new Date(e.endsAt).getTime() - Date.now();
    if (ms <= 0) return 'Terminado';
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    return h > 0 ? `${h}h ${m}m restantes` : `${m}m restantes`;
  });

  readonly shotDisplay = computed(() => {
    const current = this.shotsTaken() + 1;
    const max = this.event()?.maxShotsPerParticipant;
    const hasLimit = !!max && max > 0 && max !== -1;
    return {
      prev: current > 1 ? current - 1 : null,
      current,
      next: !hasLimit || current < max! ? current + 1 : null,
    };
  });

  readonly canTakePhoto = computed(() => {
    const max = this.event()?.maxShotsPerParticipant;
    if (!max || max === -1) return true;
    return this.shotsTaken() < max;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.eventService.getEvent(id).subscribe({
      next: (e) => {
        this.event.set(e);
        // Scope the queue's count signals to this event and rehydrate from IndexedDB,
        // so any items queued in a previous session (e.g. while offline) restore the badge.
        this.captureQueue.setCurrentEvent(e.id);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.startCamera();

    // Re-trigger sync when the user returns from another tab or app.
    // SyncService also has a global visibilitychange listener, but that one fires
    // without knowing the current event ID. This one passes ev.id explicitly so
    // the service targets the right event even if trigger() was never called yet.
    fromEvent(this.doc, 'visibilitychange')
      .pipe(
        filter(() => this.doc.visibilityState === 'visible'),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        const ev = this.event();
        if (ev) this.sync.trigger(ev.id);
      });
  }

  ngOnDestroy(): void {
    // Stop all camera tracks to release the hardware back to the OS.
    this.stopCamera();
    // Revoke the object URL to free the in-memory blob from memory.
    const url = this.lastPhotoUrl();
    if (url) URL.revokeObjectURL(url);
  }

  // Native browser MediaDevices API — no npm package needed for camera access.
  // getUserMedia() prompts the user for permission and returns a live MediaStream.
  async startCamera(): Promise<void> {
    this.stopCamera();
    this.cameraError.set(null);
    const media = this.doc.defaultView?.navigator.mediaDevices;
    if (!media) {
      const isSecure = this.doc.defaultView?.isSecureContext ?? false;
      this.cameraError.set(
        isSecure
          ? 'Cámara no disponible en este dispositivo.'
          : 'La cámara requiere una conexión segura (HTTPS).',
      );
      return;
    }
    try {
      const stream = await media.getUserMedia({
        video: { facingMode: this.facingMode() },
        audio: false,
      });
      this.stream = stream;
      // Binding the stream to srcObject makes the <video> element render the live feed.
      this.videoRef.nativeElement.srcObject = stream;

      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as MediaTrackCapabilities & {
        zoom?: { min: number; max: number };
      };
      this.zoomSupported.set(!!capabilities.zoom);
      if (capabilities.zoom) {
        await this.applyZoomConstraint(this.zoom());
      }
    } catch {
      this.cameraError.set('No se pudo acceder a la cámara. Verifica los permisos.');
    }
  }

  stopCamera(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }

  async flipCamera(): Promise<void> {
    this.facingMode.update((f) => (f === 'environment' ? 'user' : 'environment'));
    await this.startCamera();
  }

  async setZoom(value: 1 | 2): Promise<void> {
    this.zoom.set(value);
    await this.applyZoomConstraint(value);
  }

  private async applyZoomConstraint(level: 1 | 2): Promise<void> {
    const track = this.stream?.getVideoTracks()[0];
    if (!track) return;
    const capabilities = track.getCapabilities() as MediaTrackCapabilities & {
      zoom?: { min: number; max: number };
    };
    if (!capabilities.zoom) return;
    const { min, max } = capabilities.zoom;
    // Map 1x → hardware minimum, 2x → clamped 2.0 within the device's range.
    const target = level === 1 ? min : Math.min(2, max);
    await track.applyConstraints({ advanced: [{ zoom: target } as MediaTrackConstraintSet] });
  }

  // Captures the current video frame by drawing it onto an offscreen <canvas>,
  // then exporting as a JPEG blob. There is no native "shutter" browser API.
  takePhoto(): void {
    if (!this.canTakePhoto()) return;
    const video = this.videoRef.nativeElement;
    const canvas = this.canvasRef.nativeElement;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    // Capture prev BEFORE the async gap so we revoke the correct URL.
    // If we read lastPhotoUrl() inside the toBlob callback, the user could have
    // tapped the shutter again by then and we'd revoke the new thumbnail instead.
    const prev = this.lastPhotoUrl();
    // 0.92 JPEG quality balances file size vs. visual fidelity.
    // createObjectURL() produces a temporary in-memory URL for the thumbnail preview.
    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        if (prev) URL.revokeObjectURL(prev);
        this.lastPhotoUrl.set(URL.createObjectURL(blob));

        const ev = this.event()!;
        await this.captureQueue.enqueue(ev.id, blob, {
          mediaType: 'image',
          mimeType: 'image/jpeg',
          width: canvas.width,
          height: canvas.height,
          sizeBytes: blob.size,
          // Local time with no 'Z'. The backend converts to UTC using the event's
          // timezone via fromZonedTime(). Sending UTC would apply the offset twice.
          capturedAt: _formatLocal(new Date()),
        });
        this.sync.trigger(ev.id);
      },
      'image/jpeg',
      0.92,
    );
    // Update counter OUTSIDE the toBlob callback for immediate UI feedback.
    // The async blob encoding can take tens of milliseconds on low-end devices.
    this.shotsTaken.update((n) => n + 1);
  }

  // Resets the failed counter's event context and re-runs the sync loop.
  // Failed items with attempts < MAX_ATTEMPTS will be reset to 'pending' by _resetRetryable().
  retryFailed(): void {
    this.sync.trigger(this.event()!.id);
  }

  goBack(): void {
    this.location.back();
  }
}

// Formats a Date as 'YYYY-MM-DDTHH:mm:ss' with NO timezone suffix.
// The backend expects local time and applies the event's timezone via fromZonedTime().
function _formatLocal(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}` +
    `T${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`
  );
}
