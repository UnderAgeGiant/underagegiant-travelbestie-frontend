import { TestBed } from '@angular/core/testing';
import { TravelInfoService } from './travel-info.service';

describe('TravelInfoService', () => {
  let service: TravelInfoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TravelInfoService);
  });

  it('returns currency info for a known country (CL -> CLP)', () => {
    const result = service.currencyInfo('CL');
    expect(result?.code).toBe('CLP');
    expect(result?.name).toBe('Chilean Peso');
    expect(result?.symbol).toBe('$');
  });

  it('returns null currency info for an unknown code', () => {
    expect(service.currencyInfo('ZZ')).toBeNull();
  });

  it('is case-insensitive on currencyInfo', () => {
    expect(service.currencyInfo('cl')).toEqual(service.currencyInfo('CL'));
  });

  it('returns plug info with adapterNeeded null when no home country is given', () => {
    const result = service.plugInfo('CL');
    expect(result?.plugTypes).toEqual(['C', 'L']);
    expect(result?.adapterNeeded).toBeNull();
  });

  it('returns adapterNeeded true when home and destination share no plug type (US -> CL)', () => {
    const result = service.plugInfo('CL', 'US');
    expect(result?.adapterNeeded).toBe(true);
  });

  it('returns adapterNeeded false when home and destination share a plug type (FR -> CL, both use Type C)', () => {
    const result = service.plugInfo('CL', 'FR');
    expect(result?.adapterNeeded).toBe(false);
  });

  it('returns null plug info for a country with no plug data', () => {
    expect(service.plugInfo('ZZ')).toBeNull();
  });
});
