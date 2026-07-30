import {
  ChangeDetectionStrategy, Component, ElementRef, HostListener, OnInit, Renderer2,
  computed, effect, inject, input, output, signal,
} from '@angular/core';
import { CityAttractionSuggestion } from '../../../core/models/ai.model';
import { findCuratedAttraction } from '../../../data/attractions.data';

interface ResolvedSuggestion extends CityAttractionSuggestion {
  name: string;
  icon: string;
}

@Component({
  selector: 'app-city-suggest-cloud',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="csc-overlay">
      <button type="button" class="csc-close" (click)="dismiss.emit()"
              i18n-aria-label="@@citySuggest.closeAria" aria-label="Cerrar">✕</button>

      <div class="csc-scene">
        <img class="csc-dog" src="/small-black-dog.png" alt="Asistente Miel" draggable="false" />

        <div class="csc-bubble">
          @if (loading()) {
            <div class="csc-typing"><span></span><span></span><span></span></div>
            <p class="csc-bubble-text" i18n="@@citySuggest.thinking">Pensando en más ideas para ti…</p>
          } @else if (error()) {
            <p class="csc-bubble-title">😥 <ng-container i18n="@@citySuggest.errorTitle">¡Ups!</ng-container></p>
            <p class="csc-bubble-text">{{ error() }}</p>
          } @else {
            <p class="csc-bubble-title" i18n="@@citySuggest.greeting">¡Mira lo que encontré para ti! 🐾</p>
            <div class="csc-messages">
              @for (s of resolved(); track s.attractionId) {
                <label class="csc-msg">
                  <input type="checkbox" class="csc-msg-check"
                         [checked]="selectedIds().has(s.attractionId)"
                         (change)="toggleSelected(s.attractionId)"
                         i18n-aria-label="@@citySuggest.checkAria" aria-label="Incluir {{ s.name }}" />
                  <span class="csc-msg-icon">{{ s.icon }}</span>
                  <div class="csc-msg-body">
                    <div class="csc-msg-head">
                      <span class="csc-msg-name">{{ s.name }}</span>
                      <span class="csc-msg-time">{{ shortDate(s.date) }} · {{ s.startTime }}–{{ s.endTime }}</span>
                    </div>
                    <p class="csc-msg-reason">{{ s.reason }}</p>
                  </div>
                </label>
              }
            </div>
            <div class="csc-actions">
              <button type="button" class="btn-pill btn-outline city-suggest-more"
                      (click)="searchMore.emit()"
                      i18n="@@citySuggest.searchMoreBtn">🔄 Buscar más opciones</button>
              <button type="button" class="btn-pill btn-primary city-suggest-add-all"
                      [disabled]="selectedIds().size === 0"
                      (click)="emitAddSelected()"
                      i18n="@@citySuggest.addAllBtn">➕ Agregar lo seleccionado al plan</button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class CitySuggestCloudComponent implements OnInit {
  readonly cityId      = input.required<string>();
  readonly suggestions = input.required<CityAttractionSuggestion[]>();
  readonly loading     = input.required<boolean>();
  readonly error       = input<string | null>(null);

  readonly dismiss    = output<void>();
  readonly addAll     = output<string[]>();
  readonly searchMore = output<void>();

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly renderer   = inject(Renderer2);

  protected readonly selectedIds = signal<Set<string>>(new Set());

  // Every new batch of suggestions arrives fully checked; re-seed selection whenever
  // the input array changes (initial fetch or "search more").
  private readonly syncSelection = effect(() => {
    this.selectedIds.set(new Set(this.suggestions().map(s => s.attractionId)));
  });

  ngOnInit(): void {
    // Fullscreen overlay must win against <app-nav> regardless of where this component is
    // declared in the tree — reparent to <body>'s root stacking context (same technique as
    // AttractionImageLightboxComponent) rather than relying on z-index alone.
    this.renderer.appendChild(document.body, this.elementRef.nativeElement);
  }

  readonly resolved = computed<ResolvedSuggestion[]>(() =>
    this.suggestions().map(s => {
      const att = findCuratedAttraction(this.cityId(), s.attractionId);
      return { ...s, name: att?.name ?? s.attractionId, icon: att?.icon ?? '📍' };
    }),
  );

  protected toggleSelected(attractionId: string): void {
    this.selectedIds.update(set => {
      const next = new Set(set);
      next.has(attractionId) ? next.delete(attractionId) : next.add(attractionId);
      return next;
    });
  }

  protected emitAddSelected(): void {
    this.addAll.emit(Array.from(this.selectedIds()));
  }

  shortDate(d: string): string {
    const p = d.split('/');
    return p.length >= 2 ? `${p[0]}/${p[1]}` : d;
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') this.dismiss.emit();
  }
}
