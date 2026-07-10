import { Component, inject, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { TripService } from '../../trip/trip.service';
import { WORLD_CITIES } from '../../../data/cities.data';
import { getAttractions } from '../../../data/attractions.data';
import { Comment } from '../../../core/models/comment.model';
import { ApiService } from '../../../core/api/api.service';
import { DeviceService } from '../../../core/device/device.service';
import { DestinationModalService } from '../destination-modal.service';
import { AttractionsListComponent } from '../attractions-list/attractions-list.component';

/**
 * Rendered as a top-level sibling of <app-nav> (see ShellComponent), NOT nested inside
 * .right-panel — a fixed-position descendant of .right-panel fails to stack above the
 * sticky mobile nav bar regardless of z-index (proven empirically: raising z-index on the
 * nested version had no effect, while relocating the same DOM node to be a direct sibling
 * of <app-nav> fixed it immediately). Mirrors AddStopModalComponent's placement.
 */
@Component({
  selector: 'app-mobile-attractions-modal',
  imports: [AttractionsListComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (device.isMobile() && modal.isOpen() && city()) {
      <div class="att-modal-backdrop" (click)="modal.close()">
        <div class="att-modal" (scroll)="onScroll($event)" (click)="$event.stopPropagation()">
          <button class="att-modal-close" (click)="modal.close()"
                  i18n-aria-label="@@dest.addAttractionsClose" aria-label="Cerrar">✕</button>
          <app-attractions-list
            [city]="city()!"
            [attractions]="attractions()"
            [stopId]="activeStop()!.stopId"
            [comments]="allComments()"
            (commentAdded)="onCommentAdded($event.attractionId, $event.comment)" />
          @if (scrolled()) {
            <button class="scroll-top-fab" (click)="scrollTop()" type="button"
                    i18n-aria-label="@@plan.scrollToTop" aria-label="Ir arriba">↑</button>
          }
        </div>
      </div>
    }
  `,
})
export class MobileAttractionsModalComponent {
  private readonly trip = inject(TripService);
  private readonly api = inject(ApiService);
  protected readonly device = inject(DeviceService);
  protected readonly modal = inject(DestinationModalService);

  readonly city = computed(() => {
    const stop = this.trip.activeStop();
    return stop ? WORLD_CITIES.find(c => c.id === stop.cityId) ?? null : null;
  });

  readonly activeStop = computed(() => this.trip.activeStop());
  readonly attractions = computed(() => this.city() ? getAttractions(this.city()!) : []);

  protected readonly allComments = signal<Record<string, Comment[]>>({});
  protected readonly scrolled = signal(false);

  constructor() {
    effect(() => {
      const ids = this.attractions().map(a => a.id);
      if (ids.length === 0) return;
      this.api.getCommentsBatch(ids).subscribe(map => this.allComments.set(map));
    });
  }

  protected onScroll(ev: Event): void {
    this.scrolled.set((ev.target as HTMLElement).scrollTop > 240);
  }

  protected scrollTop(): void {
    (document.querySelector('.att-modal') as HTMLElement | null)
      ?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected onCommentAdded(attractionId: string, comment: Omit<Comment, 'id'>): void {
    this.allComments.update(prev => ({
      ...prev,
      [attractionId]: [...(prev[attractionId] ?? []), comment as Comment],
    }));
  }
}
