import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../shared/constants/api-endpoints';
import { EventDraft } from '../pages/create-event/event-draft.service';
import { CreateEventError } from './create-event-error';
import {
  CoverUploadUrlResponse,
  CreateEventDto,
  EventResponse,
  PaginatedResponse,
} from '../../../shared/interfaces/event.interface';

// Shorthand so we don't repeat environment.API_ENDPOINT throughout the file.
const API = environment.API_ENDPOINT;

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly http = inject(HttpClient);

  // Holds the event id and file when a cover upload is in progress or has failed.
  // Set right before the upload chain starts (after the event POST succeeds) so
  // the component can tell the two failure modes apart:
  //   - signal is null  → POST /event itself failed, no event exists yet
  //   - signal is set   → event exists, only the cover upload failed
  readonly pendingCoverUpload = signal<{ eventId: string; file: File } | null>(null);

  /**
   * Creates an event. If the draft includes a cover file the upload is handled
   * automatically in a separate 3-step flow after the event is created.
   * Always resolves with the EventResponse from the initial POST.
   */
  create(draft: EventDraft): Observable<EventResponse> {
    const url = `${API}${API_ENDPOINTS.events.create}`;
    const dto = this.buildDto(draft);

    return this.http.post<EventResponse>(url, dto).pipe(
      // Tag a POST failure as the 'event' phase: nothing was created.
      catchError((err) => throwError(() => new CreateEventError('event', err))),
      // Once the event exists we have its id, which is required to request the
      // R2 upload URL. That's why the cover upload is chained here instead of
      // running in parallel.
      switchMap((event) => {
        if (!draft.coverFile) return of(event);

        // Save before starting so a failure mid-upload leaves the signal set,
        // letting the component know the event exists and only the cover failed.
        this.pendingCoverUpload.set({ eventId: event.id, file: draft.coverFile });

        return this.uploadCover(event.id, draft.coverFile).pipe(
          tap(() => this.pendingCoverUpload.set(null)), // clear on success
          // uploadCover returns void — swap it back to the event so the
          // observable chain keeps the correct return type (EventResponse).
          map(() => event),
          // Tag an upload failure as the 'cover' phase and carry the created event.
          catchError((err) => throwError(() => new CreateEventError('cover', err, event))),
        );
      }),
    );
  }

  getEvent(id: string): Observable<EventResponse> {
    return this.http.get<EventResponse>(`${API}${API_ENDPOINTS.events.get(id)}`);
  }

  getMyEvents(page = 1, limit = 50): Observable<PaginatedResponse<EventResponse>> {
    const params = { page: String(page), limit: String(limit) };
    return this.http.get<PaginatedResponse<EventResponse>>(`${API}${API_ENDPOINTS.events.mine}`, {
      params,
    });
  }

  /**
   * Retries the cover upload using the pending state saved during a failed create().
   * Call this only when pendingCoverUpload() is non-null (i.e. after a cover failure).
   */
  retryCoverUpload(): Observable<void> {
    const pending = this.pendingCoverUpload();
    if (!pending) return throwError(() => new Error('No pending cover upload'));

    return this.uploadCover(pending.eventId, pending.file).pipe(
      tap(() => this.pendingCoverUpload.set(null)),
    );
  }

  /**
   * 3-step cover upload:
   *   1. Ask our API for a signed R2 upload URL.
   *   2. PUT the raw file directly to R2 using that URL.
   *   3. PATCH our API to confirm the upload and trigger server-side processing.
   *
   * Returns void because the caller only needs to know it succeeded.
   * The cover processes asynchronously on the server (coverStatus: 'pending' → 'done').
   */
  private uploadCover(eventId: string, file: File): Observable<void> {
    const uploadUrlEndpoint = `${API}${API_ENDPOINTS.events.coverUploadUrl(eventId)}`;
    const patchEndpoint = `${API}${API_ENDPOINTS.events.patchCover(eventId)}`;

    return this.http.post<CoverUploadUrlResponse>(uploadUrlEndpoint, {}).pipe(
      switchMap(({ uploadUrl, storageKey }) =>
        // PUT goes directly to Cloudflare R2 using the signed URL — NOT to our API.
        // The auth interceptor only attaches the Bearer token to requests that start
        // with environment.API_ENDPOINT, so this R2 request goes out without it.
        this.http
          .put(uploadUrl, file, {
            // headers: new HttpHeaders({ 'Content-Type': file.type }),
          })
          .pipe(
            // Once R2 confirms the file is stored, tell our API to start processing it.
            switchMap(() => this.http.patch(patchEndpoint, { storageKey })),
          ),
      ),
      map(() => void 0), // normalize the PATCH response to void
    );
  }

  /**
   * Maps the wizard draft fields to the API contract.
   * Field names differ because the draft uses UI-friendly names while the API
   * uses a more explicit naming convention.
   */
  private buildDto(draft: EventDraft): CreateEventDto {
    return {
      name: draft.name,
      // Browser timezone (e.g. "America/Mexico_City") tells the server how to
      // interpret startsAt/endsAt, which are sent as local time without a UTC offset.
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      startsAt: this.toLocalDt(draft.date!),
      endsAt: this.toLocalDt(draft.revealDate!),
      photoFilter: draft.filter,
      maxParticipants: draft.participantLimit,
      // The API uses -1 to mean unlimited; the draft uses null.
      maxShotsPerParticipant: draft.shotsPerParticipant ?? -1,
    };
  }

  /**
   * Formats a Date as "YYYY-MM-DDTHH:mm:ss" in local time — no Z, no UTC offset.
   * The server requires this format and uses the timezone field to interpret it.
   * Using toISOString() would give UTC time with a Z suffix, which is incorrect here.
   */
  private toLocalDt(d: Date): string {
    const p = (n: number) => String(n).padStart(2, '0');
    return (
      `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` +
      `T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
    );
  }
}
