import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { Button } from '../../../../components/button/button';
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
  imports: [
    Button,
    EventNameStep,
    EventDateStep,
    EventRevealStep,
    EventPhotoFilterStep,
    EventCoverStep,
    EventParticipantsConfiguration,
    EventSummary
],
  templateUrl: './create-event.html',
})
export class CreateEvent {
  readonly totalSteps = 7;
  readonly stepsArray = Array.from({ length: this.totalSteps }, (_, i) => i + 1);

  currentStep = signal(1);
  isLastStep = computed(() => this.currentStep() === this.totalSteps);

  next(): void {
    if (this.currentStep() < this.totalSteps) {
      this.currentStep.update((s) => s + 1);
    }
  }

  back(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update((s) => s - 1);
    }
  }

  dotClass(step: number): string {
    if (step === this.currentStep())
      return 'h-2 w-6 rounded-full bg-ember transition-all duration-300';
    if (step < this.currentStep())
      return 'h-2 w-2 rounded-full bg-earth transition-all duration-300';
    return 'h-2 w-2 rounded-full bg-earth transition-all duration-300';
  }
}
