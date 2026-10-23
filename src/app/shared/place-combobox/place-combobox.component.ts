import { Component, input, output, signal, computed, inject, HostListener, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Place } from '../../core/models/trip.model';
import { normalizeSearch } from '../../core/utils/normalize-search.util';

/** Compact row shape written by lib/build-places.mjs (keys kept short to keep the file small). */
interface PlaceRow { g: number; n: string; a: string; c: string; i: string }

const MAX_RESULTS = 8;

@Component({
  selector: 'app-place-combobox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="combo-wrap">
      <div [class]="'combo-input' + (open() ? ' open' : '')" (click)="toggleOpen()">
        @if (selected(); as p) {
          <span style="font-weight:500">{{ label(p) }}</span>
          <button type="button" aria-label="Quitar ciudad" i18n-aria-label="@@placeCombobox.clearAria"
                  style="background:none;border:none;color:var(--t3);cursor:pointer;margin-left:6px;padding:0 4px"
                  (click)="$event.stopPropagation(); clear()">×</button>
        } @else {
          <span class="combo-placeholder" i18n="@@placeCombobox.placeholder">Buscar ciudad de origen…</span>
        }
        <span style="margin-left:auto;color:var(--t3);font-size:11px">▾</span>
      </div>

      @if (open()) {
        <div class="combo-dropdown">
          <input class="combo-search" #searchInput
                 i18n-placeholder="@@placeCombobox.searchPlaceholder" placeholder="Escribe para buscar…"
                 [value]="query()"
                 (input)="query.set($any($event.target).value)"
                 (focus)="ensureLoaded()"
                 (click)="$event.stopPropagation()" />
          <div class="combo-list">
            @if (failed()) {
              <div class="combo-empty" i18n="@@placeCombobox.loadError">No se pudieron cargar las ciudades</div>
            } @else if (rows() === null) {
              <div class="combo-empty" i18n="@@placeCombobox.loading">Cargando ciudades…</div>
            } @else if (filtered().length === 0) {
              <div class="combo-empty" i18n="@@placeCombobox.noResults">No se encontraron ciudades</div>
            }
            @for (p of filtered(); track p.geonameId) {
              <div class="combo-item" (click)="select(p)"><div class="combo-item-city">{{ label(p) }}</div></div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class PlaceComboboxComponent {
  private readonly http = inject(HttpClient);

  /** Current home city, shown as the label. A pick made in this widget overrides it until the parent changes it. */
  value = input<Place | null>(null);
  placeChange = output<Place | null>();

  @ViewChild('searchInput') private searchInput?: ElementRef<HTMLInputElement>;

  open = signal(false);
  query = signal('');
  failed = signal(false);
  protected rows = signal<PlaceRow[] | null>(null);
  private loading = false;
  private picked = signal<Place | null | undefined>(undefined);
  readonly selected = computed(() => {
    const p = this.picked();
    return p !== undefined ? p : this.value();
  });

  /** Prefix match on the accent-folded ascii name; file order is population order, so the first 8 are the biggest. */
  readonly filtered = computed<Place[]>(() => {
    const rows = this.rows();
    if (!rows) return [];
    const q = normalizeSearch(this.query()).trim();
    const out: Place[] = [];
    for (const r of rows) {
      if (!r.a.startsWith(q)) continue;
      out.push({ geonameId: r.g, name: r.n, countryCode: r.c, iata: r.i });
      if (out.length === MAX_RESULTS) break;
    }
    return out;
  });

  label(p: Place): string {
    return `${p.name}, ${p.countryCode} · ${p.iata}`;
  }

  /** Fetched once per instance, on first open/focus — never on page load. */
  ensureLoaded(): void {
    if (this.rows() || this.loading) return;
    this.loading = true;
    this.failed.set(false);
    this.http.get<PlaceRow[]>('/data/places.json').subscribe({
      next: rows => { this.rows.set(rows); this.loading = false; },
      error: () => { this.failed.set(true); this.loading = false; },
    });
  }

  toggleOpen() {
    this.open.update(v => !v);
    if (this.open()) {
      this.ensureLoaded();
      setTimeout(() => this.searchInput?.nativeElement.focus(), 0);
    }
  }

  select(place: Place) {
    this.picked.set(place);
    this.open.set(false);
    this.query.set('');
    this.placeChange.emit(place);
  }

  clear() {
    this.picked.set(null);
    this.placeChange.emit(null);
  }

  @HostListener('document:mousedown', ['$event'])
  onOutsideClick(e: MouseEvent) {
    if (!(e.target as Element).closest('app-place-combobox')) {
      this.open.set(false);
    }
  }
}
