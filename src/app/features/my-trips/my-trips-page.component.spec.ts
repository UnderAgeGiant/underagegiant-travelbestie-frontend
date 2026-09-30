import { TestBed } from '@angular/core/testing';
import { Component, output } from '@angular/core';
import { provideRouter } from '@angular/router';
import { MyTripsPageComponent } from './my-trips-page.component';
import { MyTripsComponent } from './my-trips.component';
import { NavFacadeService } from '../nav/nav-facade.service';
import { AiPlanViewPayload } from '../../core/models/ai.model';

@Component({ selector: 'app-my-trips', template: '' })
class MyTripsStub { close = output<void>(); openAiPlanning = output<void>(); viewAiPlan = output<AiPlanViewPayload>(); }

describe('MyTripsPageComponent', () => {
  function setup() {
    TestBed.configureTestingModule({
      imports: [MyTripsPageComponent],
      providers: [provideRouter([]), { provide: NavFacadeService, useValue: { openAiPlanning: jest.fn() } }],
    });
    TestBed.overrideComponent(MyTripsPageComponent, { remove: { imports: [MyTripsComponent] }, add: { imports: [MyTripsStub] } });
    const fixture = TestBed.createComponent(MyTripsPageComponent);
    fixture.detectChanges();
    return { stub: fixture.debugElement.children[0].componentInstance as MyTripsStub, facade: TestBed.inject(NavFacadeService) };
  }

  it('openAiPlanning → fresh AI planning', () => {
    const { stub, facade } = setup();
    stub.openAiPlanning.emit();
    expect(facade.openAiPlanning).toHaveBeenCalledWith();
  });

  it('viewAiPlan → AI planning with that past plan', () => {
    const { stub, facade } = setup();
    const payload = { result: {} as any, requestId: 'r1' };
    stub.viewAiPlan.emit(payload);
    expect(facade.openAiPlanning).toHaveBeenCalledWith(payload);
  });
});
