import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Button } from '../../../../components/button/button';
import { EventDraftService } from './event-draft.service';
import { EventService } from '../../services/event.service';
import { EventNameStep } from './steps/event-name-step/event-name-step';
import { EventDateStep } from './steps/event-date-step/event-date-step';
import { EventRevealStep } from './steps/event-reveal-step/event-reveal-step';
import { EventCoverStep } from './steps/event-cover-step/event-cover-step';
import { EventPhotoFilterStep } from './steps/event-photo-filter-step/event-photo-filter-step';
import { EventParticipantsConfiguration } from "./steps/event-participants-configuration/event-participants-configuration";
import { EventSummary } from "./steps/event-summary/event-summary";

@Component({
  selector: 'app-create',
  host: { class: 'flex-1 flex flex-col' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [EventDraftService],
  imports: [
    Button,
    EventNameStep,
    EventDateStep,
    EventRevealStep,
    EventPhotoFilterStep,
    EventCoverStep,
    EventParticipantsConfiguration,
    EventSummary,
  ],
  templateUrl: './create-event.html',
})
export class CreateEvent {
  private readonly draft        = inject(EventDraftService);
  readonly eventService         = inject(EventService);
  private readonly router       = inject(Router);

  readonly totalSteps  = 7;
  readonly stepsArray  = Array.from({ length: this.totalSteps }, (_, i) => i + 1);

  readonly currentStep    = signal(1);
  readonly submitting     = signal(false);
  // 'event' = POST /event failed (nothing was created)
  // 'cover' = event was created but cover upload failed (retry upload only)
  readonly submitErrorType = signal<'event' | 'cover' | null>(null);

  readonly isLastStep = computed(() => this.currentStep() === this.totalSteps);

  readonly canProceed = computed(() => {
    switch (this.currentStep()) {
      case 1:
        return this.draft.data().name.trim().length > 0;

      case 2: {
        const date = this.draft.data().date;
        return date !== null && date > new Date();
      }

      case 3: {
        const reveal = this.draft.data().revealDate;
        if (!reveal) return false;
        const event = this.draft.data().date;
        return !event || reveal > event;
      }

      default: return true;
    }
  });

  next(): void {
    if (!this.canProceed()) return;
    if (this.currentStep() < this.totalSteps) {
      this.currentStep.update((s) => s + 1);
    }
  }

  back(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update((s) => s - 1);
    }
  }

  submit(): void {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.submitErrorType.set(null);

    this.eventService.create(this.draft.data()).subscribe({
      next:  (event) => this.router.navigate(['/eventos', event.id, 'listo'], {
        state: { event, coverFile: this.draft.data().coverFile ?? undefined },
      }),
      error: () => {
        this.submitting.set(false);
        // If pendingCoverUpload is set the event was created — only the cover failed.
        // If it's null the event creation itself failed.
        this.submitErrorType.set(
          this.eventService.pendingCoverUpload() ? 'cover' : 'event'
        );
      },
    });
  }

  retryUpload(): void {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.submitErrorType.set(null);

    const pendingId = this.eventService.pendingCoverUpload()?.eventId;
    this.eventService.retryCoverUpload().subscribe({
      next:  () => this.router.navigate(['/eventos', pendingId, 'listo']),
      error: () => {
        this.submitting.set(false);
        this.submitErrorType.set('cover');
      },
    });
  }

  dotClass(step: number): string {
    if (step === this.currentStep())
      return 'h-2 w-6 rounded-full bg-ember transition-all duration-300';
    if (step < this.currentStep())
      return 'h-2 w-2 rounded-full bg-earth transition-all duration-300';
    return 'h-2 w-2 rounded-full bg-earth transition-all duration-300';
  }
}
