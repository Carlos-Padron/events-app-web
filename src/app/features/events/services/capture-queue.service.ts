// Single responsibility: read/write the IndexedDB capture queue and expose
// two signals (pendingCount, failedCount) that drive the UI badge on the shutter.
// All network logic lives in SyncService — this service never touches HTTP.
import { Injectable, inject, signal } from '@angular/core';
import { AppDb, type QueuedCapture, type CaptureStatus } from '../../../db/app-db';

@Injectable({ providedIn: 'root' })
export class CaptureQueueService {
  private readonly db = inject(AppDb);

  // Tracks which event the UI is currently showing. Scopes _refreshCounts() so
  // stale rows from other events never inflate the badge or retry banner.
  private _currentEventId: string | null = null;

  // Counts pending + uploading + uploaded — anything not yet confirmed by the server.
  // Drives the badge on the shutter button so the user knows uploads are in flight.
  readonly pendingCount = signal(0);
  // Counts items that exhausted MAX_ATTEMPTS. Drives the "retry" banner.
  readonly failedCount = signal(0);

  // Called by the capture component when the event loads. Initializes counts from
  // IndexedDB so items queued in a previous session (e.g. offline) are immediately visible.
  setCurrentEvent(eventId: string): void {
    this._currentEventId = eventId;
    this._refreshCounts();
  }

  async enqueue(eventId: string, blob: Blob, metadata: QueuedCapture['metadata']): Promise<void> {
    this._currentEventId = eventId;
    await this.db.captures.add({
      localId: crypto.randomUUID(),
      eventId,
      blob,
      metadata,
      status: 'pending',
      attempts: 0,
    });
    await this._refreshCounts();
  }

  // Dexie's .and() applies a JS-level filter after the indexed WHERE clause.
  // We index on eventId and use .and() for status because Dexie doesn't support
  // compound indexes with anyOf on a second field in a single chain.
  getByStatus(eventId: string, ...statuses: CaptureStatus[]): Promise<QueuedCapture[]> {
    return this.db.captures
      .where('eventId')
      .equals(eventId)
      .and((item) => statuses.includes(item.status))
      .toArray();
  }

  async markUploading(
    id: number,
    slot: { storageKey: string; captureId: string; uploadUrl: string; expiresAt: string },
  ): Promise<void> {
    await this.db.captures.update(id, { status: 'uploading', ...slot });
  }

  // Clear uploadUrl when no longer needed — the presigned URL contains credentials
  // in the query string and should not linger in storage longer than necessary.
  async markUploaded(id: number): Promise<void> {
    await this.db.captures.update(id, { status: 'uploaded', uploadUrl: undefined });
  }

  // Delete rather than update to 'confirmed' — frees the Blob from IndexedDB storage
  // immediately. Keeping a tombstone row would accumulate over time with no benefit.
  async markConfirmed(id: number): Promise<void> {
    await this.db.captures.delete(id);
    await this._refreshCounts();
  }

  async markFailed(id: number, error: string): Promise<void> {
    const item = await this.db.captures.get(id);
    await this.db.captures.update(id, {
      status: 'failed',
      error,
      attempts: (item?.attempts ?? 0) + 1,
    });
    await this._refreshCounts();
  }

  // Resets a failed item back to pending so SyncService will retry it.
  // Clears server-assigned fields — they may be stale if the presigned URL expired.
  async resetForRetry(id: number): Promise<void> {
    await this.db.captures.update(id, {
      status: 'pending',
      error: undefined,
      storageKey: undefined,
      uploadUrl: undefined,
      captureId: undefined,
    });
    await this._refreshCounts();
  }

  // Wipes the entire table and resets UI signals. Called on logout/login so a
  // subsequent user on the same device doesn't inherit a previous session's queue.
  async clearAll(): Promise<void> {
    await this.db.captures.clear();
    this._currentEventId = null;
    this.pendingCount.set(0);
    this.failedCount.set(0);
  }

  // Counts are always scoped to _currentEventId. When null (before any event loads
  // or after clearAll), both signals are zeroed rather than querying the full table.
  private async _refreshCounts(): Promise<void> {
    const eid = this._currentEventId;
    if (!eid) {
      this.pendingCount.set(0);
      this.failedCount.set(0);
      return;
    }
    this.pendingCount.set(
      await this.db.captures
        .where('eventId')
        .equals(eid)
        .and((i) => ['pending', 'uploading', 'uploaded'].includes(i.status))
        .count(),
    );
    this.failedCount.set(
      await this.db.captures
        .where('eventId')
        .equals(eid)
        .and((i) => i.status === 'failed')
        .count(),
    );
  }
}
