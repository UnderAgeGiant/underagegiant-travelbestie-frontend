import { Injectable, computed, inject, signal, untracked } from '@angular/core';
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
   * A `false` result silently aborts — no Redis/DB write, exactly as if `start()` had never
   * been called, since nothing was ever actually shown.
   *
   * No separate "already seen locally" pre-check here — `checkServerStatus` already
   * consults its own sessionStorage cache first and only calls the network when nothing is
   * cached yet, so this is already a no-op HTTP-wise on every `start()` after the first one
   * in a given tab session (see HighlightSeenService).
   *
   * Wrapped in `untracked()` because this method is called directly from inside
   * `ShellComponent`'s own `effect()`. Without it, the guard's `this._activeType()` read
   * gets silently attributed to that OUTER effect as one of ITS dependencies too — Angular's
   * effect tracking captures every signal read during an effect's synchronous execution,
   * regardless of which function performed the read. That turned into a real bug: dismissing
   * the tour (close()/dismiss()) sets `_activeType` to null, which — because it had been
   * captured as a dependency — marked the host effect dirty and scheduled a re-run; that
   * re-run called `start()` again, and since `checkServerStatus()`'s sessionStorage cache
   * still said "not seen" (dismiss deliberately never marks it seen locally, see
   * HighlightSeenService.markDismissedOnServer), the tour silently reopened right after the
   * user closed it — with no way to close it, since every close just reopened it again.
   * `untracked()` keeps every signal read/write inside this method invisible to whichever
   * effect happens to be calling it.
   */
  start(type: HighlightType, options?: { shouldStillShow?: () => boolean }): void {
    untracked(() => {
      if (this._activeType()) return; // a tour is already showing — never stack two

      this.seen.checkServerStatus(type).subscribe({
        next: seenOnServer => {
          if (seenOnServer) return;
          if (options?.shouldStillShow && !options.shouldStillShow()) return;
          this._activeType.set(type);
          this._stepIndex.set(0);
          void this.resolveCurrentTarget();
        },
        error: () => { /* fail open — a network hiccup just means the tour doesn't show this load */ },
      });
    });
  }

  next(): void {
    if (this._stepIndex() >= this.totalSteps() - 1) {
      this.confirm(); // last step's button reads "¡Entendido!" — an explicit confirmation
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

  /** ✕ button / Escape — closing without reaching "¡Entendido!" is a dismissal, not a confirmation. */
  close(): void {
    this.dismiss();
  }

  recomputeRect(): void {
    const step = this.currentStep();
    if (!step) return;
    const el = this.registry.get(step.targetId);
    if (el) this._targetRect.set(el.getBoundingClientRect());
  }

  /** Explicit "¡Entendido!" on the last step, or an internal auto-skip (no target ever found) — marks seen immediately. */
  private confirm(): void {
    const type = this._activeType();
    this._activeType.set(null);
    this._targetRect.set(null);
    if (!type) return;
    this.seen.markSeenLocally(type);
    this.seen.markSeenOnServer(type);
  }

  /** Closed early (✕/Escape) without confirming — reports a dismissal, backend owns the 3-strikes escalation. */
  private dismiss(): void {
    const type = this._activeType();
    this._activeType.set(null);
    this._targetRect.set(null);
    if (!type) return;
    this.seen.markDismissedOnServer(type);
  }

  private async resolveCurrentTarget(): Promise<void> {
    for (let attempt = 0; attempt < TARGET_POLL_MAX_ATTEMPTS; attempt++) {
      const step = this.currentStep();
      if (!step) {
        this.confirm();
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
      this.confirm();
      return;
    }
    this._stepIndex.update(i => i + 1);
    void this.resolveCurrentTarget();
  }
}
