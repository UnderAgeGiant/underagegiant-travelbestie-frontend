import { TestBed } from '@angular/core/testing';
import { Component, input, output } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { AiPlanningPageComponent } from './ai-planning-page.component';
import { AiPlanningComponent } from './ai-planning.component';
import { ToastService } from '../../core/ui/toast.service';
import { NavFacadeService } from '../nav/nav-facade.service';
import { AiPlanViewPayload } from '../../core/models/ai.model';

@Component({ selector: 'app-ai-planning', template: '' })
class AiPlanningStub {
  initialResult = input<AiPlanViewPayload | null>(null);
  initialCityIds = input<string[]>([]);
  close = output<void>(); planSaved = output<void>(); viewFeaturedTrips = output<void>();
}

describe('AiPlanningPageComponent', () => {
  function setup(state: unknown, query: Record<string, string> = {}) {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [AiPlanningPageComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) } } },
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

  it('?city=paris pre-ticks paris (unknown ids dropped)', () => {
    expect(setup(null, { city: 'paris,not-a-city' }).stub.initialCityIds()).toEqual(['paris']);
  });

  it('viewFeaturedTrips → /first-plan while the gift is available', () => {
    const { stub, router } = setup(null);
    TestBed.inject(AuthService).setTokens('t', { name: 'A', email: 'a@t.com', firstPlanAvailable: true });
    const spy = jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    stub.viewFeaturedTrips.emit();
    expect(spy).toHaveBeenCalledWith('/first-plan');
  });

  it('viewFeaturedTrips → landing at #featured', () => {
    const { stub, router } = setup(null);
    const spy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    stub.viewFeaturedTrips.emit();
    expect(spy).toHaveBeenCalledWith(['/'], { fragment: 'featured' });
  });
});
