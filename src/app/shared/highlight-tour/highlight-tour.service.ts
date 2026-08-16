import { Injectable, computed, inject, signal } from '@angular/core';
import { HighlightRegistryService } from './highlight-registry.service';
import { HighlightSeenService } from './highlight-seen.service';
import { HIGHLIGHT_TOURS, HighlightStep } from './highlight-tours.config';
import { HighlightType } from '../../core/models/highlight.model';

const TARGET_POLL_INTERVAL_MS = 100;
const TARGET_POLL_MAX_ATTEMPTS = 10;

@Injectable({ providedIn: 'root' })
export class HighlightTourService {
  private readonly registry = inject(HighlightRegistryService);
  private readonly seen = inject(HighlightSeenService);

  private readonly _activeType = signal<HighlightType | null>(null);
  private readonly _stepIndex = signal(0);
  private readonly _targetRect = signal<DOMRect | null>(null);

  readonly activeType = this._activeType.asReadonly();
  readonly stepIndex = this._stepIndex.asReadonly();
  readonly targetRect = this._targetRect.asReadonly();

  readonly steps = computed<HighlightStep[]>(() => {
    const type = this._activeType();
    return type ? HIGHLIGHT_TOURS[type] : [];
  });

  readonly currentStep = computed<HighlightStep | null>(() => this.steps()[this._stepIndex()] ?? null);
  readonly totalSteps = computed(() => this.steps().length);

  /**
   * `shouldStillShow`, if given, is re-checked right before the tour actually becomes
   * visible — after the `checkServerStatus` round trip resolves, not just at the moment
   * `start()` was called. This closes a real (if narrow) race: the caller's own gate on
   * *calling* `start()` can only reflect state as of that call; if the caller's condition
   * flips false while the HTTP request for this call is still in flight (e.g. the visitor
   * finishes logging in during those ~100–300 ms), showing the tour anyway would be wrong.
   * A `false` result silently aborts — no cookie/Redis/DB write, exactly as if `start()`
   * had never been called, since nothing was ever actually shown.
   */
  start(type: HighlightType, options?: { shouldStillShow?: () => boolean }): void {
    if (this._activeType()) return; // a tour is already showing — never stack two
    if (this.seen.hasSeenLocally(type)) return;

    this.seen.checkServerStatus(type).subscribe({
      next: seenOnServer => {
        if (seenOnServer) {
          this.seen.markSeenLocally(type); // heal the cookie so future loads skip the network round trip
          return;
        }
        if (options?.shouldStillShow && !options.shouldStillShow()) return;
        this._activeType.set(type);
        this._stepIndex.set(0);
        void this.resolveCurrentTarget();
      },
      error: () => { /* fail open — a network hiccup just means the tour doesn't show this load */ },
    });
  }

  next(): void {
    if (this._stepIndex() >= this.totalSteps() - 1) {
      this.complete();
      return;
    }
    this._stepIndex.update(i => i + 1);
    void this.resolveCurrentTarget();
  }

  prev(): void {
    if (this._stepIndex() <= 0) return;
    this._stepIndex.update(i => i - 1);
    void this.resolveCurrentTarget();
  }

  close(): void {
    this.complete();
  }

  recomputeRect(): void {
    const step = this.currentStep();
    if (!step) return;
    const el = this.registry.get(step.targetId);
    if (el) this._targetRect.set(el.getBoundingClientRect());
  }

  private complete(): void {
    const type = this._activeType();
    this._activeType.set(null);
    this._targetRect.set(null);
    if (!type) return;
    this.seen.markSeenLocally(type);
    this.seen.markSeenOnServer(type);
  }

  private async resolveCurrentTarget(): Promise<void> {
    for (let attempt = 0; attempt < TARGET_POLL_MAX_ATTEMPTS; attempt++) {
      const step = this.currentStep();
      if (!step) {
        this.complete();
        return;
      }
      const el = this.registry.get(step.targetId);
      if (el) {
        this._targetRect.set(el.getBoundingClientRect());
        return;
      }
      await new Promise(resolve => setTimeout(resolve, TARGET_POLL_INTERVAL_MS));
    }
    // Never found (e.g. this step's target lives behind a collapsed mobile drawer) —
    // skip it entirely rather than showing a spotlight with no hole.
    if (this._stepIndex() >= this.totalSteps() - 1) {
      this.complete();
      return;
    }
    this._stepIndex.update(i => i + 1);
    void this.resolveCurrentTarget();
  }
}
