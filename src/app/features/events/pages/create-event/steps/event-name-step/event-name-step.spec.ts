import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventNameStep } from './event-name-step';

describe('EventNameStep', () => {
  let component: EventNameStep;
  let fixture: ComponentFixture<EventNameStep>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventNameStep],
    }).compileComponents();

    fixture = TestBed.createComponent(EventNameStep);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
