import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventRevealStep } from './event-reveal-step';

describe('EventRevealStep', () => {
  let component: EventRevealStep;
  let fixture: ComponentFixture<EventRevealStep>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventRevealStep],
    }).compileComponents();

    fixture = TestBed.createComponent(EventRevealStep);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
