import {
  ChangeDetectionStrategy, Component, ElementRef, HostListener, OnInit, Renderer2,
  effect, inject, input, output, signal, viewChild,
} from '@angular/core';

const SWIPE_THRESHOLD_PX = 50;

@Component({
    selector: 'app-attraction-image-lightbox',
    imports: [],
    styles: [`
    .lb-overlay {
      position: fixed; inset: 0; z-index: 1000;
      background:
        radial-gradient(ellipse 80% 65% at 50% 45%, rgba(28,22,38,.94) 0%, rgba(6,5,10,.98) 100%);
      display: flex; align-items: center; justify-content: center;
      animation: lbFadeIn .18s ease-out both;
    }
    .lb-scrim-top {
      position: absolute; top: 0; left: 0; right: 0; height: 130px; z-index: 2;
      background: linear-gradient(to bottom, rgba(0,0,0,.5), transparent);
      pointer-events: none;
    }
    .lb-img-wrap {
      position: relative; width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
    }
    .lb-img {
      max-width: 90vw; max-height: 82vh;
      object-fit: contain;
      border-radius: 14px;
      box-shadow: 0 30px 70px -12px rgba(0,0,0,.65), 0 0 0 1px rgba(255,255,255,.06);
      -webkit-user-select: none; user-select: none;
      animation: lbPhotoIn .28s cubic-bezier(.22,1,.36,1) both;
    }
    .lb-topbar {
      position: absolute; top: 0; left: 0; right: 0; z-index: 3;
      display: flex; align-items: center; justify-content: flex-end;
      padding: 18px 20px;
    }
    .lb-counter {
      margin-right: auto;
      display: inline-flex; align-items: center;
      padding: 5px 11px; border-radius: 99px;
      background: rgba(255,255,255,.1); backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,.14);
      color: rgba(255,255,255,.9); font-size: 12px; font-weight: 600;
      font-variant-numeric: tabular-nums; letter-spacing: .2px;
    }
    .lb-close {
      width: 34px; height: 34px; border-radius: 50%;
      background: rgba(255,255,255,.08); backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,.14); color: rgba(255,255,255,.9);
      display: flex; align-items: center; justify-content: center; cursor: pointer;
      transition: background .15s, transform .15s, color .15s;
    }
    .lb-close:hover { background: rgba(255,255,255,.18); color: #fff; transform: scale(1.06); }
    .lb-close svg { width: 15px; height: 15px; }
    .lb-arrows {
      position: absolute; top: 50%; left: 14px; right: 14px; z-index: 3;
      display: flex; justify-content: space-between; transform: translateY(-50%);
      pointer-events: none;
    }
    .lb-arrow {
      width: 38px; height: 38px; border-radius: 50%; pointer-events: auto;
      background: rgba(255,255,255,.08); backdrop-filter: blur(10px); color: rgba(255,255,255,.9);
      border: 1px solid rgba(255,255,255,.14);
      display: flex; align-items: center; justify-content: center; cursor: pointer;
      transition: background .15s, transform .15s, color .15s;
    }
    .lb-arrow:hover { background: rgba(255,255,255,.18); color: #fff; transform: scale(1.08); }
    .lb-arrow svg { width: 17px; height: 17px; }
    .lb-dots {
      position: absolute; bottom: 20px; left: 0; right: 0; z-index: 3;
      display: flex; justify-content: center; gap: 6px;
    }
    .lb-dot {
      width: 6px; height: 6px; border-radius: 50%; border: none; padding: 0;
      background: rgba(255,255,255,.35); cursor: pointer;
      transition: background .2s, width .25s cubic-bezier(.4,0,.2,1), border-radius .25s;
    }
    .lb-dot.active { background: #fff; width: 18px; border-radius: 3px; }
    @keyframes lbFadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes lbPhotoIn {
      from { opacity: 0; transform: scale(.97); }
      to   { opacity: 1; transform: scale(1); }
    }
    @media (max-width: 768px) {
      .lb-arrow { width: 34px; height: 34px; }
      .lb-arrow svg { width: 15px; height: 15px; }
      .lb-arrows { left: 6px; right: 6px; }
    }
  `],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
    <div class="lb-overlay" (click)="onBackdropClick($event)">
      <div class="lb-scrim-top"></div>

      <div class="lb-img-wrap">
        <img #imgEl class="lb-img" [src]="images()[activeIdx()]" [alt]="altText()" (click)="$event.stopPropagation()">
      </div>

      <div class="lb-topbar">
        @if (images().length > 1) {
          <div class="lb-counter">{{ activeIdx() + 1 }} / {{ images().length }}</div>
        }
        <button class="lb-close" (click)="close()" type="button"
                i18n-aria-label="@@imgLightbox.close" aria-label="Cerrar imagen">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      @if (images().length > 1) {
        <div class="lb-arrows">
          <button class="lb-arrow" (click)="prev()" type="button"
                  i18n-aria-label="@@imgLightbox.prev" aria-label="Anterior">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 6L9 12L15 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="lb-arrow" (click)="next()" type="button"
                  i18n-aria-label="@@imgLightbox.next" aria-label="Siguiente">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
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

  private readonly imgEl = viewChild<ElementRef<HTMLImageElement>>('imgEl');

  private readonly replayPhotoAnim = effect(() => {
    this.activeIdx();
    const el = this.imgEl()?.nativeElement;
    if (!el) return;
    // Restart the CSS entrance animation on every navigation (next/prev/dot), not just first mount.
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
  });

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly renderer   = inject(Renderer2);

  ngOnInit(): void {
    this.activeIdx.set(this.startIndex());
    // Ancestors elsewhere in the tree (e.g. a fill-mode:'both' CSS animation) can establish a
    // stacking context that traps this overlay's z-index below the nav bar. Reparenting the host
    // to <body> puts it in the root stacking context, matching how CDK Overlay avoids this class of bug.
    this.renderer.appendChild(document.body, this.elementRef.nativeElement);
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
