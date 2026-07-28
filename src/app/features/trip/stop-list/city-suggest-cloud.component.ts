import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
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
    <div class="city-suggest-backdrop" (click)="dismiss.emit()"></div>
    <div class="city-suggest-cloud"
         [style.left.px]="x()"
         [style.top.px]="y()"
         (click)="$event.stopPropagation()">
      <button type="button" class="city-suggest-close" (click)="dismiss.emit()" aria-label="Cerrar">✕</button>

      @if (loading()) {
        <div class="city-suggest-loading">
          <div class="city-suggest-spinner"></div>
          <span i18n="@@citySuggest.thinking">Pensando ideas…</span>
        </div>
      } @else if (error()) {
        <div class="city-suggest-error">{{ error() }}</div>
      } @else {
        <div class="city-suggest-bubbles">
          @for (s of resolved(); track s.attractionId) {
            <div class="city-suggest-bubble">
              <div class="city-suggest-bubble-head">
                <span class="city-suggest-bubble-icon">{{ s.icon }}</span>
                <span class="city-suggest-bubble-name">{{ s.name }}</span>
              </div>
              <div class="city-suggest-bubble-time">{{ shortDate(s.date) }} · {{ s.startTime }}–{{ s.endTime }}</div>
              <div class="city-suggest-bubble-reason">{{ s.reason }}</div>
            </div>
          }
        </div>
        <button type="button" class="btn-pill btn-primary city-suggest-add-all"
                (click)="addAll.emit()"
                i18n="@@citySuggest.addAllBtn">➕ Agregar todo al plan</button>
      }
    </div>
  `,
})
export class CitySuggestCloudComponent {
  readonly cityId      = input.required<string>();
  readonly suggestions = input.required<CityAttractionSuggestion[]>();
  readonly loading     = input.required<boolean>();
  readonly error       = input<string | null>(null);
  readonly x           = input.required<number>();
  readonly y           = input.required<number>();

  readonly dismiss = output<void>();
  readonly addAll  = output<void>();

  readonly resolved = computed<ResolvedSuggestion[]>(() =>
    this.suggestions().map(s => {
      const att = findCuratedAttraction(this.cityId(), s.attractionId);
      return { ...s, name: att?.name ?? s.attractionId, icon: att?.icon ?? '📍' };
    }),
  );

  shortDate(d: string): string {
    const p = d.split('/');
    return p.length >= 2 ? `${p[0]}/${p[1]}` : d;
  }
}
