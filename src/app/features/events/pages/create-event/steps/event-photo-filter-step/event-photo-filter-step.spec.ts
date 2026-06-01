import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventPhotoFilterStep } from './event-photo-filter-step';

describe('EventPhotoFilterStep', () => {
  let component: EventPhotoFilterStep;
  let fixture: ComponentFixture<EventPhotoFilterStep>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventPhotoFilterStep],
    }).compileComponents();

    fixture = TestBed.createComponent(EventPhotoFilterStep);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
