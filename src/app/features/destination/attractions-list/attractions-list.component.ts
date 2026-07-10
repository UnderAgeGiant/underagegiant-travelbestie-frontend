import { Component, input, output, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { City } from '../../../core/models/city.model';
import { Attraction, Comment } from '../../../core/models/comment.model';
import { AttractionCardComponent } from '../attraction-card/attraction-card.component';
import { AttractionCategory, ALL_CATEGORIES } from '../../../core/models/attraction-category';

@Component({
  selector: 'app-attractions-list',
  imports: [AttractionCardComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="attractions-area">
      <div class="attractions-top">
        <div class="attractions-label" i18n="@@dest.exploreTitle">Agregar atracciones a mi itinerario</div>
        <span class="att-count">
          {{ filteredAttractions().length }}
          @if (filteredAttractions().length === 1) {
            <ng-container i18n="@@dest.onePlace">lugar</ng-container>
          } @else {
            <ng-container i18n="@@dest.manyPlaces">lugares</ng-container>
          }
        </span>
      </div>

      <div class="att-search-row">
        <span class="att-search-icon">🔍</span>
        <input class="att-search-input"
               type="text"
               [value]="searchQuery()"
               (input)="searchQuery.set($any($event.target).value)"
               i18n-placeholder="@@dest.searchPlaceholder"
               placeholder="Buscar atracción…" />
        @if (searchQuery()) {
          <button class="att-search-clear" type="button" (click)="searchQuery.set('')">✕</button>
        }
      </div>

      @if (availableCategories().length > 1) {
        <div class="att-filter-row">
          <button class="att-filter-chip" [class.active]="filterCategory() === null"
                  (click)="filterCategory.set(null)" type="button"
                  i18n="@@dest.filterAll">Todos</button>
          @for (cat of availableCategories(); track cat.code) {
            <button class="att-filter-chip" [class.active]="filterCategory() === cat.code"
                    [style.--chip-bg]="cat.bg"
                    (click)="filterCategory.set(filterCategory() === cat.code ? null : cat.code)"
                    type="button">
              {{ cat.icon }} {{ cat.label }}
            </button>
          }
        </div>
      }

      <div class="att-grid">
        @for (att of filteredAttractions(); track att.id) {
          <app-attraction-card
            [attraction]="att"
            [cityName]="city().name"
            [cityId]="city().id"
            [stopId]="stopId()"
            [comments]="commentsFor(att.id)"
            (commentAdded)="commentAdded.emit($event)" />
        }
        @if (filteredAttractions().length === 0) {
          <div class="att-empty" i18n="@@dest.searchEmpty">Sin resultados para tu búsqueda</div>
        }
      </div>
    </div>
  `,
})
export class AttractionsListComponent {
  city        = input.required<City>();
  attractions = input.required<Attraction[]>();
  stopId      = input.required<string>();
  comments    = input<Record<string, Comment[]>>({});

  commentAdded = output<{ attractionId: string; comment: Omit<Comment, 'id'> }>();

  readonly filterCategory = signal<AttractionCategory | null>(null);
  readonly searchQuery    = signal('');

  readonly availableCategories = computed(() =>
    ALL_CATEGORIES.filter(m => this.attractions().some(a => a.category === m.code))
  );

  readonly filteredAttractions = computed(() => {
    let list = this.attractions();
    const cat = this.filterCategory();
    if (cat) list = list.filter(a => a.category === cat);
    const q = this.searchQuery().trim().toLowerCase();
    if (q) list = list.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.type.toLowerCase().includes(q) ||
      (a.nativeName?.toLowerCase().includes(q) ?? false)
    );
    return list;
  });

  constructor() {
    effect(() => {
      this.city();
      this.filterCategory.set(null);
      this.searchQuery.set('');
    }, { allowSignalWrites: true });
  }

  commentsFor(attractionId: string): Comment[] {
    return this.comments()[attractionId] ?? [];
  }
}
