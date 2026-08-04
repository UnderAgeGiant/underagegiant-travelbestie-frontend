import { Component, input, output, signal, computed, HostListener, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { City, Region, REGION_LABELS } from '../../core/models/city.model';
import { WORLD_CITIES } from '../../data/cities.data';
import { FlagIconComponent } from '../flag-icon/flag-icon.component';
import { normalizeSearch } from '../../core/utils/normalize-search.util';

@Component({
  selector: 'app-city-combobox',
  standalone: true,
  imports: [FlagIconComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="combo-wrap">
      <div [class]="'combo-input' + (open() ? ' open' : '')" (click)="toggleOpen()">
        @if (selected()) {
          <app-flag-icon [flag]="selected()!.flag" [alt]="selected()!.name" [size]="20" />
          <span style="font-weight:500">{{ selected()!.name }}</span>
          <span style="color:var(--t3);font-size:12px">{{ selected()!.country }}</span>
        } @else {
          <span class="combo-placeholder" i18n="@@combobox.placeholder">Buscar ciudad o país…</span>
        }
        <span style="margin-left:auto;color:var(--t3);font-size:11px">▾</span>
      </div>

      @if (open()) {
        <div class="combo-dropdown">
          <input class="combo-search" #searchInput
                 i18n-placeholder="@@combobox.searchPlaceholder" placeholder="Escribe para buscar…"
                 [value]="query()"
                 (input)="query.set($any($event.target).value)"
                 (click)="$event.stopPropagation()" />
          <div class="combo-list">
            @if (groupedEntries().length === 0) {
              <div class="combo-empty" i18n="@@combobox.noCities">No se encontraron ciudades</div>
            }
            @for (entry of groupedEntries(); track entry.region) {
              <div class="combo-group-label">{{ regionLabel(entry.region) }}</div>
              @for (city of entry.cities; track city.id) {
                <div class="combo-item" (click)="select(city)">
                  <app-flag-icon class="combo-item-flag" [flag]="city.flag" [alt]="city.name" [size]="18" />
                  <div>
                    <div class="combo-item-city">{{ city.name }}</div>
                    <div class="combo-item-country">{{ city.country }}</div>
                  </div>
                </div>
              }
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class CityComboboxComponent {
  excludeIds = input<string[]>([]);
  cityChange = output<City>();

  @ViewChild('searchInput') private searchInput?: ElementRef<HTMLInputElement>;

  open = signal(false);
  query = signal('');
  private selectedCity = signal<City | null>(null);
  readonly selected = this.selectedCity.asReadonly();

  readonly filtered = computed(() => {
    const q = normalizeSearch(this.query());
    return WORLD_CITIES.filter(c =>
      !this.excludeIds().includes(c.id) &&
      (normalizeSearch(c.name).includes(q) || normalizeSearch(c.country).includes(q))
    );
  });

  readonly groupedEntries = computed(() => {
    const map = new Map<Region, City[]>();
    for (const city of this.filtered()) {
      if (!map.has(city.region)) map.set(city.region, []);
      map.get(city.region)!.push(city);
    }
    return Array.from(map.entries()).map(([region, cities]) => ({ region, cities }));
  });

  regionLabel(r: Region): string { return REGION_LABELS[r]; }

  toggleOpen() {
    this.open.update(v => !v);
    if (this.open()) {
      setTimeout(() => this.searchInput?.nativeElement.focus(), 0);
    }
  }

  select(city: City) {
    this.selectedCity.set(city);
    this.open.set(false);
    this.query.set('');
    this.cityChange.emit(city);
  }

  @HostListener('document:mousedown', ['$event'])
  onOutsideClick(e: MouseEvent) {
    if (!(e.target as Element).closest('app-city-combobox')) {
      this.open.set(false);
    }
  }
}
