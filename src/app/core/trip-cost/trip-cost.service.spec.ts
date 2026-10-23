import { TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { of, Subject, throwError } from 'rxjs';
import { TripCostService } from './trip-cost.service';
import { ApiService } from '../api/api.service';
import { AuthService } from '../auth/auth.service';
import { FxRates } from '../models/trip.model';

const RATES: FxRates = { base: 'USD', rates: { USD: 1, CLP: 940.12 }, fetchedAt: '2026-10-22T00:00:00.000Z' };

function setup(country: string | null, fx$: ReturnType<typeof of<FxRates>> | Subject<FxRates> = of(RATES)) {
  const user = signal({ name: 'Ana', email: 'ana@test.com', countryOfResidence: country });
  const getFxRates = jest.fn(() => fx$);
  TestBed.configureTestingModule({
    providers: [
      { provide: ApiService, useValue: { getFxRates } },
      { provide: AuthService, useValue: { currentUser: user } },
    ],
  });
  return { service: TestBed.inject(TripCostService), getFxRates };
}

describe('TripCostService', () => {
  it('formats in the viewer currency once rates are loaded (CL -> CLP)', async () => {
    const { service } = setup('CL');
    service.format(100);            // triggers the one-time load
    await Promise.resolve();        // let the deferred load land
    const text = service.format(100);
    expect(text).toContain('CLP');
    expect(text).toContain('94,012');
  });

  it('can be read from a computed without throwing (no NG0600) and reflects the rate after loading', async () => {
    const { service } = setup('CL');
    const view = computed(() => service.format(100));
    expect(() => view()).not.toThrow();
    await Promise.resolve();
    expect(view()).toContain('94,012');
  });

  it('loads the rates at most once across many format() calls', async () => {
    const { service, getFxRates } = setup('CL');
    service.format(100);
    service.format(200);
    service.format(300);
    await Promise.resolve();
    expect(getFxRates).toHaveBeenCalledTimes(1);
  });

  it('formats in USD when the viewer has no country', () => {
    const { service } = setup(null);
    expect(service.format(100)).toBe('$100');
  });

  it('formats in USD when the country has no known currency', () => {
    const { service } = setup('ZZ');
    expect(service.format(100)).toBe('$100');
  });

  it('formats in USD while rates are still loading', () => {
    const { service } = setup('CL', new Subject<FxRates>());
    expect(service.format(100)).toBe('$100');
  });

  it('stays USD when the rates request fails', async () => {
    const { service, getFxRates } = setup('CL', throwError(() => new Error('upstream')));
    expect(service.format(100)).toBe('$100');
    await Promise.resolve();
    expect(service.format(100)).toBe('$100');
    service.format(100);
    expect(getFxRates).toHaveBeenCalledTimes(1);
  });
});
