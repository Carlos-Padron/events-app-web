import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import jsQR from 'jsqr';
import { EventService } from '../../services/event.service';
import { EventResponse } from '../../../../shared/interfaces/event.interface';
import { Spinner } from '../../../../components/spinner/spinner';
import { formatMedium } from '../../../../shared/utils/date.util';

@Component({
  selector: 'app-join-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Spinner],
  templateUrl: './join-sheet.html',
})
export class JoinSheet implements OnChanges, OnDestroy {
  @ViewChild('qrVideoEl') private qrVideoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('qrCanvasEl') private qrCanvasRef?: ElementRef<HTMLCanvasElement>;

  private readonly doc = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly eventService = inject(EventService);

  readonly open = input.required<boolean>();
  readonly closed = output<void>();
  readonly joined = output<string>();

  readonly joinMode = signal<'code' | 'qr'>('code');
  readonly joinCode = signal('');
  readonly scanError = signal<string | null>(null);
  readonly scanSuccess = signal(false);

  readonly step = signal<'input' | 'confirm'>('input');
  readonly eventPreview = signal<EventResponse | null>(null);
  readonly previewLoading = signal(false);
  readonly previewError = signal<string | null>(null);
  readonly joinLoading = signal(false);
  readonly joinError = signal<string | null>(null);

  private qrStream: MediaStream | null = null;
  private animFrameId: number | null = null;

  readonly formatMedium = formatMedium;

  ngOnChanges(changes: SimpleChanges): void {
    const openChange = changes['open'];
    if (!openChange) return;
    if (openChange.currentValue === true) {
      this.joinCode.set('');
      this.joinMode.set('code');
      this.scanError.set(null);
      this.scanSuccess.set(false);
      this.step.set('input');
      this.eventPreview.set(null);
      this.previewError.set(null);
      this.joinError.set(null);
    } else {
      this.stopQrCamera();
    }
  }

  ngOnDestroy(): void {
    this.stopQrCamera();
  }

  close(): void {
    this.stopQrCamera();
    this.closed.emit();
  }

  submit(): void {
    const token = this.joinCode();
    if (!token) return;
    this.step.set('confirm');
    this.previewLoading.set(true);
    this.previewError.set(null);
    this.eventPreview.set(null);
    this.eventService.previewJoin(token).subscribe({
      next: (event) => {
        this.eventPreview.set(event);
        this.previewLoading.set(false);
      },
      error: (err) => {
        this.previewError.set(
          err?.error?.message ?? 'No se encontró el film. Verifica el código e intenta de nuevo.',
        );
        this.previewLoading.set(false);
      },
    });
  }

  backToInput(): void {
    this.step.set('input');
    this.eventPreview.set(null);
    this.previewError.set(null);
    this.joinError.set(null);
  }

  confirmJoin(): void {
    const token = this.joinCode();
    if (!token) return;
    this.joinLoading.set(true);
    this.joinError.set(null);
    this.eventService.joinEvent(token).subscribe({
      next: (response) => {
        this.joinLoading.set(false);
        this.joined.emit(response.participant.eventId);
        this.closed.emit();
        this.router.navigate(['/eventos', response.participant.eventId]);
      },
      error: () => {
        this.joinError.set('No se pudo unirse al film. Intenta de nuevo.');
        this.joinLoading.set(false);
      },
    });
  }

  switchMode(mode: 'code' | 'qr'): void {
    if (this.joinMode() === mode) return;
    this.stopQrCamera();
    this.scanError.set(null);
    this.joinMode.set(mode);
    if (mode === 'qr') {
      // Give Angular one tick to render #qrVideoEl before requesting camera.
      setTimeout(() => this.startQrCamera(), 0);
    }
  }

  async startQrCamera(): Promise<void> {
    const media = this.doc.defaultView?.navigator.mediaDevices;
    if (!media) {
      const isSecure = this.doc.defaultView?.isSecureContext ?? false;
      this.scanError.set(
        isSecure
          ? 'Cámara no disponible en este dispositivo.'
          : 'La cámara requiere una conexión segura (HTTPS).',
      );
      return;
    }
    try {
      const stream = await media.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      this.qrStream = stream;
      const video = this.qrVideoRef?.nativeElement;
      if (video) {
        video.srcObject = stream;
        await video.play();
        this.animFrameId = requestAnimationFrame(() => this.scanLoop());
      }
    } catch {
      this.scanError.set('No se pudo acceder a la cámara. Verifica los permisos.');
    }
  }

  stopQrCamera(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.qrStream?.getTracks().forEach((t) => t.stop());
    this.qrStream = null;
  }

  private scanLoop(): void {
    const video = this.qrVideoRef?.nativeElement;
    const canvas = this.qrCanvasRef?.nativeElement;
    if (!video || !canvas || !this.qrStream) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code) {
        this.handleScan(code.data);
        return;
      }
    }

    this.animFrameId = requestAnimationFrame(() => this.scanLoop());
  }

  private handleScan(raw: string): void {
    let token = raw;
    const joinIdx = raw.indexOf('/join/');
    if (joinIdx !== -1) {
      token = raw.slice(joinIdx + '/join/'.length);
    }
    this.stopQrCamera();
    this.joinCode.set(token);
    this.joinMode.set('code');
    this.scanSuccess.set(true);
    setTimeout(() => this.scanSuccess.set(false), 3000);
  }
}
