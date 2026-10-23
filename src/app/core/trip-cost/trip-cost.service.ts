import { Injectable, LOCALE_ID, inject, signal } from '@angular/core';
import { ApiService } from '../api/api.service';
import { AuthService } from '../auth/auth.service';
import { TravelInfoService } from '../travel-info/travel-info.service';
import { FxRates } from '../models/trip.model';

/** Prices are stored in USD; this service only converts them for display. */
@Injectable({ providedIn: 'root' })
export class TripCostService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly travelInfo = inject(TravelInfoService);
  private readonly locale = inject(LOCALE_ID);

  private readonly _rates = signal<FxRates | null>(null);
  readonly rates = this._rates.asReadonly();

  /** Rates are fetched lazily on first use and never again in this session. */
  private ratesRequested = false;

  /** Viewer's currency; USD unless rates are loaded and include the viewer's currency. */
  viewerCurrency(): string {
    const country = this.auth.currentUser()?.countryOfResidence;
    if (!country) return 'USD';
    const code = this.travelInfo.currencyInfo(country)?.code;
    if (!code) return 'USD';
    return this._rates()?.rates[code] !== undefined ? code : 'USD';
  }

  /** Formats a USD amount in the viewer's currency. Reads the rates signal, so callers re-render once rates arrive. */
  format(usd: number): string {
    this.loadRatesOnce();
    const currency = this.viewerCurrency();
    const amount = currency === 'USD' ? usd : usd * (this._rates()!.rates[currency]);
    return new Intl.NumberFormat(this.locale, { style: 'currency', currency, currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 }).format(amount);
  }

  private loadRatesOnce(): void {
    if (this.ratesRequested) return;
    this.ratesRequested = true;
    // Deferred out of the caller's reactive context: a synchronous rates write
    // during a template/computed read would throw NG0600.
    queueMicrotask(() => this.api.getFxRates().subscribe({
      next: rates => this._rates.set(rates),
      error: () => { /* stay in USD */ },
    }));
  }
}
