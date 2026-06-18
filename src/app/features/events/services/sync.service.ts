// Orchestrates the 3-step upload cycle for queued captures:
//   1. POST /upload-urls  → reserve presigned R2 slots for a batch
//   2. PUT {uploadUrl}    → stream the JPEG blob directly to Cloudflare R2
//   3. POST /confirm-batch → tell the backend which storageKeys landed successfully
//
// The service is a singleton. It does not hold per-event state beyond _eventId,
// which is set by trigger() and updated on each call.
import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { fromEvent, filter, firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CaptureQueueService } from './capture-queue.service';
import { API_ENDPOINTS } from '../../../shared/constants/api-endpoints';
import type { QueuedCapture } from '../../../db/app-db';

const MAX_ATTEMPTS = 3; // After 3 failures an item stays 'failed' until the user taps Retry.
const BATCH_SIZE = 20; // Max items per /upload-urls or /confirm-batch call.
const MAX_CONCURRENT = 3; // Max simultaneous R2 PUTs — avoids saturating mobile connections.

interface UploadSlot {
  uploadUrl: string;
  storageKey: string;
  captureId: string;
  expiresAt: string;
}

interface ConfirmResult {
  storageKey: string;
  success: boolean;
  capture?: { id: string };
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class SyncService {
  private readonly http = inject(HttpClient);
  private readonly queue = inject(CaptureQueueService);
  // Use inject(DOCUMENT) for browser globals — consistent with the rest of the codebase
  // and avoids bare 'window'/'document' references that break in non-browser contexts.
  private readonly doc = inject(DOCUMENT);

  readonly syncing = signal(false);
  // Null until the first trigger() call. _run() is a no-op while null, so the
  // constructor-level event subscriptions below are safe before any event is loaded.
  private _eventId: string | null = null;

  constructor() {
    const win = this.doc.defaultView;
    // Resume sync automatically when the device comes back online.
    if (win) {
      fromEvent(win, 'online').subscribe(() => this._run());
    }
    // Resume sync when the user tabs back to the app. Handles the case where photos
    // were captured, the app went to background mid-upload, and the user returns.
    fromEvent(this.doc, 'visibilitychange')
      .pipe(filter(() => this.doc.visibilityState === 'visible'))
      .subscribe(() => this._run());
  }

  // Called from the capture component after each photo and on tab-focus.
  // Sets the active event so the background listeners above know what to sync.
  trigger(eventId: string): void {
    this._eventId = eventId;
    this._run();
  }

  private async _run(): Promise<void> {
    // Guard: skip if offline, already running, or no event context yet.
    if (!navigator.onLine || this.syncing() || !this._eventId) return;
    this.syncing.set(true);
    const eventId = this._eventId;
    try {
      await this._resetRetryable(eventId);
      await this._uploadPending(eventId);
      await this._confirmUploaded(eventId);
    } catch {
      // Individual item errors are already stored in IndexedDB via markFailed().
      // This catch handles unexpected structural failures — items remain in the queue
      // and will be retried on the next trigger/online/visibilitychange event.
    } finally {
      this.syncing.set(false);
    }
  }

  // Move failed items with remaining attempts back to 'pending' so _uploadPending picks them up.
  // Items at MAX_ATTEMPTS stay 'failed' and require an explicit user retry (retryFailed()).
  private async _resetRetryable(eventId: string): Promise<void> {
    const failed = await this.queue.getByStatus(eventId, 'failed');
    const retryable = failed.filter((i) => i.attempts < MAX_ATTEMPTS);
    await Promise.all(retryable.map((i) => this.queue.resetForRetry(i.id!)));
  }

  private async _uploadPending(eventId: string): Promise<void> {
    const pending = await this.queue.getByStatus(eventId, 'pending');
    if (!pending.length) return;

    for (const batch of _chunk(pending, BATCH_SIZE)) {
      // Step 1: reserve presigned upload slots for the whole batch in one call.
      // If this fails (e.g. SHOTS_EXHAUSTED, EVENT_NOT_LIVE), mark the entire batch failed —
      // we have no URLs to proceed with.
      let slots: UploadSlot[];
      try {
        slots = await firstValueFrom(
          this.http.post<UploadSlot[]>(
            `${environment.API_ENDPOINT}${API_ENDPOINTS.captures.uploadUrls(eventId)}`,
            { count: batch.length },
          ),
        );
      } catch (err: unknown) {
        const msg =
          (err as { error?: { message?: string } })?.error?.message ?? 'UPLOAD_URL_FAILED';
        await Promise.all(batch.map((i) => this.queue.markFailed(i.id!, msg)));
        continue;
      }

      // Step 2: write server-assigned slot data into each queue item before uploading,
      // so a crash mid-upload leaves the item in 'uploading' with its storageKey intact.
      await Promise.all(
        batch.map((item, idx) =>
          this.queue.markUploading(item.id!, {
            storageKey: slots[idx].storageKey,
            captureId: slots[idx].captureId,
            uploadUrl: slots[idx].uploadUrl,
            expiresAt: slots[idx].expiresAt,
          }),
        ),
      );

      // Step 3: PUT blobs directly to R2, capped at MAX_CONCURRENT parallel requests.
      // We use fetch() rather than HttpClient intentionally: Angular's authInterceptor
      // adds 'Authorization: Bearer ...' to every HttpClient request whose URL starts
      // with environment.API_ENDPOINT. R2 presigned URLs are fully-qualified external
      // URLs — they would never match — but using fetch() makes the guarantee explicit
      // and removes any risk of accidentally leaking the JWT to Cloudflare.
      await _pLimit(
        MAX_CONCURRENT,
        batch.map((item, idx) => async () => {
          try {
            const res = await fetch(slots[idx].uploadUrl, {
              method: 'PUT',
              body: item.blob,
              headers: { 'Content-Type': item.metadata.mimeType },
            });
            if (!res.ok) throw new Error(`R2 ${res.status}`);
            await this.queue.markUploaded(item.id!);
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'PUT_FAILED';
            await this.queue.markFailed(item.id!, msg);
          }
        }),
      );
    }
  }

  private async _confirmUploaded(eventId: string): Promise<void> {
    const uploaded = await this.queue.getByStatus(eventId, 'uploaded');
    if (!uploaded.length) return;

    for (const batch of _chunk(uploaded, BATCH_SIZE)) {
      let results: ConfirmResult[];
      try {
        results = await firstValueFrom(
          this.http.post<ConfirmResult[]>(
            `${environment.API_ENDPOINT}${API_ENDPOINTS.captures.confirmBatch(eventId)}`,
            { captures: batch.map(_toConfirmDto) },
          ),
        );
      } catch {
        // Network failure during confirm — items stay 'uploaded', next sync retries.
        continue;
      }

      await Promise.all(
        batch.map((item, i) =>
          results[i].success
            ? this.queue.markConfirmed(item.id!) // deletes the row + frees the blob
            : this.queue.markFailed(item.id!, results[i].error ?? 'CONFIRM_FAILED'),
        ),
      );
    }
  }
}

function _toConfirmDto(item: QueuedCapture) {
  return {
    storageKey: item.storageKey,
    mediaType: item.metadata.mediaType,
    capturedAt: item.metadata.capturedAt, // local time, no Z — backend applies event timezone
  };
}

function _chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

// Runs tasks with a maximum concurrency limit.
// The self-referencing pattern (const p = task().finally(() => active.delete(p)))
// works because the arrow function captures 'p' by reference, not by value.
// When the promise settles, it removes itself from the Set, opening a slot for the next task.
async function _pLimit(concurrency: number, tasks: (() => Promise<void>)[]): Promise<void> {
  const active = new Set<Promise<void>>();
  for (const task of tasks) {
    const p = task().finally(() => active.delete(p));
    active.add(p);
    if (active.size >= concurrency) await Promise.race(active);
  }
  await Promise.all(active);
}
