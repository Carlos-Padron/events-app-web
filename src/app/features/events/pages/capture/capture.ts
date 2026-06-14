import {
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
import { EventService } from '../../services/event.service';
import { EventResponse } from '../../../../shared/interfaces/event.interface';
import { buildJoinUrl } from '../../../../shared/utils/join-url.util';

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

  readonly event = signal<EventResponse | null>(null);
  readonly loading = signal(true);
  readonly cameraError = signal<string | null>(null);
  readonly facingMode = signal<'environment' | 'user'>('environment');
  readonly zoom = signal<1 | 2>(1);
  readonly zoomSupported = signal(false);
  readonly shotsTaken = signal(0);
  readonly lastPhotoUrl = signal<string | null>(null);
  readonly showQr = signal(false);

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
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.startCamera();
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
    const prev = this.lastPhotoUrl();
    if (prev) URL.revokeObjectURL(prev);
    // 0.92 JPEG quality balances file size vs. visual fidelity.
    // createObjectURL() produces a temporary in-memory URL for the thumbnail preview.
    canvas.toBlob(
      (blob) => {
        if (blob) this.lastPhotoUrl.set(URL.createObjectURL(blob));
      },
      'image/jpeg',
      0.92,
    );
    this.shotsTaken.update((n) => n + 1);
  }

  goBack(): void {
    this.location.back();
  }
}
