// Dexie wraps IndexedDB with a typed, promise-based API. IndexedDB is the only
// browser storage that can hold Blobs, survives page refreshes, and works offline —
// making it the right choice for the capture queue over localStorage or memory.
import Dexie, { type Table } from 'dexie';

export type CaptureStatus = 'pending' | 'uploading' | 'uploaded' | 'confirmed' | 'failed';

export interface QueuedCapture {
  // Auto-incremented by Dexie — required so update()/delete() can address rows by key.
  id?: number;
  // Device-side UUID generated at capture time. Stable across retries.
  localId: string;
  eventId: string;
  // Raw JPEG bytes. Kept in IndexedDB until the server confirms the upload,
  // then deleted immediately to free device storage.
  blob: Blob;
  // Snapshot of dimensions, size, and timestamp taken at capture time.
  // capturedAt is LOCAL time with no 'Z' suffix — the backend converts to UTC
  // using the event's timezone via fromZonedTime(). Sending UTC would shift it twice.
  metadata: {
    mediaType: 'image';
    mimeType: 'image/jpeg';
    width: number;
    height: number;
    sizeBytes: number;
    capturedAt: string; // 'YYYY-MM-DDTHH:mm:ss' — no Z, no offset
    filterPreset?: string;
  };
  // State machine: pending → uploading → uploaded → (deleted on confirmed)
  //                                    ↘ failed (if attempts < 3, resets to pending)
  status: CaptureStatus;
  // Filled in by the server when upload slots are reserved (/upload-urls).
  storageKey?: string;
  captureId?: string;
  uploadUrl?: string; // Cleared after PUT succeeds to free memory.
  expiresAt?: string; // ISO — if past, slot must be re-requested before retrying PUT.
  error?: string;
  // Incremented on each failure. Stops retrying at MAX_ATTEMPTS (3).
  attempts: number;
}

export class AppDb extends Dexie {
  captures!: Table<QueuedCapture, number>;

  constructor() {
    super('axcan-events-v1');
    // Only indexed fields are listed here — blob/metadata are stored but not queryable
    // by index. Dexie stores the full object regardless; the index just speeds up WHERE clauses.
    this.version(1).stores({
      captures: '++id, localId, eventId, status',
    });
  }
}

// Singleton — Dexie opens one IndexedDB connection per instance. Multiple instances
// for the same DB name would throw "database is already open". Provided via DI in app.config.ts
// so services can inject AppDb without constructing a second connection.
export const appDb = new AppDb();
