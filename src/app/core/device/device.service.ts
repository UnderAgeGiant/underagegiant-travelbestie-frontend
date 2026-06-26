import { Injectable, signal, computed } from '@angular/core';

/** Single reactive source of truth for viewport class. Breakpoint matches the
 *  `@media (max-width: 768px)` blocks in src/styles.css. */
@Injectable({ providedIn: 'root' })
export class DeviceService {
  private readonly _isMobile = signal(this.query().matches);

  readonly isMobile = this._isMobile.asReadonly();
  readonly isDesktop = computed(() => !this._isMobile());

  constructor() {
    this.query().addEventListener('change', e => this._isMobile.set(e.matches));
  }

  private query(): MediaQueryList {
    return window.matchMedia('(max-width: 768px)');
  }
}
