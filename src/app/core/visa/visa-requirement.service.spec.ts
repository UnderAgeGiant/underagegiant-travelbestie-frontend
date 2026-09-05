import { TestBed } from '@angular/core/testing';
import { VisaRequirementService } from './visa-requirement.service';

describe('VisaRequirementService', () => {
  let service: VisaRequirementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VisaRequirementService);
  });

  it('returns a visa_free_days result with the numeric day count for a known pair (CL -> FR)', () => {
    const result = service.requirement('CL', 'FR');
    expect(result).toEqual({ raw: '90', category: 'visa_free_days', days: 90 });
  });

  it('returns an eta category for a known pair (CL -> US)', () => {
    const result = service.requirement('CL', 'US');
    expect(result).toEqual({ raw: 'eta', category: 'eta', days: null });
  });

  it('returns an e_visa category for a known pair (CL -> CU)', () => {
    const result = service.requirement('CL', 'CU');
    expect(result).toEqual({ raw: 'e-visa', category: 'e_visa', days: null });
  });

  it('returns a visa_required category for a known pair (CL -> KP)', () => {
    const result = service.requirement('CL', 'KP');
    expect(result).toEqual({ raw: 'visa required', category: 'visa_required', days: null });
  });

  it('returns null for a self-match (home == destination)', () => {
    expect(service.requirement('CL', 'CL')).toBeNull();
  });

  it('returns null for an unknown code pair', () => {
    expect(service.requirement('ZZ', 'FR')).toBeNull();
  });

  it('is case-insensitive on both codes', () => {
    expect(service.requirement('cl', 'fr')).toEqual(service.requirement('CL', 'FR'));
  });
});
