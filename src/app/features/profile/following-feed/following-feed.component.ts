import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ApiService } from '../../../core/api/api.service';
import { FeedPlan } from '../../../core/models/feed-plan.model';
import { FeedPlanCardComponent } from '../../landing/feed/feed-plan-card.component';

@Component({
  selector: 'tb-following-feed',
  imports: [FeedPlanCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <div class="section-head" i18n="@@profile.followingTitle">Siguiendo 👥</div>
      @for (p of items(); track p.id) { <tb-feed-plan-card [plan]="p" /> }
      @if (loadError()) {
        <div class="section-empty" role="alert" i18n="@@profile.followingError">No pudimos cargar a quienes sigues.</div>
        <button type="button" class="btn-pill btn-outline ff-retry" [disabled]="loading()" (click)="retry()" i18n="@@profile.followingRetry">Reintentar</button>
      } @else if (!loading() && items().length === 0) {
        <div class="section-empty" i18n="@@profile.followingEmpty">Aún no sigues a nadie — encuentra viajeros en Rankings.</div>
      }
      @if (cursor()) {
        <button type="button" class="btn-pill btn-outline ff-more" [disabled]="loading()" (click)="loadMore()" i18n="@@profile.followingMore">Ver más</button>
      }
    </section>
  `,
})
export class FollowingFeedComponent {
  private readonly api = inject(ApiService);
  readonly items = signal<FeedPlan[]>([]);
  readonly cursor = signal<string | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal(false);

  constructor() { this.fetch(null); }

  loadMore(): void {
    if (this.loading()) return;
    this.fetch(this.cursor());
  }

  retry(): void { this.fetch(this.cursor()); }

  private fetch(cursor: string | null): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.api.getFollowingFeed(cursor).subscribe({
      next: page => { this.items.update(xs => [...xs, ...page.items]); this.cursor.set(page.nextCursor); this.loading.set(false); },
      error: () => { this.loadError.set(true); this.loading.set(false); },
    });
  }
}
