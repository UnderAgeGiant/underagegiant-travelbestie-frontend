import { ChangeDetectionStrategy, Component, ElementRef, HostListener, computed, inject, input, model, signal, viewChild } from '@angular/core';
import { City, Continent, CONTINENT_LABELS, continentOf } from '../../core/models/city.model';
import { WORLD_CITIES } from '../../data/cities.data';
import { CITY_IDS_WITH_ATTRACTIONS } from '../../data/cities-with-attractions.data';
import { LocaleService } from '../../core/i18n/locale.service';
import { normalizeSearch } from '../../core/utils/normalize-search.util';
import { FlagIconComponent } from '../flag-icon/flag-icon.component';

interface CountryGroup { country: string; flag: string; cities: City[]; }
interface ContinentGroup { continent: Continent; label: string; countries: CountryGroup[]; }

const PICKABLE = WORLD_CITIES.filter(c => CITY_IDS_WITH_ATTRACTIONS.has(c.id));
const BY_ID = new Map(WORLD_CITIES.map(c => [c.id, c]));

/**
 * Multi-select city picker (F79): continent → country → city, search, chips, a max.
 * Used by the AI first run (max 3) and the regular cities mode (max 10).
 */
@Component({
  selector: 'app-city-multi-picker',
  standalone: true,
  imports: [FlagIconComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="combo-wrap cmp" (keydown.escape)="close()">
      <div class="combo-input cmp-field" [class.open]="open()" role="combobox" tabindex="0"
           aria-haspopup="listbox" aria-controls="cmp-listbox" [attr.aria-expanded]="open()"
           i18n-aria-label="@@cmp.fieldLabel" aria-label="Ciudades de destino"
           (click)="toggle()" (keydown.enter)="toggle()" (keydown.space)="onSpace($event)">
        @for (c of selectedCities(); track c.id) {
          <span class="cmp-chip">
            <app-flag-icon [flag]="c.flag" [alt]="c.country" [size]="16" />
            {{ c.name }}
            <button type="button" class="cmp-chip-x" [attr.aria-label]="removeLabel(c.name)"
                    (click)="remove(c.id, $event)">✕</button>
          </span>
        } @empty {
          <span class="combo-placeholder" i18n="@@cmp.placeholder">Elige ciudades…</span>
        }
        <span class="cmp-caret" aria-hidden="true">▾</span>
      </div>
      @if (atLimit() && limitNote()) {
        <p class="cmp-limit" role="status">{{ limitNote() }}</p>
      }

      @if (open()) {
        <div class="combo-dropdown cmp-dropdown">
          <input #searchInput class="combo-search" type="search"
                 i18n-placeholder="@@cmp.search" placeholder="Busca una ciudad o un país…"
                 i18n-aria-label="@@cmp.search" aria-label="Busca una ciudad o un país…"
                 [value]="query()" (input)="query.set($any($event.target).value)" />
          <div class="cmp-list" id="cmp-listbox" role="listbox" aria-multiselectable="true"
               i18n-aria-label="@@cmp.fieldLabel" aria-label="Ciudades de destino">
            @for (g of groups(); track g.continent) {
              <button type="button" class="cmp-continent" [attr.data-continent]="g.continent"
                      [attr.aria-expanded]="isExpanded(g.continent)" (click)="toggleContinent(g.continent)">
                {{ g.label }}<span class="cmp-continent-caret" aria-hidden="true">▾</span>
              </button>
              @if (isExpanded(g.continent)) {
                @for (country of g.countries; track country.country) {
                  <div class="cmp-country" role="presentation">
                    <app-flag-icon [flag]="country.flag" alt="" [size]="16" />{{ country.country }}
                  </div>
                  @for (c of country.cities; track c.id) {
                    <button type="button" class="cmp-option" role="option"
                            [attr.aria-selected]="isSelected(c.id)"
                            [disabled]="isDisabled(c.id)" [attr.aria-disabled]="isDisabled(c.id)"
                            (click)="toggleCity(c.id)">{{ c.name }}</button>
                  }
                }
              }
            } @empty {
              <div class="combo-empty" i18n="@@combobox.noCities">No se encontraron ciudades</div>
            }
          </div>
          <div class="cmp-footer">
            <button type="button" class="btn-pill btn-primary cmp-done" (click)="close()"
                    i18n="@@cmp.done">Listo · {selected().length, plural, =1 {1 ciudad} other {{{selected().length}} ciudades}}</button>
          </div>
        </div>
      }
    </div>
  `,
})
export class CityMultiPickerComponent {
  private readonly locale = inject(LocaleService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  /** Two-way: `[(selected)]` or `[selected]` + `(selectedChange)`. */
  readonly selected = model<string[]>([]);
  readonly max = input.required<number>();
  /** Shown once `selected().length >= max()`. */
  readonly limitNote = input<string>('');

  readonly open = signal(false);
  readonly query = signal('');
  private readonly expanded = signal<ReadonlySet<Continent>>(new Set(['europe']));

  readonly selectedCities = computed(() => this.selected().map(id => BY_ID.get(id)).filter((c): c is City => !!c));
  readonly atLimit = computed(() => this.selected().length >= this.max());

  readonly groups = computed<ContinentGroup[]>(() => {
    const lang = this.locale.current();
    const cmp = (a: string, b: string) => a.localeCompare(b, lang);
    const q = normalizeSearch(this.query().trim());
    const tree = new Map<Continent, Map<string, City[]>>();
    for (const c of PICKABLE) {
      if (q && !normalizeSearch(c.name).includes(q) && !normalizeSearch(c.country).includes(q)) continue;
      const k = continentOf(c.region);
      const countries = tree.get(k) ?? tree.set(k, new Map()).get(k)!;
      (countries.get(c.country) ?? countries.set(c.country, []).get(c.country)!).push(c);
    }
    return [...tree.entries()]
      .map(([continent, countries]) => ({
        continent,
        label: CONTINENT_LABELS[continent],
        countries: [...countries.entries()]
          .sort(([a], [b]) => cmp(a, b))
          .map(([country, cities]) => ({ country, flag: cities[0].flag, cities: cities.sort((a, b) => cmp(a.name, b.name)) })),
      }))
      .sort((a, b) => (a.continent === 'europe' ? -1 : b.continent === 'europe' ? 1 : cmp(a.label, b.label)));
  });

  isExpanded(k: Continent): boolean {
    return !!this.query().trim() || this.expanded().has(k);
  }
  isSelected(id: string): boolean { return this.selected().includes(id); }
  isDisabled(id: string): boolean { return this.atLimit() && !this.isSelected(id); }
  removeLabel(name: string): string { return $localize`:@@cmp.remove:Quitar ${name}:city:`; }

  toggle(): void {
    if (this.open()) { this.close(); return; }
    this.open.set(true);
    setTimeout(() => this.searchInput()?.nativeElement.focus(), 0);
  }

  close(): void {
    this.open.set(false);
    this.query.set('');
  }

  onSpace(e: Event): void {
    if (e.target !== e.currentTarget) return; // a chip's ✕ button handles its own space
    e.preventDefault();
    this.toggle();
  }

  toggleContinent(k: Continent): void {
    this.expanded.update(s => {
      const next = new Set(s);
      if (!next.delete(k)) next.add(k);
      return next;
    });
  }

  toggleCity(id: string): void {
    if (this.isSelected(id)) this.selected.set(this.selected().filter(x => x !== id));
    else if (!this.atLimit()) this.selected.set([...this.selected(), id]);
  }

  remove(id: string, e: Event): void {
    e.stopPropagation();
    this.selected.set(this.selected().filter(x => x !== id));
  }

  @HostListener('document:mousedown', ['$event'])
  onOutsideClick(e: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(e.target as Node)) this.close();
  }
}
