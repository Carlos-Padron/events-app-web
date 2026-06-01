import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventParticipantsConfiguration } from './event-participants-configuration';

describe('EventParticipantsConfiguration', () => {
  let component: EventParticipantsConfiguration;
  let fixture: ComponentFixture<EventParticipantsConfiguration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventParticipantsConfiguration],
    }).compileComponents();

    fixture = TestBed.createComponent(EventParticipantsConfiguration);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
