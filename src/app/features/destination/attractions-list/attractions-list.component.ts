import { Component, input, output, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { City } from '../../../core/models/city.model';
import { Attraction, Comment } from '../../../core/models/comment.model';
import { AttractionCardComponent } from '../attraction-card/attraction-card.component';
import { AttractionCategory, getAllCategories } from '../../../core/models/attraction-category';
import { matchesAttractionQuery } from '../../../core/utils/attraction-name.util';
import { PersonalActivityCardComponent } from '../personal-activity/personal-activity-card.component';
import { getPersonalActivityMetas } from '../../../core/models/personal-activity.model';

@Component({
  selector: 'app-attractions-list',
  imports: [AttractionCardComponent, PersonalActivityCardComponent],
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

      <div class="att-filter-row">
        @if (availableCategories().length > 1) {
          <button class="att-filter-chip" [class.active]="filterCategory() === null && !showPersonal()"
                  (click)="pickCategory(null)" type="button"
                  i18n="@@dest.filterAll">Todos</button>
          @for (cat of availableCategories(); track cat.code) {
            <button class="att-filter-chip" [class.active]="filterCategory() === cat.code && !showPersonal()"
                    [style.--chip-bg]="cat.bg"
                    (click)="pickCategory(filterCategory() === cat.code ? null : cat.code)"
                    type="button">
              {{ cat.icon }} {{ cat.label }}
            </button>
          }
        }
        <button class="att-filter-chip" [class.active]="showPersonal()" style="--chip-bg:#FDF3E8"
                (click)="showPersonal.set(!showPersonal())" type="button"
                [attr.aria-pressed]="showPersonal()"
                i18n="@@personal.chip">🧺 Mis actividades</button>
      </div>

      @if (showPersonal()) {
        <div class="pa-grid">
          @for (m of personalMetas; track m.type) {
            <tb-personal-activity-card [meta]="m" [stopId]="stopId()" />
          }
        </div>
      } @else {
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
      }
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
  /** Feature 71 — "🧺 Mis actividades" chip: swaps the grid for the personal-activity cards. */
  readonly showPersonal   = signal(false);
  readonly personalMetas  = getPersonalActivityMetas();

  readonly availableCategories = computed(() =>
    getAllCategories().filter(m => this.attractions().some(a => a.category === m.code))
  );

  readonly filteredAttractions = computed(() => {
    let list = this.attractions();
    const cat = this.filterCategory();
    if (cat) list = list.filter(a => a.category === cat);
    const q = this.searchQuery();
    return q.trim() ? list.filter(a => matchesAttractionQuery(a, q)) : list;
  });

  constructor() {
    effect(() => {
      this.city();
      this.filterCategory.set(null);
      this.searchQuery.set('');
      this.showPersonal.set(false);
    }, { allowSignalWrites: true });
  }

  pickCategory(cat: AttractionCategory | null): void {
    this.filterCategory.set(cat);
    this.showPersonal.set(false);
  }

  commentsFor(attractionId: string): Comment[] {
    return this.comments()[attractionId] ?? [];
  }
}
