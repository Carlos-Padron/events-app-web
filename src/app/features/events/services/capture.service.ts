import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../shared/constants/api-endpoints';
import { CaptureResponse } from '../../../shared/interfaces/capture.interface';
import { PaginatedResponse } from '../../../shared/interfaces/event.interface';

export interface Capture {
  id: string;
  takenBy: string;
  mediaUrl: string | null;
}

export interface CapturePage {
  captures: Capture[];
  /** Whether more pages remain after the one just returned. */
  hasMore: boolean;
}

const CAPTURES_PER_PAGE = 10;

const API = environment.API_ENDPOINT;

@Injectable({ providedIn: 'root' })
export class CaptureService {
  private readonly http = inject(HttpClient);

  /** Fetches a page (1-based) of captures for an event. */
  getCaptures(eventId: string, page: number, limit = CAPTURES_PER_PAGE): Observable<CapturePage> {
    const params = { page: String(page), limit: String(limit) };
    return this.http
      .get<PaginatedResponse<CaptureResponse>>(`${API}${API_ENDPOINTS.captures.list(eventId)}`, {
        params,
      })
      .pipe(
        map((res) => ({
          captures: res.data.map((c) => ({ id: c.id, takenBy: c.takenBy, mediaUrl: c.mediaUrl })),
          hasMore: res.page < res.totalPages,
        })),
      );
  }
}
