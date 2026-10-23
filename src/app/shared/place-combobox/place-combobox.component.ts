import { Component, input, output, signal, computed, inject, HostListener, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Place } from '../../core/models/trip.model';
import { normalizeSearch } from '../../core/utils/normalize-search.util';

/** Compact row shape written by lib/build-places.mjs (keys kept short to keep the file small). */
interface PlaceRow { g: number; n: string; a: string; c: string; i: string }

const MAX_RESULTS = 8;
let nextId = 0;

@Component({
  selector: 'app-place-combobox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="combo-wrap">
      <div style="display:flex;align-items:center;gap:6px">
        <button #trigger type="button" role="combobox" aria-haspopup="listbox"
                [attr.aria-expanded]="open()" [attr.aria-controls]="open() ? listId : null"
                [class]="'combo-input' + (open() ? ' open' : '')"
                style="flex:1;width:100%;font:inherit;text-align:left"
                (click)="toggleOpen()" (keydown.arrowdown)="openFromKeyboard($event)">
          @if (selected(); as p) {
            <span style="font-weight:500">{{ label(p) }}</span>
          } @else {
            <span class="combo-placeholder" i18n="@@placeCombobox.placeholder">Buscar ciudad de origen…</span>
          }
          <span style="margin-left:auto;color:var(--t3);font-size:11px">▾</span>
        </button>
        @if (selected()) {
          <button type="button" aria-label="Quitar ciudad" i18n-aria-label="@@placeCombobox.clearAria"
                  style="background:none;border:none;color:var(--t3);cursor:pointer;min-width:40px;min-height:40px;padding:0;margin:-8px -6px -8px 0;font-size:16px;line-height:1;display:flex;align-items:center;justify-content:center"
                  (click)="clear()">×</button>
        }
      </div>

      @if (open()) {
        <div class="combo-dropdown">
          <input class="combo-search" #searchInput role="combobox" aria-autocomplete="list" aria-expanded="true"
                 i18n-aria-label="@@placeCombobox.searchAria" aria-label="Buscar ciudad de origen"
                 [attr.aria-controls]="listId"
                 [attr.aria-activedescendant]="active() >= 0 ? optionId(active()) : null"
                 i18n-placeholder="@@placeCombobox.searchPlaceholder" placeholder="Escribe para buscar…"
                 [value]="query()"
                 (input)="onQuery($any($event.target).value)"
                 (keydown)="onSearchKeydown($event)"
                 (focus)="ensureLoaded()"
                 (click)="$event.stopPropagation()" />
          <div class="combo-list" role="listbox" [attr.id]="listId">
            @if (failed()) {
              <div class="combo-empty" i18n="@@placeCombobox.loadError">No se pudieron cargar las ciudades</div>
            } @else if (rows() === null) {
              <div class="combo-empty" i18n="@@placeCombobox.loading">Cargando ciudades…</div>
            } @else if (filtered().length === 0) {
              <div class="combo-empty" i18n="@@placeCombobox.noResults">No se encontraron ciudades</div>
            }
            @for (p of filtered(); track p.geonameId; let i = $index) {
              <div class="combo-item" role="option" [attr.id]="optionId(i)" [attr.aria-selected]="i === active()"
                   [style.background]="i === active() ? 'oklch(95% 0.03 290)' : ''"
                   (click)="select(p)"><div class="combo-item-city">{{ label(p) }}</div></div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class PlaceComboboxComponent {
  private readonly http = inject(HttpClient);
  private readonly uid = `place-combobox-${++nextId}`;
  readonly listId = `${this.uid}-list`;

  /** Current home city, shown as the label. A pick made in this widget overrides it until the parent changes it. */
  value = input<Place | null>(null);
  placeChange = output<Place | null>();

  @ViewChild('searchInput') private searchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('trigger') private trigger?: ElementRef<HTMLButtonElement>;

  open = signal(false);
  query = signal('');
  /** Index into `filtered()` of the keyboard-highlighted option; -1 = none. */
  active = signal(-1);
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

  optionId(i: number): string {
    return `${this.uid}-opt-${i}`;
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
    if (this.open()) { this.close(true); return; }
    this.openList();
  }

  openFromKeyboard(e: Event) {
    e.preventDefault();
    this.openList();
  }

  private openList() {
    this.open.set(true);
    this.ensureLoaded();
    setTimeout(() => this.searchInput?.nativeElement.focus(), 0);
  }

  onQuery(value: string) {
    this.query.set(value);
    this.active.set(-1);
  }

  onSearchKeydown(e: KeyboardEvent) {
    const n = this.filtered().length;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (n) this.active.set((this.active() + 1) % n);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (n) this.active.set(this.active() <= 0 ? n - 1 : this.active() - 1);
        break;
      case 'Enter': {
        e.preventDefault();
        const p = this.filtered()[this.active()];
        if (p) this.select(p);
        break;
      }
      case 'Escape':
        e.preventDefault();
        this.close(true);
        break;
    }
  }

  close(refocusTrigger = false) {
    this.open.set(false);
    this.query.set('');
    this.active.set(-1);
    if (refocusTrigger) this.trigger?.nativeElement.focus();
  }

  select(place: Place) {
    this.picked.set(place);
    this.placeChange.emit(place);
    this.close(true);
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
