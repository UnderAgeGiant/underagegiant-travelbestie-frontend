import { Component, input, output, signal, computed, HostListener } from '@angular/core';
import { City, Region, REGION_LABELS } from '../../core/models/city.model';
import { WORLD_CITIES } from '../../data/cities.data';

@Component({
  selector: 'app-city-combobox',
  standalone: true,
  template: `
    <div class="combo-wrap">
      <div [class]="'combo-input' + (open() ? ' open' : '')" (click)="toggleOpen()">
        @if (selected()) {
          <span style="font-size:20px">{{ selected()!.flag }}</span>
          <span style="font-weight:500">{{ selected()!.name }}</span>
          <span style="color:var(--t3);font-size:12px">{{ selected()!.country }}</span>
        } @else {
          <span class="combo-placeholder">Search city or country…</span>
        }
        <span style="margin-left:auto;color:var(--t3);font-size:11px">▾</span>
      </div>

      @if (open()) {
        <div class="combo-dropdown">
          <input class="combo-search" placeholder="Type to search…"
                 [value]="query()"
                 (input)="query.set($any($event.target).value)"
                 (click)="$event.stopPropagation()" />
          <div class="combo-list">
            @if (groupedEntries().length === 0) {
              <div class="combo-empty">No cities found</div>
            }
            @for (entry of groupedEntries(); track entry.region) {
              <div class="combo-group-label">{{ regionLabel(entry.region) }}</div>
              @for (city of entry.cities; track city.id) {
                <div class="combo-item" (click)="select(city)">
                  <span class="combo-item-flag">{{ city.flag }}</span>
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

  open = signal(false);
  query = signal('');
  private selectedCity = signal<City | null>(null);
  readonly selected = this.selectedCity.asReadonly();

  readonly filtered = computed(() => {
    const q = this.query().toLowerCase();
    return WORLD_CITIES.filter(c =>
      !this.excludeIds().includes(c.id) &&
      (c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q))
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
  toggleOpen() { this.open.update(v => !v); }

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
