import { Injectable, inject, signal, computed } from '@angular/core';
import { TripService } from '../../features/trip/trip.service';
import { SavedPlansService } from './saved-plans.service';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AutoSaveService {
  private readonly trip       = inject(TripService);
  private readonly savedPlans = inject(SavedPlansService);
  private readonly auth       = inject(AuthService);

  // Per-plan overrides the user has explicitly toggled, keyed by planId.
  // Read from localStorage lazily inside `enabled` — no eager bulk load needed.
  private readonly _overrides = signal<Record<string, boolean>>({});

  private overrideKey(planId: string): string  { return `tb_autosave_override_${planId}`; }
  private snapshotKey(planId: string): string  { return `tb_autosave_snapshot_${planId}`; }

  // Condition 4 (flag on) plus condition 5 (default on/off) both live here.
  readonly enabled = computed(() => {
    const planId = this.trip.loadedPlanId();
    if (!planId) return false;
    const cached = this._overrides()[planId];
    if (cached !== undefined) return cached;
    const stored = localStorage.getItem(this.overrideKey(planId));
    if (stored !== null) return stored === 'true';
    // No explicit choice yet: ON for own plans, OFF for collaborations.
    return !this.trip.loadedPlanOwner();
  });

  toggle(): void {
    const planId = this.trip.loadedPlanId();
    if (!planId) return;
    const next = !this.enabled();
    localStorage.setItem(this.overrideKey(planId), String(next));
    this._overrides.update(m => ({ ...m, [planId]: next }));
  }

  // Drives the top-of-viewport reminder banner (rendered once, root-level, from ShellComponent)
  // shown on the same tick that would otherwise auto-save, whenever the toggle is off instead.
  private readonly _reminderVisible = signal(false);
  readonly reminderVisible = this._reminderVisible.asReadonly();

  dismissReminder(): void {
    this._reminderVisible.set(false);
  }

  /** Call after any successful save (manual or automatic) so the next tick's diff is against fresh data. */
  commitSnapshot(planId: string): void {
    localStorage.setItem(this.snapshotKey(planId), this.serializeCurrent());
  }

  private serializeCurrent(): string {
    return JSON.stringify({ stops: this.trip.stops(), transits: this.trip.transits() });
  }

  // Condition 3: this is a full deep comparison, not a shallow reference check —
  // JSON.stringify recurses through every nested field (each stop's selectedAttractions,
  // each entry's startTime/endTime/ticketPurchased, lodging, transit segments), so a change
  // buried three levels deep is caught exactly like a top-level one. Angular signals can hand
  // back new array/object references on unrelated re-renders, so a reference check here would
  // false-positive; a mutated-in-place nested field could fail to bump a top-level reference at
  // all, so it would false-negative. Serializing content sidesteps both.
  // No cached snapshot at all counts as "changed" so the very first tick after a plan loads
  // establishes a baseline instead of silently doing nothing forever.
  private hasChangedSinceLastSave(planId: string): boolean {
    return localStorage.getItem(this.snapshotKey(planId)) !== this.serializeCurrent();
  }

  private started = false;

  /** Idempotent — safe to call from every mount of StopListComponent; the timer itself is a singleton. */
  start(): void {
    if (this.started) return;
    this.started = true;
    if (environment.autoSaveIntervalMs <= 0) return; // 0 (or negative) disables auto-save/reminder ticks entirely
    setInterval(() => this.tick(), environment.autoSaveIntervalMs);
  }

  private tick(): void {
    const planId = this.trip.loadedPlanId();
    if (!planId) return;                                // condition 1
    if (!this.hasChangedSinceLastSave(planId)) return;   // condition 3 — nothing to save either way, so no save AND no nag

    if (!this.enabled()) {
      // condition 4 fails: same tick, same "there's something unsaved" check, but instead of
      // saving on the user's behalf we remind them to do it themselves — most commonly because
      // this is a collaboration, where a silent background save is exactly what we want to avoid.
      this._reminderVisible.set(true);
      return;
    }

    const email = this.auth.currentUser()?.email;
    const name  = this.savedPlans.plans().find(p => p.id === planId)?.name;
    if (!email || !name) return;
    this.savedPlans.upsert(email, planId, name, this.trip.stops(), this.trip.transits()).subscribe({
      next: () => this.commitSnapshot(planId),
      // Silent on failure — this is a background convenience save, not a user-initiated
      // action; the next tick will simply retry since the snapshot was never committed.
    });
  }
}
