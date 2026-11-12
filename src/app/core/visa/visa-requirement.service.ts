import { Injectable, signal } from '@angular/core';
import type { VISA_REQUIREMENTS } from '../../data/visa-requirements.data';
import { VisaRequirementResult, categoryFromRaw } from '../models/visa-requirement.model';

type VisaMatrix = typeof VISA_REQUIREMENTS;

@Injectable({ providedIn: 'root' })
export class VisaRequirementService {
  private readonly matrix = signal<VisaMatrix | null>(null);
  private loading: Promise<void> | null = null;

  /** Loads the visa matrix as a lazy chunk. Memoized; never rejects. A failed import leaves the matrix null and clears the memo so a later call retries. */
  load(): Promise<void> {
    this.loading ??= import('../../data/visa-requirements.data').then(
      m => { this.matrix.set(m.VISA_REQUIREMENTS); },
      () => { this.loading = null; },
    );
    return this.loading;
  }

  /** Null while the matrix is loading (and starts the load); reactive, so computed()/templates re-run once it arrives. */
  requirement(homeIso2: string, destIso2: string): VisaRequirementResult | null {
    const matrix = this.matrix();
    if (!matrix) { void this.load(); return null; }
    const home = homeIso2.toUpperCase();
    const dest = destIso2.toUpperCase();
    const raw = matrix[home]?.[dest];
    if (raw === undefined || raw === '-1') return null;
    const { category, days } = categoryFromRaw(raw);
    return { raw, category, days };
  }
}
