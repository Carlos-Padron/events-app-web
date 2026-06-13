import { EventResponse } from '../../../shared/interfaces/event.interface';

/** Which stage of EventService.create() failed. */
export type CreateEventPhase = 'event' | 'cover';

/**
 * Thrown by EventService.create() so the caller can tell the two failure modes
 * apart without inspecting service-internal state:
 *   - phase 'event' → the POST /event itself failed; no event exists.
 *   - phase 'cover' → the event was created but the cover upload failed.
 */
export class CreateEventError extends Error {
  constructor(
    readonly phase: CreateEventPhase,
    override readonly cause: unknown,
    readonly event?: EventResponse,
  ) {
    super(`Event creation failed during the "${phase}" phase.`);
    this.name = 'CreateEventError';
  }
}
