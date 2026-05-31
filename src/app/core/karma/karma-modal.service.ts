import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class KarmaModalService {
  private readonly _buyOpen          = signal(false);
  private readonly _insufficientData = signal<{ need: number; have: number } | null>(null);

  readonly buyOpen          = this._buyOpen.asReadonly();
  readonly insufficientData = this._insufficientData.asReadonly();
  readonly insufficientOpen = computed(() => this._insufficientData() !== null);

  /** Open the direct buy-karma modal (nav button). */
  open(): void     { this._buyOpen.set(true); }
  closeBuy(): void { this._buyOpen.set(false); }

  /** Open the insufficient-karma info modal (triggered by a 402 response). */
  openInsufficient(need: number, have: number): void {
    this._insufficientData.set({ need, have });
  }

  closeInsufficient(): void { this._insufficientData.set(null); }

  /** Switch from the insufficient modal straight to the buy modal. */
  goToBuy(): void {
    this._insufficientData.set(null);
    this._buyOpen.set(true);
  }

  /**
   * Parse a 402 HttpErrorResponse and open the insufficient-karma modal.
   * Returns true if handled, false if the error is not a 402.
   */
  handleKarmaError(err: any, fallback = { need: 1, have: 0 }): boolean {
    if (err?.status !== 402) return false;
    const msg: string = err?.error?.error ?? '';
    const m = msg.match(/need (\d+), have (-?\d+)/);
    this.openInsufficient(m ? +m[1] : fallback.need, m ? +m[2] : fallback.have);
    return true;
  }
}
