import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { CAPTURE_GRADIENTS } from '../../../shared/constants/gradients';
import { MOCK_CAPTURE_NAMES } from '../mocks/captures.mock';

export interface Capture {
  id: string;
  takenBy: string;
  gradient: string;
  isRevealed: boolean;
}

export interface CapturePage {
  captures: Capture[];
  /** Whether more pages remain after the one just returned. */
  hasMore: boolean;
}

const CAPTURES_PER_PAGE = 6;
const TOTAL_MOCK_PAGES = 3;
const MOCK_LATENCY_MS = 600;

@Injectable({ providedIn: 'root' })
export class CaptureService {
  /**
   * Fetches a page (1-based) of captures for an event.
   * Currently mocked — swap the body for a real HTTP call when the API exists;
   * the `CapturePage` contract stays the same.
   */
  getCaptures(_eventId: string, page: number): Observable<CapturePage> {
    const captures = this.generateMockPage(page);
    return of({ captures, hasMore: page < TOTAL_MOCK_PAGES }).pipe(delay(MOCK_LATENCY_MS));
  }

  private generateMockPage(page: number): Capture[] {
    return Array.from({ length: CAPTURES_PER_PAGE }, (_, i) => {
      const idx = (page - 1) * CAPTURES_PER_PAGE + i;
      return {
        id: `mock-${idx}`,
        takenBy: MOCK_CAPTURE_NAMES[idx % MOCK_CAPTURE_NAMES.length],
        gradient: CAPTURE_GRADIENTS[idx % CAPTURE_GRADIENTS.length],
        isRevealed: idx % 4 !== 2,
      };
    });
  }
}
