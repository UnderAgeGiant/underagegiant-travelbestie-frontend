import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, output, signal } from '@angular/core';
import { TripStop } from '../../core/models/trip.model';
import { isPersonal, resolvePlannedAttraction } from '../../core/utils/personal-activity.util';
import { attractionName } from '../../core/utils/attraction-name.util';
import { LocaleService } from '../../core/i18n/locale.service';
import { AppLocale } from '../../core/i18n/locale.util';

export interface PillItem { id: string; name: string; imageUrl: string; }

export function presentationPillItems(stops: TripStop[], locale: AppLocale): PillItem[] {
  const seen = new Set<string>();
  const items: PillItem[] = [];
  for (const stop of stops) {
    for (const p of stop.selectedAttractions ?? []) {
      if (isPersonal(p)) continue;
      const a = resolvePlannedAttraction(stop.cityId, p);
      if (!a?.imageUrl || seen.has(a.id)) continue;
      seen.add(a.id);
      items.push({ id: a.id, name: attractionName(a, locale), imageUrl: a.imageUrl });
    }
  }
  return items;
}

const ROTATE_MS = 5000;

/** T5 (designer feedback 2026-10-08): "🎞️ Presentación del plan" as a rotating photo pill, modeled on CityGuidePromoComponent. */
@Component({
  selector: 'tb-plan-presentation-pill',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (items().length > 0) {
      <button type="button" class="pp-pill" [class.pp-pill--attention]="attention()" (click)="open.emit()"
              i18n-aria-label="@@planPill.aria" aria-label="Presentación del plan">
        @for (item of items(); track item.id; let i = $index) {
          <span class="pp-slide" [class.active]="i === active()">
            @if (near(i)) { <img [src]="item.imageUrl" alt="" /> }
          </span>
        }
        <span class="pp-scrim"></span>
        <span class="pp-text">
          <span class="pp-label" i18n="@@planPill.label">🎞️ Presentación del plan</span>
          <span class="pp-name">{{ items()[active()]?.name }}</span>
        </span>
      </button>
    } @else {
      <button type="button" class="btn-pill btn-outline" (click)="open.emit()" i18n="@@planPill.label">🎞️ Presentación del plan</button>
    }
  `,
})
export class PlanPresentationPillComponent {
  readonly stops = input.required<TripStop[]>();
  readonly attention = input(false);
  readonly open = output<void>();

  private readonly locale = inject(LocaleService);
  protected readonly items = computed(() => presentationPillItems(this.stops(), this.locale.current()));
  protected readonly active = signal(0);

  constructor() {
    const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = reduced ? undefined : setInterval(() => {
      const n = this.items().length;
      if (n > 1) this.active.update(i => (i + 1) % n);
    }, ROTATE_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
    // A plan edit can shrink the list under the current index.
    effect(() => { if (this.active() >= this.items().length) this.active.set(0); });
  }

  /** Only the active slide and its neighbours load an image. */
  protected near(i: number): boolean {
    const n = this.items().length, a = this.active();
    return i === a || i === (a + 1) % n || i === (a - 1 + n) % n;
  }
}
