import { TestBed } from '@angular/core/testing';
import { Component, input, output } from '@angular/core';
import { Location } from '@angular/common';
import { Router, provideRouter } from '@angular/router';
import { AiPlanningPageComponent } from './ai-planning-page.component';
import { AiPlanningComponent } from './ai-planning.component';
import { ToastService } from '../../core/ui/toast.service';
import { NavFacadeService } from '../nav/nav-facade.service';
import { AiPlanViewPayload } from '../../core/models/ai.model';

@Component({ selector: 'app-ai-planning', template: '' })
class AiPlanningStub {
  initialResult = input<AiPlanViewPayload | null>(null);
  close = output<void>(); planSaved = output<void>(); viewFeaturedTrips = output<void>();
}

describe('AiPlanningPageComponent', () => {
  function setup(state: unknown) {
    TestBed.configureTestingModule({
      imports: [AiPlanningPageComponent],
      providers: [
        provideRouter([]),
        { provide: Location, useValue: { getState: () => state } },
        { provide: NavFacadeService, useValue: { openEditor: jest.fn() } },
      ],
    });
    TestBed.overrideComponent(AiPlanningPageComponent, { remove: { imports: [AiPlanningComponent] }, add: { imports: [AiPlanningStub] } });
    const fixture = TestBed.createComponent(AiPlanningPageComponent);
    fixture.detectChanges();
    return {
      stub: fixture.debugElement.children[0].componentInstance as AiPlanningStub,
      router: TestBed.inject(Router), toast: TestBed.inject(ToastService), facade: TestBed.inject(NavFacadeService),
    };
  }

  it('passes history.state.aiPlanResult through as initialResult', () => {
    const payload = { result: {} as any, requestId: 'r1' };
    expect(setup({ navigationId: 2, aiPlanResult: payload }).stub.initialResult()).toBe(payload);
  });

  it('starts fresh (initialResult null) when there is no state', () => {
    expect(setup(null).stub.initialResult()).toBeNull();
    TestBed.resetTestingModule();
    expect(setup({ navigationId: 1 }).stub.initialResult()).toBeNull();
  });

  it('planSaved → toast + editor', () => {
    const { stub, toast, facade } = setup(null);
    const show = jest.spyOn(toast, 'show');
    stub.planSaved.emit();
    expect(show).toHaveBeenCalledWith('Plan guardado');
    expect(facade.openEditor).toHaveBeenCalled();
  });

  it('viewFeaturedTrips → landing at #featured', () => {
    const { stub, router } = setup(null);
    const spy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    stub.viewFeaturedTrips.emit();
    expect(spy).toHaveBeenCalledWith(['/'], { fragment: 'featured' });
  });
});
