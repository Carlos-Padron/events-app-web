import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventDateStep } from './event-date-step';

describe('EventDateStep', () => {
  let component: EventDateStep;
  let fixture: ComponentFixture<EventDateStep>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventDateStep],
    }).compileComponents();

    fixture = TestBed.createComponent(EventDateStep);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
