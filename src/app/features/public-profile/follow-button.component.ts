import { ChangeDetectionStrategy, Component, inject, input, model, signal } from '@angular/core';
import { ApiService } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { AuthModalService } from '../../core/auth/auth-modal.service';

/** Optimistic follow toggle; reverts on error. Logged-out click opens the login modal. */
@Component({
  selector: 'tb-follow-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="btn-pill" data-testid="follow-button" [class.btn-primary]="!following()" [class.btn-outline]="following()"
            [attr.aria-pressed]="following()" [disabled]="busy()" (click)="toggle()">
      @if (following()) { <ng-container i18n="@@follow.following">Siguiendo</ng-container> }
      @else { <ng-container i18n="@@follow.follow">Seguir</ng-container> }
    </button>`,
})
export class FollowButtonComponent {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly authModal = inject(AuthModalService);

  readonly username = input.required<string>();
  readonly following = model(false);
  readonly busy = signal(false);

  toggle(): void {
    if (!this.auth.isLoggedIn()) { this.authModal.openLogin(); return; }
    const next = !this.following();
    this.following.set(next);
    this.busy.set(true);
    (next ? this.api.followUser(this.username()) : this.api.unfollowUser(this.username())).subscribe({
      next: () => this.busy.set(false),
      error: () => { this.following.set(!next); this.busy.set(false); },
    });
  }
}
