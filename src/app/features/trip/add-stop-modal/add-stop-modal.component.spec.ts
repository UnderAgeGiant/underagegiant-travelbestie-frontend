import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { AddStopModalComponent } from './add-stop-modal.component';
import { TripService } from '../trip.service';
import { City } from '../../../core/models/city.model';
import { AuthService } from '../../../core/auth/auth.service';
import { FirstPlanService } from '../../../core/first-plan/first-plan.service';
import { of } from 'rxjs';

const PARIS: City  = { id: 'paris',  name: 'Paris',  country: 'France', flag: '🇫🇷', region: 'europe' };
const LONDON: City = { id: 'london', name: 'London', country: 'United Kingdom', flag: '🇬🇧', region: 'europe' };

describe('AddStopModalComponent — default check-in date', () => {
  let trip: TripService;
  let component: AddStopModalComponent;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [AddStopModalComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    trip = TestBed.inject(TripService);
    component = TestBed.createComponent(AddStopModalComponent).componentInstance;
  });

  it('defaults to an empty check-in when there are no existing stops', () => {
    expect(component.defaultCheckIn()).toBe('');
  });

  it("defaults to the last stop's checkout date when stops exist", () => {
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    expect(component.defaultCheckIn()).toBe('05/06/2026');
  });

  it('seeds checkIn with the default when a city is selected', () => {
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    component.onCityChange(LONDON);
    expect(component.selectedCity()).toBe(LONDON);
    expect(component.checkIn()).toBe('05/06/2026');
  });
});

describe('AddStopModalComponent — presetCityId (city guide "plan this city" pre-fill)', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [AddStopModalComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
  });

  it('pre-selects the city when presetCityId matches a known city', () => {
    const fixture = TestBed.createComponent(AddStopModalComponent);
    fixture.componentRef.setInput('presetCityId', 'madrid');
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedCity()?.id).toBe('madrid');
  });

  const dmy = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

  it('prefills Entrada = today and Salida = today + 3 (shown in the inputs), so "Agregar al viaje" is enabled at once', () => {
    const fixture = TestBed.createComponent(AddStopModalComponent);
    fixture.componentRef.setInput('presetCityId', 'madrid');
    fixture.detectChanges();
    const today = new Date(), out = new Date();
    out.setDate(out.getDate() + 3);
    const c = fixture.componentInstance;
    expect(c.checkIn()).toBe(dmy(today));
    expect(c.checkOut()).toBe(dmy(out));
    const inputs = fixture.nativeElement.querySelectorAll('app-date-range input') as NodeListOf<HTMLInputElement>;
    expect(inputs[0].value).toBe(dmy(today));
    expect(inputs[1].value).toBe(dmy(out));
    const addBtn = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>).find(b => b.textContent!.includes('Agregar'))!;
    expect(addBtn.disabled).toBe(false);
  });

  it('chains after the last stop when the trip already has stops', () => {
    TestBed.inject(TripService).addStop(PARIS, '01/06/2026', '05/06/2026');
    const fixture = TestBed.createComponent(AddStopModalComponent);
    fixture.componentRef.setInput('presetCityId', 'madrid');
    fixture.detectChanges();
    expect(fixture.componentInstance.checkIn()).toBe('05/06/2026');
    expect(fixture.componentInstance.checkOut()).toBe('08/06/2026');
  });

  it('opened normally (no preset) the dates stay empty', () => {
    const fixture = TestBed.createComponent(AddStopModalComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.checkIn()).toBe('');
    expect(fixture.componentInstance.checkOut()).toBe('');
  });

  it('leaves selectedCity null for an unknown id', () => {
    const fixture = TestBed.createComponent(AddStopModalComponent);
    fixture.componentRef.setInput('presetCityId', 'atlantis');
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedCity()).toBeNull();
  });

  it('shows the preset city inside the combobox, not the empty placeholder', () => {
    const fixture = TestBed.createComponent(AddStopModalComponent);
    fixture.componentRef.setInput('presetCityId', 'madrid');
    fixture.detectChanges();
    const combo = fixture.nativeElement.querySelector('app-city-combobox') as HTMLElement;
    expect(combo.textContent).toContain('Madrid');
    expect(combo.textContent).not.toContain('Buscar ciudad o país');
  });
});

describe('AddStopModalComponent — backdrop close guard', () => {
  let component: AddStopModalComponent;
  const backdropEl = { id: 'backdrop' } as unknown as EventTarget;
  const childEl = { id: 'child' } as unknown as EventTarget;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [AddStopModalComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    component = TestBed.createComponent(AddStopModalComponent).componentInstance;
  });

  function event(target: EventTarget, currentTarget: EventTarget): MouseEvent {
    return { target, currentTarget } as unknown as MouseEvent;
  }

  it('closes when both mousedown and click land directly on the backdrop', () => {
    let closed = false;
    component.close.subscribe(() => (closed = true));

    component.onBackdropMouseDown(event(backdropEl, backdropEl));
    component.onBackdropClick(event(backdropEl, backdropEl));

    expect(closed).toBe(true);
  });

  it('does not close on a ghost click whose mousedown started on a child element (e.g. a flatpickr day cell)', () => {
    let closed = false;
    component.close.subscribe(() => (closed = true));

    component.onBackdropMouseDown(event(childEl, backdropEl));
    component.onBackdropClick(event(backdropEl, backdropEl));

    expect(closed).toBe(false);
  });

  it('does not close when the click itself lands on a child element', () => {
    let closed = false;
    component.close.subscribe(() => (closed = true));

    component.onBackdropMouseDown(event(backdropEl, backdropEl));
    component.onBackdropClick(event(childEl, backdropEl));

    expect(closed).toBe(false);
  });
});

describe('AddStopModalComponent — add() navigation (Feature 68)', () => {
  it('navigates to /plan after adding a stop', () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [AddStopModalComponent],
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    const router = TestBed.inject(Router);
    const nav = jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(AddStopModalComponent);
    const component = fixture.componentInstance;
    component.selectedCity.set(PARIS);
    component.checkIn.set('01/06/2026');
    component.checkOut.set('05/06/2026');

    component.add();

    expect(nav).toHaveBeenCalledWith('/plan');
  });
});

describe('AddStopModalComponent — F79 free first plan', () => {
  function setup(firstPlanAvailable: boolean) {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [AddStopModalComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting(), provideRouter([])],
    });
    jest.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    TestBed.inject(AuthService).setTokens('t', { name: 'Ana', email: 'ana@test.com', firstPlanAvailable });
    const save = jest.spyOn(TestBed.inject(FirstPlanService), 'saveFirstManualPlan').mockReturnValue(of('p1'));
    const component = TestBed.createComponent(AddStopModalComponent).componentInstance;
    component.selectedCity.set(PARIS);
    component.checkIn.set('01/06/2026');
    component.checkOut.set('05/06/2026');
    component.add();
    return save;
  }

  it('saves the first city when the gift is available', () => {
    expect(setup(true)).toHaveBeenCalled();
  });

  it("keeps today's browser-only draft once the gift is used", () => {
    expect(setup(false)).not.toHaveBeenCalled();
  });
});
