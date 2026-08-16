import {
  ChangeDetectionStrategy, Component, ElementRef, HostListener, OnDestroy, OnInit, Renderer2, computed, inject, signal,
} from '@angular/core';
import { HighlightTourService } from './highlight-tour.service';
import { LocaleService } from '../../core/i18n/locale.service';
import { HighlightStep } from './highlight-tours.config';

/** Cycled in this exact order, repeating, for as long as the tour is open. */
const DOG_LOOP_IMAGES = [
  '/Dog-highlight-wagging-tail-1.png',
  '/Dog-highlight-wagging-tail-2.png',
  '/Dog-highlight-playfull-1.png',
];
const DOG_LOOP_FRAME_MS = 400;

const BUBBLE_WIDTH = 340;
const BUBBLE_HEIGHT_ESTIMATE = 220;

@Component({
  selector: 'app-highlight-tour',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (tour.activeType() && tour.currentStep(); as step) {
      <div class="tour-blocker"></div>
      <div class="tour-spotlight-ring" [style]="ringStyle()"></div>
      <div class="tour-scene" [style]="sceneStyle()">
        <img class="tour-dog" [src]="dogImage()" alt="Asistente Miel" draggable="false" />
        <div class="tour-bubble">
          <button type="button" class="tour-close" (click)="tour.close()"
                  i18n-aria-label="@@highlightTour.closeAria" aria-label="Cerrar">✕</button>
          <p class="tour-bubble-text">{{ stepText(step) }}</p>
          <div class="tour-controls">
            <span class="tour-step-counter">{{ tour.stepIndex() + 1 }} / {{ tour.totalSteps() }}</span>
            <div class="tour-nav-buttons">
              @if (tour.stepIndex() > 0) {
                <button type="button" class="btn-pill btn-outline" (click)="tour.prev()"
                        i18n="@@highlightTour.prevBtn">← Atrás</button>
              }
              @if (tour.stepIndex() < tour.totalSteps() - 1) {
                <button type="button" class="btn-pill btn-primary" (click)="tour.next()"
                        i18n="@@highlightTour.nextBtn">Siguiente →</button>
              } @else {
                <button type="button" class="btn-pill btn-primary" (click)="tour.next()"
                        i18n="@@highlightTour.finishBtn">¡Entendido!</button>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class HighlightTourComponent implements OnInit, OnDestroy {
  protected readonly tour = inject(HighlightTourService);
  private readonly locale = inject(LocaleService);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);

  private readonly frameIndex = signal(0);
  private loopHandle: ReturnType<typeof setInterval> | null = null;

  protected readonly dogImage = computed(() => DOG_LOOP_IMAGES[this.frameIndex()]);

  ngOnInit(): void {
    // Must always win the stacking order against <app-nav> regardless of where this
    // component is declared — same reparent-to-<body> technique as CitySuggestCloudComponent.
    this.renderer.appendChild(document.body, this.elementRef.nativeElement);

    // Continuous frame loop, independent of tour/step state — runs for the component's
    // whole lifetime (it's only ever mounted while a tour could be showing).
    this.loopHandle = setInterval(() => {
      this.frameIndex.update(i => (i + 1) % DOG_LOOP_IMAGES.length);
    }, DOG_LOOP_FRAME_MS);
  }

  ngOnDestroy(): void {
    this.elementRef.nativeElement.remove();
    if (this.loopHandle !== null) clearInterval(this.loopHandle);
  }

  protected stepText(step: HighlightStep): string {
    return step.text[this.locale.current()];
  }

  protected ringStyle(): string {
    const r = this.tour.targetRect();
    if (!r) return 'display:none';
    const pad = 8;
    return `top:${r.top - pad}px;left:${r.left - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px`;
  }

  protected sceneStyle(): string {
    const r = this.tour.targetRect();
    if (!r) return 'top:50%;left:50%;transform:translate(-50%,-50%)';
    const spaceBelow = window.innerHeight - r.bottom;
    const placeBelow = spaceBelow > BUBBLE_HEIGHT_ESTIMATE + 24;
    const top = placeBelow ? r.bottom + 16 : Math.max(16, r.top - BUBBLE_HEIGHT_ESTIMATE);
    const left = Math.min(Math.max(16, r.left), window.innerWidth - BUBBLE_WIDTH - 16);
    return `top:${top}px;left:${left}px`;
  }

  @HostListener('window:resize')
  protected onResize(): void {
    this.tour.recomputeRect();
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') this.tour.close();
  }
}
