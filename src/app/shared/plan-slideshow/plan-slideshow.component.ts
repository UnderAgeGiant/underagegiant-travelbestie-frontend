import {
  ChangeDetectionStrategy, Component, HostListener, OnDestroy, OnInit, computed, input, output, signal,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { SlideshowItem } from '../../core/models/plan-slideshow.model';

const AUTO_ADVANCE_MS = 6000;
const SWIPE_THRESHOLD_PX = 50;

@Component({
  selector: 'app-plan-slideshow',
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="ps-overlay-root" (click)="$event.stopPropagation()">
  @for (item of items(); track item.id; let i = $index) {
    <div [ngClass]="['ps-slide', activeIdx() === i ? 'active' : '']">
      @if (item.imageUrl) {
        <img class="ps-slide-img" [src]="item.imageUrl" [alt]="item.name" />
      } @else {
        <div class="ps-slide-fallback"><span class="ps-slide-fallback-icon">{{ item.icon }}</span></div>
      }
      <div class="ps-slide-scrim"></div>
    </div>
  }

  <button class="ps-close" (click)="close()" type="button"
          i18n-aria-label="@@planSlideshow.close" aria-label="Cerrar presentación">✕</button>

  @if (activeItem(); as item) {
    <div class="ps-caption">
      <div class="ps-caption-type">{{ item.type }}</div>
      <div class="ps-caption-name">{{ item.name }}</div>
      <div class="ps-caption-time">
        <span>{{ dateTimeLabel(item.startDate, item.startTime) }}</span>
        @if (item.endDate || item.endTime) {
          <span class="ps-caption-arrow">→</span>
          <span>{{ dateTimeLabel(item.endDate, item.endTime) }}</span>
        }
      </div>
    </div>

    <div class="ps-dots">
      @for (i of items(); track i.id; let idx = $index) {
        <button [class]="'ps-dot' + (activeIdx() === idx ? ' active' : '')"
                (click)="goTo(idx)" type="button" [attr.aria-label]="'Slide ' + (idx + 1)"></button>
      }
    </div>

    <div class="ps-arrows">
      <button class="ps-arrow ps-arrow-prev" (click)="prev()" type="button"
              i18n-aria-label="@@planSlideshow.prev" aria-label="Anterior">‹</button>
      <button class="ps-arrow ps-arrow-next" (click)="next()" type="button"
              i18n-aria-label="@@planSlideshow.next" aria-label="Siguiente">›</button>
    </div>
  } @else {
    <div class="ps-empty" i18n="@@planSlideshow.empty">No hay elementos para mostrar todavía.</div>
  }
</div>
  `,
})
export class PlanSlideshowComponent implements OnInit, OnDestroy {
  readonly items  = input.required<SlideshowItem[]>();
  readonly closed = output<void>();

  protected readonly activeIdx  = signal(0);
  protected readonly activeItem = computed<SlideshowItem | null>(() => this.items()[this.activeIdx()] ?? null);

  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.restartTimer();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  private restartTimer(): void {
    this.stopTimer();
    if (this.items().length <= 1) return;
    this.timer = setInterval(() => this.advance(), AUTO_ADVANCE_MS);
  }

  private stopTimer(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private advance(): void {
    const n = this.items().length;
    if (!n) return;
    this.activeIdx.update(i => (i + 1) % n);
  }

  protected next(): void {
    this.advance();
    this.restartTimer();
  }

  protected prev(): void {
    const n = this.items().length;
    if (!n) return;
    this.activeIdx.update(i => (i - 1 + n) % n);
    this.restartTimer();
  }

  protected goTo(i: number): void {
    this.activeIdx.set(i);
    this.restartTimer();
  }

  protected close(): void {
    this.closed.emit();
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') this.close();
    else if (e.key === 'ArrowRight') this.next();
    else if (e.key === 'ArrowLeft') this.prev();
  }

  // Swipe left → next, swipe right → prev. Bound to the host (not `document`)
  // since it should only react to gestures inside the overlay itself.
  private touchStartX: number | null = null;

  @HostListener('touchstart', ['$event'])
  protected onTouchStart(e: TouchEvent): void {
    this.touchStartX = e.changedTouches[0]?.clientX ?? null;
  }

  @HostListener('touchend', ['$event'])
  protected onTouchEnd(e: TouchEvent): void {
    const startX = this.touchStartX;
    this.touchStartX = null;
    if (startX === null) return;

    const endX  = e.changedTouches[0]?.clientX ?? startX;
    const delta = endX - startX;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;

    if (delta < 0) this.next();
    else this.prev();
  }

  protected dateTimeLabel(date: string | null, time: string | null): string {
    if (date && time) return `${date} · ${time}`;
    return date ?? time ?? '';
  }
}
