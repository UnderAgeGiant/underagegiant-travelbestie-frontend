import { Injectable } from '@angular/core';
import { VISA_REQUIREMENTS } from '../../data/visa-requirements.data';
import { VisaRequirementResult, categoryFromRaw } from '../models/visa-requirement.model';

@Injectable({ providedIn: 'root' })
export class VisaRequirementService {
  requirement(homeIso2: string, destIso2: string): VisaRequirementResult | null {
    const home = homeIso2.toUpperCase();
    const dest = destIso2.toUpperCase();
    const raw = VISA_REQUIREMENTS[home]?.[dest];
    if (raw === undefined || raw === '-1') return null;
    const { category, days } = categoryFromRaw(raw);
    return { raw, category, days };
  }
}
