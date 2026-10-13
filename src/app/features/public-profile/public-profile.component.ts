import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { EMPTY, catchError, switchMap } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { PublicProfile } from '../../core/models/public-profile.model';
import { WORLD_CITIES } from '../../data/cities.data';
import { NavShellComponent } from '../nav/nav-shell.component';
import { FeedPlanCardComponent } from '../landing/feed/feed-plan-card.component';
import { TrophyShelfComponent } from '../preferences/trophy-shelf/trophy-shelf.component';
import { FollowButtonComponent } from './follow-button.component';

const cityNames = new Map(WORLD_CITIES.map(c => [c.id, c.name]));

@Component({
  selector: 'tb-public-profile',
  imports: [NavShellComponent, FeedPlanCardComponent, TrophyShelfComponent, FollowButtonComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pp-page">
    <app-nav (logoClick)="goHome()" />
    <main class="pp">
      @switch (state()) {
        @case ('loading') { <p class="pp-status" i18n="@@publicProfile.loading">Cargando perfil…</p> }
        @case ('notFound') {
          <h1 i18n="@@publicProfile.notFound">Este perfil no existe</h1>
          <a class="btn-pill btn-primary" routerLink="/" i18n="@@publicProfile.home">Volver al inicio</a>
        }
        @case ('ready') {
          @let p = profile()!;
          <header class="pp-head">
            <h1 class="pp-name">{{ p.name }}</h1>
            <div class="pp-handle">&#64;{{ p.username }}</div>
            <div class="pp-counts">
              <span><strong>{{ followerCount() }}</strong> <ng-container i18n="@@publicProfile.followers">seguidores</ng-container></span>
              <span><strong>{{ p.followingCount }}</strong> <ng-container i18n="@@publicProfile.following">siguiendo</ng-container></span>
            </div>
            @if (isMe()) {
              <a class="btn-pill btn-outline" routerLink="/preferences" i18n="@@publicProfile.edit">Editar cuenta</a>
            } @else {
              <tb-follow-button [username]="p.username" [(following)]="following" />
            }
          </header>

          <tb-trophy-shelf class="pp-trophies" [earned]="p.trophies" />

          @if (cities().length) {
            <section class="pp-section">
              <h2 class="section-head" i18n="@@publicProfile.cities">Ciudades planificadas</h2>
              <div class="feed-chips">@for (c of cities(); track c) { <span class="feed-chip">{{ c }}</span> }</div>
            </section>
          }

          <section class="pp-section">
            <h2 class="section-head" i18n="@@publicProfile.trips">Planes compartidos</h2>
            @for (t of p.trips; track t.id) { <tb-feed-plan-card class="feed-card-frame" [plan]="t" /> }
            @empty { <p class="pp-status" i18n="@@publicProfile.noTrips">Todavía no ha compartido planes.</p> }
          </section>
        }
      }
    </main>
    </div>
  `,
  styles: [`
    /* html/body are overflow:hidden app-wide, so this page scrolls in its own container (same as .guides-page). */
    .pp-page { position: relative; height: 100vh; overflow-y: auto; overflow-x: hidden; }
    .pp { max-width: 760px; margin: 0 auto; padding: 96px 16px 56px; color: var(--t1); }
    /* .feed-chip is styled for the dark landing feed; these are on the cream page. */
    .pp .feed-chip { color: var(--lav-d); background: oklch(75% .10 290 / .14); border-color: oklch(75% .10 290 / .45); backdrop-filter: none; }
    .pp-head {
      display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center;
      padding: 32px 24px 28px; border-radius: 24px;
      background: linear-gradient(160deg, var(--lav) 0%, var(--peach) 100%);
      box-shadow: var(--sh-lg);
    }
    .pp-name { font-family: 'Cormorant Garamond', serif; font-weight: 400; font-size: 40px; line-height: 1.05; letter-spacing: -.5px; margin: 0; }
    .pp-handle { color: var(--t2); font-size: 14px; font-variant-numeric: tabular-nums; }
    .pp-counts { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; color: var(--t2); font-size: 13px; }
    .pp-counts span { display: inline-flex; gap: 4px; align-items: baseline; padding: 4px 12px; border-radius: 99px; background: rgba(255,255,255,.6); }
    .pp-counts strong { color: var(--t1); font-variant-numeric: tabular-nums; }
    .pp-trophies { display: block; margin-top: 32px; }
    .pp-section { margin-top: 36px; }
    .pp-section .section-head { margin-bottom: 12px; }
    .pp-status { color: var(--t3); text-align: center; font-size: 13px; }
    @media (max-width: 768px) {
      .pp { padding: 24px 16px 40px; }
      .pp-name { font-size: 32px; }
    }
  `],
})
export class PublicProfileComponent {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly state = signal<'loading' | 'ready' | 'notFound' | 'rateLimited'>('loading');
  readonly profile = signal<PublicProfile | null>(null);
  readonly following = signal(false);

  readonly isMe = computed(() => !!this.profile() && this.auth.currentUser()?.username === this.profile()!.username);
  /** Follower count follows the button optimistically. */
  readonly followerCount = computed(() => {
    const p = this.profile();
    if (!p) return 0;
    return p.followerCount + (this.following() ? 1 : 0) - (p.isFollowedByMe ? 1 : 0);
  });
  readonly cities = computed(() => (this.profile()?.visitedCityIds ?? []).map(id => cityNames.get(id) ?? id));

  constructor() {
    inject(ActivatedRoute).paramMap.pipe(
      switchMap(pm => {
        this.state.set('loading');
        return this.api.getPublicProfile(pm.get('username') ?? '').pipe(
          // Inner handling: an error must not kill the outer paramMap stream (route reuse /u/a → /u/b).
          catchError((e: HttpErrorResponse) => {
            if (e.status === 429) {
              this.state.set('rateLimited');
              const retry = Number.parseInt(e.headers?.get('Retry-After') ?? '', 10);
              // replaceUrl: Back must not return to /u/x and re-trigger the 429.
              this.router.navigate(['/demasiadas-visitas'], { queryParams: { retry: Number.isFinite(retry) ? retry : 60 }, replaceUrl: true });
            } else {
              this.state.set('notFound');
            }
            return EMPTY;
          }),
        );
      }),
      takeUntilDestroyed(),
    ).subscribe(p => { this.profile.set(p); this.following.set(!!p.isFollowedByMe); this.state.set('ready'); });
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
