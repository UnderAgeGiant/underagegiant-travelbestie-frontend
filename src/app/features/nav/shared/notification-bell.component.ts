import { Component, HostListener, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '../../../core/notifications/notification.service';
import { AppNotification } from '../../../core/models/notification.model';
import { shareRedirectPath } from '../../../core/routing/share-redirect.util';

/**
 * Nav bell with unread badge + floating notification panel (mirrors the
 * .user-panel dropdown pattern). Rendered by both NavDesktop and NavMobile,
 * only for logged-in users.
 */
@Component({
  selector: 'app-notification-bell',
  standalone: true,
  template: `
    <div class="notif-wrap">
      <button class="notif-bell" type="button"
              [class.notif-bell-shake]="notif.shaking()"
              [class.notif-bell-active]="panelOpen()"
              (click)="togglePanel()"
              aria-label="Notificaciones" i18n-aria-label="@@notif.bellAria">
        <svg class="notif-bell-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.7 21a2 2 0 0 1-3.4 0"/>
        </svg>
        @if (notif.unreadCount() > 0) {
          <span class="notif-badge">{{ notif.unreadCount() > 9 ? '9+' : notif.unreadCount() }}</span>
        }
      </button>

      @if (panelOpen()) {
        <div class="notif-panel">
          <div class="notif-panel-head">
            <div class="up-title" i18n="@@notif.panelTitle">Notificaciones</div>
            <button class="notif-mute-btn" type="button" (click)="notif.toggleMute()">
              @if (notif.muted()) {
                <span i18n="@@notif.unmute">Silenciadas — reactivar</span>
              } @else {
                <span i18n="@@notif.mute">Silenciar todas</span>
              }
            </button>
          </div>
          <div class="notif-list">
            @if (notif.notifications().length === 0) {
              <div class="notif-empty" i18n="@@notif.empty">Sin notificaciones aún</div>
            }
            @for (n of notif.notifications(); track n.notificationId) {
              <button class="notif-item" [class.unread]="!n.read" type="button" (click)="open(n)">
                <div class="notif-item-title">{{ n.title }}</div>
                <div class="notif-item-body">{{ n.body }}</div>
                <div class="notif-item-date">{{ relativeDate(n.createdAt) }}</div>
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class NotificationBellComponent {
  readonly notif = inject(NotificationService);
  private readonly router = inject(Router);
  readonly panelOpen = signal(false);

  togglePanel(): void {
    const opening = !this.panelOpen();
    this.panelOpen.set(opening);
    if (opening) this.notif.openPanel();
  }

  // Angular's default onSameUrlNavigation ('ignore') makes navigateByUrl(path) a silent
  // no-op whenever the Router already tracks `path` as current — which can happen after
  // any of this app's many signal-only view switches (see NavFacadeService.onLogoClick())
  // leave the Router's URL stale relative to what's actually on screen. Bouncing through a
  // skipLocationChange hop to '/' first (never a real target — notification urls are concrete
  // routes, never bare '/') guarantees the Router treats the
  // follow-up navigation as genuinely different, so it always actually fires.
  private forceNavigate(path: string): void {
    if (this.router.url === path) {
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => this.router.navigateByUrl(path));
    } else {
      this.router.navigateByUrl(path);
    }
  }

  open(n: AppNotification): void {
    this.panelOpen.set(false);
    // n.url is the backend-issued in-app route, optionally ?focus=<id> (contracts §9). Only ever follow
    // an in-app path — '//host' is protocol-relative, so it's excluded too. Router navigation, not
    // window.location.href: a hard reload would blank the in-memory access token. A row older than
    // 2026-10-03 that escaped the data migration may still say /?share=<id>; map it like the boot shim.
    if (!n.url.startsWith('/') || n.url.startsWith('//')) return;
    const legacy = n.url.startsWith('/?') ? shareRedirectPath(n.url.slice(1)) : null;
    this.forceNavigate(legacy ?? n.url);
  }

  relativeDate(iso: string): string {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
    if (mins < 1) return $localize`:@@notif.now:ahora`;
    if (mins < 60) return $localize`:@@notif.minsAgo:hace ${mins}:count: min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return $localize`:@@notif.hoursAgo:hace ${hours}:count: h`;
    return new Date(iso).toLocaleDateString();
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    this.panelOpen.set(false);
  }
}
