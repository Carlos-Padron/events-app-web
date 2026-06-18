# Capture Upload — How It Works

Photos taken in the capture page never block the shutter. Every JPEG goes to IndexedDB first, then a background sync loop uploads it to Cloudflare R2 via a 3-step presigned-URL flow. The system is fully offline-capable: photos accumulate while offline and drain automatically when connectivity returns.

---

## Architecture Overview

```
[Shutter tap]
     │
     ▼
canvas.toBlob()  ──►  IndexedDB (status: pending)
                              │
                    [SyncService._run()]
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
       _resetRetryable  _uploadPending  _confirmUploaded
```

Three services collaborate:

| Service | Responsibility |
|---|---|
| `CaptureQueueService` | IndexedDB reads/writes + UI signals |
| `SyncService` | Upload orchestration (3 steps) |
| `AppDb` | Dexie schema + singleton DB connection |

The capture component (`capture.ts`) calls `captureQueue.enqueue()` and `sync.trigger()` after each photo. Everything else is automatic.

---

## Item State Machine

```
[enqueue]
    │
[pending] ──► POST /upload-urls ──► [uploading] ──► PUT R2 OK ──► [uploaded]
                    │                     │                              │
              /upload-urls fails      PUT R2 fails               POST /confirm-batch
                    │                     │                         success=true
              [failed]              [failed]                       [confirmed → deleted]
           if attempts < 3       if attempts < 3                    success=false
           reset to pending      reset to pending                   [failed]
```

Items that fail 3 times stay `failed` until the user taps **Retry**, which calls `sync.trigger()` → `_resetRetryable()` resets any item with `attempts < MAX_ATTEMPTS` back to `pending`.

---

## File Map

```
src/app/
  db/
    app-db.ts                              ← Dexie schema, QueuedCapture interface, AppDb singleton
  features/events/
    services/
      capture-queue.service.ts            ← IndexedDB state machine + pendingCount/failedCount signals
      sync.service.ts                     ← 3-step upload orchestration
    pages/
      capture/
        capture.ts                        ← Wires enqueue + trigger + retry + visibility listener
        capture.html                      ← Pending badge on shutter, failed banner above controls
  shared/constants/
    api-endpoints.ts                      ← captures.uploadUrls / captures.confirmBatch added
  app.config.ts                           ← AppDb registered as { provide: AppDb, useValue: appDb }
```

---

## The 3-Step Upload Flow

### Step 1 — Reserve upload slots

`POST /api/event/:eventId/captures/upload-urls`

```json
// Request
{ "count": 3 }

// Response
[
  {
    "uploadUrl": "https://<bucket>.r2.cloudflarestorage.com/...?X-Amz-Signature=...",
    "storageKey": "events/<eventId>/captures/<captureId>/raw",
    "captureId": "<uuid>",
    "expiresAt": "2026-06-17T23:00:00.000Z"
  }
]
```

The backend reserves a slot for each photo in a single round-trip. If this call fails (e.g. `SHOTS_EXHAUSTED`, `EVENT_NOT_LIVE`), all items in the batch are marked `failed` — we cannot proceed without URLs.

**Possible error codes:** `NOT_A_PARTICIPANT` (403), `EVENT_NOT_LIVE` (422), `SHOTS_EXHAUSTED` (422).

### Step 2 — PUT blob to Cloudflare R2

```
PUT {uploadUrl}
Content-Type: image/jpeg
[binary blob body]
```

- Executed with `fetch()`, **not** `HttpClient`, to guarantee Angular's auth interceptor never attaches `Authorization: Bearer ...` to the R2 URL. R2 authenticates via the query-string signature; a JWT header would be at best ignored, at worst rejected.
- Up to `MAX_CONCURRENT = 3` PUTs run in parallel via `_pLimit()`.
- A non-2xx response from R2 is treated as a failure and increments `attempts`.

### Step 3 — Confirm the batch

`POST /api/event/:eventId/captures/confirm-batch`

```json
// Request
{
  "captures": [
    {
      "storageKey": "events/.../raw",
      "mediaType": "image",
      "mimeType": "image/jpeg",
      "capturedAt": "2026-06-17T22:30:00",
      "width": 1920,
      "height": 1080,
      "sizeBytes": 204800
    }
  ]
}

// Response — one result per capture, same order
[
  { "storageKey": "...", "success": true,  "capture": { "id": "..." } },
  { "storageKey": "...", "success": false, "error": "SHOTS_EXHAUSTED" }
]
```

Items where `success: true` are deleted from IndexedDB (freeing the blob). Items where `success: false` are marked `failed`.

---

## capturedAt — Why No "Z"

`capturedAt` is always formatted as `YYYY-MM-DDTHH:mm:ss` with no timezone suffix.

The backend stores events with a `timezone` field (e.g. `"America/Mexico_City"`). When it receives `capturedAt`, it calls `fromZonedTime(capturedAt, event.timezone)` to convert the local time to UTC before persisting.

If the frontend sent a UTC timestamp (with `Z`), `fromZonedTime` would apply the offset a second time and produce a wrong time. Sending the raw local time lets the backend be the single source of truth for timezone conversion.

---

## Why IndexedDB (Dexie)

| Need | Why IndexedDB wins |
|---|---|
| Store Blobs | `localStorage` and `sessionStorage` are string-only |
| Survive page refresh | Memory is wiped on navigate; IndexedDB persists |
| Work offline | Writes succeed even with no network |
| Query by status | Dexie indexes allow fast `WHERE status = 'pending'` scans |

`AppDb` is a singleton (`export const appDb = new AppDb()`) registered via `{ provide: AppDb, useValue: appDb }` in `app.config.ts`. Multiple `new AppDb()` instances for the same database name would throw `"database is already open"` in Dexie.

---

## Auto-Sync Triggers

SyncService subscribes to two browser events in its constructor:

| Event | Why |
|---|---|
| `window online` | Device regained connectivity — drain anything that queued while offline |
| `document visibilitychange` (→ visible) | User returned from another tab/app mid-upload |

The capture component adds a **third** `visibilitychange` listener that calls `sync.trigger(ev.id)` explicitly. This is not redundant: SyncService's built-in listener fires `_run()` using whatever `_eventId` was last set, but if the component just mounted and `trigger()` was never called, `_eventId` is `null` and the run is a no-op. The component listener passes the current event ID to cover that gap.

---

## UI Signals

| Signal | Source | Template use |
|---|---|---|
| `pendingCount` | `CaptureQueueService` | Badge on shutter button; shows `↑` while syncing |
| `failedCount` | `CaptureQueueService` | Red banner above controls with "Retry" button |
| `syncing` | `SyncService` | Swaps the pending number for `↑` arrow while upload is running |

---

## Verification Checklist

1. **Happy path (online):** Take a photo → `pendingCount` badge appears briefly → disappears after sync completes. Check DevTools Network for the 3 calls and DevTools Application > IndexedDB to confirm the row was deleted.

2. **Offline capture:** Disable network in DevTools → take 5 photos → `pendingCount = 5` → re-enable network → all 5 sync automatically.

3. **Retry after failure:** Block R2 requests in DevTools Network → take a photo → it fails 3 times → `failedCount = 1` banner appears → tap "Retry" → syncs successfully.

4. **Shot limit:** Take photos until `SHOTS_EXHAUSTED` — queued items are marked `failed` with that error message visible in IndexedDB.

5. **No auth leak:** In DevTools Network, select the R2 PUT request and confirm there is **no `Authorization` header** in the request headers.

6. **Memory cleanup:** After a successful sync, DevTools Application > IndexedDB > `axcan-events-v1` > `captures` table should be empty.

7. **`capturedAt` format:** In the `/confirm-batch` request payload (DevTools Network), the `capturedAt` field should be `YYYY-MM-DDTHH:mm:ss` with no `Z` or `+00:00`.
