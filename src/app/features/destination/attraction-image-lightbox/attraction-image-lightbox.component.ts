import {
  ChangeDetectionStrategy, Component, HostListener, OnInit, input, output, signal,
} from '@angular/core';

const SWIPE_THRESHOLD_PX = 50;

@Component({
    selector: 'app-attraction-image-lightbox',
    imports: [],
    styles: [`
    .lb-overlay {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(0,0,0,.92);
      display: flex; align-items: center; justify-content: center;
      animation: fadeIn .15s ease both;
    }
    .lb-img-wrap {
      position: relative; width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
    }
    .lb-img {
      max-width: 92vw; max-height: 86vh;
      object-fit: contain;
      -webkit-user-select: none; user-select: none;
    }
    .lb-close {
      position: absolute; top: 20px; right: 20px; z-index: 3;
      width: 40px; height: 40px; border-radius: 50%;
      background: rgba(255,255,255,.15); backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,.3); color: #fff; font-size: 16px;
      display: flex; align-items: center; justify-content: center; cursor: pointer;
      transition: background .2s;
    }
    .lb-close:hover { background: rgba(255,255,255,.3); }
    .lb-counter {
      position: absolute; top: 24px; left: 24px; z-index: 3;
      color: rgba(255,255,255,.85); font-size: 13px; font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
    .lb-arrows {
      position: absolute; top: 50%; left: 16px; right: 16px; z-index: 3;
      display: flex; justify-content: space-between; transform: translateY(-50%);
      pointer-events: none;
    }
    .lb-arrow {
      width: 44px; height: 44px; border-radius: 50%; pointer-events: auto;
      background: rgba(255,255,255,.15); backdrop-filter: blur(8px); color: #fff;
      font-size: 20px; border: 1px solid rgba(255,255,255,.3);
      display: flex; align-items: center; justify-content: center; cursor: pointer;
      transition: background .2s;
    }
    .lb-arrow:hover { background: rgba(255,255,255,.3); }
    .lb-dots {
      position: absolute; bottom: 22px; left: 0; right: 0; z-index: 3;
      display: flex; justify-content: center; gap: 7px;
    }
    .lb-dot {
      width: 7px; height: 7px; border-radius: 50%; border: none; padding: 0;
      background: rgba(255,255,255,.4); cursor: pointer; transition: all .3s;
    }
    .lb-dot.active { background: #fff; width: 22px; border-radius: 4px; }
    @media (max-width: 768px) {
      .lb-arrow { width: 38px; height: 38px; font-size: 17px; }
      .lb-arrows { left: 6px; right: 6px; }
    }
  `],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
    <div class="lb-overlay" (click)="onBackdropClick($event)">
      <div class="lb-img-wrap">
        <img class="lb-img" [src]="images()[activeIdx()]" [alt]="altText()" (click)="$event.stopPropagation()">
      </div>

      <button class="lb-close" (click)="close()" type="button"
              i18n-aria-label="@@imgLightbox.close" aria-label="Cerrar imagen">✕</button>

      @if (images().length > 1) {
        <div class="lb-counter">{{ activeIdx() + 1 }} / {{ images().length }}</div>

        <div class="lb-arrows">
          <button class="lb-arrow" (click)="prev()" type="button"
                  i18n-aria-label="@@imgLightbox.prev" aria-label="Anterior">‹</button>
          <button class="lb-arrow" (click)="next()" type="button"
                  i18n-aria-label="@@imgLightbox.next" aria-label="Siguiente">›</button>
        </div>

        <div class="lb-dots">
          @for (img of images(); track $index) {
            <button [class]="'lb-dot' + (activeIdx() === $index ? ' active' : '')"
                    (click)="goTo($index)" type="button" [attr.aria-label]="'Imagen ' + ($index + 1)"></button>
          }
        </div>
      }
    </div>
  `
})
export class AttractionImageLightboxComponent implements OnInit {
  images     = input.required<string[]>();
  startIndex = input(0);
  altText    = input('');

  closed = output<void>();

  protected readonly activeIdx = signal(0);

  ngOnInit(): void {
    this.activeIdx.set(this.startIndex());
  }

  protected next(): void {
    const n = this.images().length;
    if (!n) return;
    this.activeIdx.update(i => (i + 1) % n);
  }

  protected prev(): void {
    const n = this.images().length;
    if (!n) return;
    this.activeIdx.update(i => (i - 1 + n) % n);
  }

  protected goTo(i: number): void {
    this.activeIdx.set(i);
  }

  protected close(): void {
    this.closed.emit();
  }

  protected onBackdropClick(e: MouseEvent): void {
    if (e.target === e.currentTarget) this.close();
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') this.close();
    else if (e.key === 'ArrowRight') this.next();
    else if (e.key === 'ArrowLeft') this.prev();
  }

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
}
