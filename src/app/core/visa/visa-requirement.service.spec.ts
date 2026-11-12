import { TestBed } from '@angular/core/testing';
import { computed } from '@angular/core';
import { VisaRequirementService } from './visa-requirement.service';

describe('VisaRequirementService', () => {
  let service: VisaRequirementService;

  beforeEach(async () => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VisaRequirementService);
    await service.load();
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

  describe('lazy matrix', () => {
    const CL_FR = { raw: '90', category: 'visa_free_days', days: 90 };

    it('returns null until load() resolves, then the known pair', async () => {
      const fresh = new VisaRequirementService();
      expect(fresh.requirement('CL', 'FR')).toBeNull();
      await fresh.load();
      expect(fresh.requirement('CL', 'FR')).toEqual(CL_FR);
    });

    it('makes a computed() re-evaluate from null to the value once the matrix arrives', async () => {
      const fresh = new VisaRequirementService();
      const reading = computed(() => fresh.requirement('CL', 'FR'));
      expect(reading()).toBeNull();
      await fresh.load();
      expect(reading()).toEqual(CL_FR);
    });

    it('memoizes load(): the same promise for repeated calls', () => {
      const fresh = new VisaRequirementService();
      expect(fresh.load()).toBe(fresh.load());
    });
  });
});
