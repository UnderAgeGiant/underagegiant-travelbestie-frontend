import { Component, input, output, signal, computed, effect, HostListener, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { Country, WORLD_COUNTRIES } from '../../data/countries.data';
import { normalizeSearch } from '../../core/utils/normalize-search.util';

@Component({
  selector: 'app-country-combobox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="combo-wrap">
      <div [class]="'combo-input' + (open() ? ' open' : '')" (click)="toggleOpen()">
        @if (selected()) {
          <span style="font-size:20px">{{ selected()!.flag }}</span>
          <span style="font-weight:500">{{ selected()!.name }}</span>
        } @else {
          <span class="combo-placeholder" i18n="@@combobox.countryPlaceholder">Buscar país…</span>
        }
        <span style="margin-left:auto;color:var(--t3);font-size:11px">▾</span>
      </div>

      @if (open()) {
        <div class="combo-dropdown">
          <input class="combo-search" #searchInput
                 i18n-placeholder="@@combobox.countrySearchPlaceholder" placeholder="Escribe para buscar…"
                 [value]="query()"
                 (input)="query.set($any($event.target).value)"
                 (click)="$event.stopPropagation()" />
          <div class="combo-list">
            @if (filtered().length === 0) {
              <div class="combo-empty" i18n="@@combobox.noCountries">No se encontraron países</div>
            }
            @for (country of filtered(); track country.code) {
              <div class="combo-item" (click)="select(country)">
                <span style="font-size:18px">{{ country.flag }}</span>
                <div class="combo-item-city">{{ country.name }}</div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class CountryComboboxComponent {
  initialCode = input<string | null>(null);
  countryChange = output<Country>();

  @ViewChild('searchInput') private searchInput?: ElementRef<HTMLInputElement>;

  open = signal(false);
  query = signal('');
  private selectedCountry = signal<Country | null>(null);
  readonly selected = this.selectedCountry.asReadonly();

  readonly filtered = computed(() => {
    const q = normalizeSearch(this.query());
    return WORLD_COUNTRIES.filter(c => normalizeSearch(c.name).includes(q));
  });

  constructor() {
    effect(() => {
      const code = this.initialCode();
      this.selectedCountry.set(code ? WORLD_COUNTRIES.find(c => c.code === code) ?? null : null);
    });
  }

  toggleOpen() {
    this.open.update(v => !v);
    if (this.open()) {
      setTimeout(() => this.searchInput?.nativeElement.focus(), 0);
    }
  }

  select(country: Country) {
    this.selectedCountry.set(country);
    this.open.set(false);
    this.query.set('');
    this.countryChange.emit(country);
  }

  @HostListener('document:mousedown', ['$event'])
  onOutsideClick(e: MouseEvent) {
    if (!(e.target as Element).closest('app-country-combobox')) {
      this.open.set(false);
    }
  }
}
