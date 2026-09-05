export type VisaRequirementCategory =
  | 'visa_free_days'
  | 'visa_free'
  | 'visa_on_arrival'
  | 'eta'
  | 'e_visa'
  | 'visa_required'
  | 'no_admission';

export interface VisaRequirementResult {
  raw: string;
  category: VisaRequirementCategory;
  days: number | null;
}

export interface VisaRequirementMeta {
  icon: string;
  label: string;
}

const RAW_TO_CATEGORY: Record<string, VisaRequirementCategory> = {
  'visa free':       'visa_free',
  'visa on arrival': 'visa_on_arrival',
  'eta':             'eta',
  'e-visa':          'e_visa',
  'visa required':   'visa_required',
  'no admission':    'no_admission',
};

export function categoryFromRaw(raw: string): { category: VisaRequirementCategory; days: number | null } {
  const numeric = Number(raw);
  if (raw.trim() !== '' && !Number.isNaN(numeric)) {
    return { category: 'visa_free_days', days: numeric };
  }
  return { category: RAW_TO_CATEGORY[raw] ?? 'visa_required', days: null };
}

// A function (not a module-level const) so the $localize calls execute lazily after the
// i18n polyfill loads, not at import time — same reason getCategoryMeta() in
// attraction-category.ts is a function rather than a plain object.
export function getVisaRequirementMeta(category: VisaRequirementCategory, days: number | null): VisaRequirementMeta {
  switch (category) {
    case 'visa_free_days':
      return { icon: '🟢', label: $localize`:@@visa.freeDays:${days}:INTERPOLATION: días sin visa` };
    case 'visa_free':
      return { icon: '🟢', label: $localize`:@@visa.free:Sin visa` };
    case 'visa_on_arrival':
      return { icon: '🟡', label: $localize`:@@visa.onArrival:Visa a la llegada` };
    case 'eta':
      return { icon: '🟡', label: $localize`:@@visa.eta:Autorización electrónica (ETA)` };
    case 'e_visa':
      return { icon: '🟠', label: $localize`:@@visa.eVisa:Visa electrónica` };
    case 'visa_required':
      return { icon: '🔴', label: $localize`:@@visa.required:Visa requerida` };
    case 'no_admission':
      return { icon: '⛔', label: $localize`:@@visa.noAdmission:Entrada no permitida` };
  }
}
