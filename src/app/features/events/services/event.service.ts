import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../shared/constants/api-endpoints';
import { EventDraft } from '../pages/create-event/event-draft.service';
import { EventResponse } from '../../../shared/interfaces/event.interface';

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly http      = inject(HttpClient);
  private readonly createUrl = `${environment.API_ENDPOINT}${API_ENDPOINTS.events.create}`;

  create(draft: EventDraft): Observable<EventResponse> {
    const body = new FormData();

    body.append('name',             draft.name);
    body.append('date',             draft.date!.toISOString());
    body.append('revealDate',       draft.revealDate!.toISOString());
    body.append('filter',           draft.filter);
    body.append('participantLimit', String(draft.participantLimit));

    if (draft.shotsPerParticipant !== null) {
      body.append('shotsPerParticipant', String(draft.shotsPerParticipant));
    }

    if (draft.coverFile) {
      body.append('cover', draft.coverFile);
    }

    return this.http.post<EventResponse>(this.createUrl, body);
  }
}
