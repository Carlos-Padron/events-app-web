import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventCoverStep } from './event-cover-step';

describe('EventCoverStep', () => {
  let component: EventCoverStep;
  let fixture: ComponentFixture<EventCoverStep>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventCoverStep],
    }).compileComponents();

    fixture = TestBed.createComponent(EventCoverStep);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
