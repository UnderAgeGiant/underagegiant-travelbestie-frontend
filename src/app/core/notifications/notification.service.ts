import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import { ApiService } from '../api/api.service';
import { AuthService } from '../auth/auth.service';
import { AppNotification } from '../models/notification.model';

const POLL_INTERVAL_MS = 60_000;
const SHAKE_MS = 900;   // matches the notif-shake CSS animation duration

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  private readonly _notifications = signal<AppNotification[]>([]);
  private readonly _unreadCount   = signal(0);
  private readonly _muted         = signal(false);
  private readonly _shaking       = signal(false);

  readonly notifications = this._notifications.asReadonly();
  readonly unreadCount   = this._unreadCount.asReadonly();
  readonly muted         = this._muted.asReadonly();
  readonly shaking       = this._shaking.asReadonly();

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private shakeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const loggedIn = this.auth.isLoggedIn();
      untracked(() => (loggedIn ? this.startPolling() : this.stopAndClear()));
    }, { allowSignalWrites: true });
  }

  /** Poll target: unread count + mute flag. Shakes the bell on a count increase. */
  refreshStatus(): void {
    this.api.getNotificationStatus().subscribe({
      next: ({ count, muted }) => {
        this._muted.set(muted);
        if (!muted && count > this._unreadCount()) this.triggerShake();
        this._unreadCount.set(count);
      },
      error: () => { /* non-fatal — next poll retries */ },
    });
  }

  /**
   * Called when the bell panel opens: fetch the list, THEN mark all read.
   * Sequencing keeps the fetched items' read flags as-of-fetch, so new
   * notifications render highlighted for this opening while the badge clears.
   */
  openPanel(): void {
    this.api.getNotifications().subscribe({
      next: ({ notifications }) => {
        this._notifications.set(notifications);
        this.markAllRead();
      },
      error: () => { /* non-fatal */ },
    });
  }

  markAllRead(): void {
    if (this._unreadCount() === 0) return;
    this._unreadCount.set(0);
    this.api.markNotificationsRead().subscribe({ error: () => { /* non-fatal */ } });
  }

  toggleMute(): void {
    const next = !this._muted();
    this._muted.set(next);   // optimistic
    this.api.setNotificationsMuted(next).subscribe({
      error: () => this._muted.set(!next),   // roll back
    });
  }

  private triggerShake(): void {
    if (this.shakeTimer) clearTimeout(this.shakeTimer);
    this._shaking.set(true);
    this.shakeTimer = setTimeout(() => this._shaking.set(false), SHAKE_MS);
  }

  private startPolling(): void {
    if (this.pollTimer) return;
    this.refreshStatus();
    this.pollTimer = setInterval(() => this.refreshStatus(), POLL_INTERVAL_MS);
  }

  private stopAndClear(): void {
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
    this._notifications.set([]);
    this._unreadCount.set(0);
    this._muted.set(false);
    this._shaking.set(false);
  }
}
