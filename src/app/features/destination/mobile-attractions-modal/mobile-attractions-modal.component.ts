import { Component, inject, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { TripService } from '../../trip/trip.service';
import { WORLD_CITIES } from '../../../data/cities.data';
import { getAttractions } from '../../../data/attractions.data';
import { sortMustSeeFirst } from '../../../core/utils/must-see.util';
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
 *
 * BOTTOM SHEET, not a fullscreen modal (family feedback: "the move/drag is not allowed on
 * mobile" investigation traced the real remaining blocker here, not in the drag code itself —
 * see day-timeline-drag.util.ts's own history). A fullscreen overlay completely occludes
 * tb-day-timeline underneath, so a user has no way to see the drop target while their finger
 * is still down mid-drag. Anchoring to the bottom at a partial height (default 58vh, expandable
 * to 92vh) leaves the timeline visible and touchable in the exposed area above the sheet —
 * confirmed live that TouchDragService's cross-component coordination doesn't care what's
 * visually on top of the touch point, only whether it falls within the timeline grid's own
 * bounding rect, so this is sufficient to make the drag physically reachable, not just
 * technically functional.
 *
 * No backdrop dimming/click-catcher over the exposed area — deliberately, so the timeline
 * stays fully interactive (both for the drag gesture and for its own normal reschedule-drag).
 * Dismiss is via the ✕ button only; the drag-handle bar toggles peek/expanded height, it does
 * not close the sheet.
 */
@Component({
  selector: 'app-mobile-attractions-modal',
  imports: [AttractionsListComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (device.isMobile() && modal.isOpen() && city()) {
      <div class="att-sheet" [class.expanded]="expanded()" (click)="$event.stopPropagation()">
        <button class="att-sheet-handle" (click)="expanded.set(!expanded())" type="button"
                i18n-aria-label="@@dest.addAttractionsToggleHeight" aria-label="Expandir o contraer">
          <span class="att-sheet-handle-bar"></span>
        </button>
        <button class="att-modal-close" (click)="modal.close()"
                i18n-aria-label="@@dest.addAttractionsClose" aria-label="Cerrar">✕</button>
        <div class="att-sheet-body" (scroll)="onScroll($event)">
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
  readonly attractions = computed(() => this.city() ? sortMustSeeFirst(getAttractions(this.city()!)) : []);

  protected readonly allComments = signal<Record<string, Comment[]>>({});
  protected readonly scrolled = signal(false);
  protected readonly expanded = signal(false);

  constructor() {
    effect(() => {
      const ids = this.attractions().map(a => a.id);
      if (ids.length === 0) return;
      this.api.getCommentsBatch(ids).subscribe(map => this.allComments.set(map));
    });

    // Bring tb-day-timeline into the area still exposed above the sheet when it opens — the
    // trigger button lives up in the stop list, so without this the page is usually still
    // scrolled near the top (showing the stop list, not the timeline) the moment the sheet
    // appears, defeating the whole point of leaving it visible.
    effect(() => {
      if (!this.device.isMobile() || !this.modal.isOpen() || !this.city()) return;
      this.expanded.set(false);
      queueMicrotask(() => {
        const timelineEl = document.querySelector('tb-day-timeline');
        if (!timelineEl) return;
        const top = timelineEl.getBoundingClientRect().top + window.scrollY - 8;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  }

  protected onScroll(ev: Event): void {
    this.scrolled.set((ev.target as HTMLElement).scrollTop > 240);
  }

  protected scrollTop(): void {
    (document.querySelector('.att-sheet-body') as HTMLElement | null)
      ?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected onCommentAdded(attractionId: string, comment: Omit<Comment, 'id'>): void {
    this.allComments.update(prev => ({
      ...prev,
      [attractionId]: [...(prev[attractionId] ?? []), comment as Comment],
    }));
  }
}
