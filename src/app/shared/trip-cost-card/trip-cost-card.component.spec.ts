import { TestBed, ComponentFixture } from '@angular/core/testing';
import { TripCostCardComponent } from './trip-cost-card.component';
import { TripCostService } from '../../core/trip-cost/trip-cost.service';
import { CostEstimate, CostSettings, DEFAULT_COST_SETTINGS } from '../../core/models/trip.model';

const fakeCost = { format: (usd: number) => `US$${usd}`, viewerCurrency: () => 'USD' };

function estimate(over: Partial<CostEstimate> = {}): CostEstimate {
  return {
    totalUsd: 4000, flightsUsd: 1500, lodgingUsd: 1800, ticketsUsd: 400, groundUsd: 300,
    nights: 6, rooms: 2, ticketCount: 4, unpricedTicketCount: 0,
    unestimated: [], missingOrigin: false,
    settings: { ...DEFAULT_COST_SETTINGS, origin: { geonameId: 1, name: 'Santiago', countryCode: 'CL', iata: 'SCL' }, adults: 2 },
    inputsHash: 'h', calculatedAt: '2026-10-22T12:00:00.000Z',
    ...over,
  };
}

const SETTINGS: CostSettings = { ...DEFAULT_COST_SETTINGS, origin: { geonameId: 1, name: 'Santiago', countryCode: 'CL', iata: 'SCL' }, adults: 2 };

describe('TripCostCardComponent', () => {
  let fixture: ComponentFixture<TripCostCardComponent>;
  let el: HTMLElement;

  function create(inputs: Record<string, unknown>): void {
    TestBed.configureTestingModule({
      imports: [TripCostCardComponent],
      providers: [{ provide: TripCostService, useValue: fakeCost }],
    });
    fixture = TestBed.createComponent(TripCostCardComponent);
    for (const [k, v] of Object.entries({ mode: 'owner', canCalculate: false, calculating: false, settings: SETTINGS, estimate: null, ...inputs })) {
      fixture.componentRef.setInput(k, v);
    }
    fixture.detectChanges();
    el = fixture.nativeElement as HTMLElement;
  }

  const text = () => el.textContent ?? '';

  it('renders nothing for a shared trip without an estimate', () => {
    create({ mode: 'shared', estimate: null });
    expect(el.querySelector('.tcc')).toBeNull();
    expect(text().trim()).toBe('');
  });

  it('shows "Calcular precio" for an owner who can calculate, and emits calculate on click', () => {
    create({ mode: 'owner', estimate: null, canCalculate: true });
    expect(text()).toContain('Todavía no calculado');
    const btn = Array.from(el.querySelectorAll('button')).find(b => b.textContent?.includes('Calcular precio'));
    expect(btn).toBeTruthy();
    const spy = jest.fn();
    fixture.componentInstance.calculate.subscribe(spy);
    btn!.click();
    expect(spy).toHaveBeenCalled();
  });

  it('hides "Calcular precio" when the viewer cannot calculate', () => {
    create({ mode: 'owner', estimate: null, canCalculate: false });
    expect(text()).toContain('Todavía no calculado');
    expect(text()).not.toContain('Calcular precio');
  });

  it('shows the approximate total with the formatted amount', () => {
    create({ estimate: estimate({ totalUsd: 4000 }) });
    expect(text()).toContain('≈ US$4000');
  });

  it('shows the grey ±30% line with the calculation date', () => {
    create({ estimate: estimate() });
    expect(text()).toContain('±30%');
    expect(text()).toContain('Calculado el');
  });

  it('shows the context line with origin, adults and comfort', () => {
    create({ estimate: estimate() });
    expect(text()).toContain('Desde Santiago');
    expect(text()).toContain('2 adultos');
    expect(text()).toContain('Intermedio');
  });

  it('hides the breakdown until the toggle is clicked', () => {
    create({ estimate: estimate() });
    expect(text()).not.toContain('Vuelos');
    const toggle = el.querySelector<HTMLButtonElement>('button[aria-expanded]')!;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(text()).toContain('Vuelos');
    expect(text()).toContain('Alojamiento');
    expect(text()).toContain('Entradas');
  });

  it('lists an unestimated leg as sin estimar', () => {
    create({ estimate: estimate({ unestimated: [{ from: 'paris', to: '__home__', mode: 'flight' }] }) });
    expect(text()).toContain('sin estimar');
  });

  it('shows "Ciudad sin catálogo" instead of the raw id for a city outside the catalog (I6)', () => {
    create({ estimate: estimate({ unestimated: [{ from: 'ai-made-city-42', to: 'ai-made-city-42', mode: 'hotel' }] }) });
    expect(text()).toContain('Ciudad sin catálogo · alojamiento — sin estimar');
    expect(text()).not.toContain('ai-made-city-42');
  });

  it('renders an unpriced hotel as "{city} · alojamiento — sin estimar", not as a route', () => {
    create({ estimate: estimate({ unestimated: [{ from: 'paris', to: 'paris', mode: 'hotel' }] }) });
    expect(text()).toContain('Paris · alojamiento — sin estimar');
    expect(text()).not.toContain('→');
  });

  it('shows the edit link when origin is missing and emits editSettings', () => {
    create({ estimate: estimate({ missingOrigin: true }), settings: { ...SETTINGS, origin: null } });
    expect(text()).toContain('Sin vuelos desde casa');
    const link = Array.from(el.querySelectorAll('button')).find(b => b.textContent?.includes('Sale desde'));
    expect(link).toBeTruthy();
    const spy = jest.fn();
    fixture.componentInstance.editSettings.subscribe(spy);
    link!.click();
    expect(spy).toHaveBeenCalled();
  });

  it('always offers the settings edit link to an owner/collaborator of a priced plan', () => {
    create({ mode: 'owner', canCalculate: true, estimate: estimate() });
    const link = el.querySelector<HTMLButtonElement>('.tcc-edit');
    expect(link?.textContent).toContain('Editar salida, viajeros y estilo');
    const spy = jest.fn();
    fixture.componentInstance.editSettings.subscribe(spy);
    link!.click();
    expect(spy).toHaveBeenCalled();
  });

  it('never shows the settings edit link on the shared page or while calculating', () => {
    create({ mode: 'shared', estimate: estimate() });
    expect(el.querySelector('.tcc-edit')).toBeNull();
    TestBed.resetTestingModule();
    create({ mode: 'owner', canCalculate: true, calculating: true, estimate: estimate() });
    expect(el.querySelector('.tcc-edit')).toBeNull();
  });

  it('shows Desactualizado and greys the total when stale, owner only', () => {
    create({ mode: 'owner', estimate: estimate({ stale: true }) });
    expect(text()).toContain('Desactualizado · guarda para recalcular');
    expect(el.querySelector('.tcc-total--stale')).toBeTruthy();
  });

  it('shows the calculating state', () => {
    create({ estimate: estimate(), calculating: true });
    expect(text()).toContain('Calculando…');
  });

  it('uses the shared title in shared mode', () => {
    create({ mode: 'shared', estimate: estimate() });
    expect(text()).toContain('Costo estimado para este grupo');
  });
});
