import {
  ChangeDetectionStrategy, Component, ElementRef, OnDestroy, Renderer2,
  computed, effect, inject, input, output, signal, viewChild,
} from '@angular/core';
import { City } from '../../core/models/city.model';
import { VisaRequirementService } from '../../core/visa/visa-requirement.service';
import { getVisaRequirementMeta } from '../../core/models/visa-requirement.model';
import { TravelInfoService } from '../../core/travel-info/travel-info.service';
import { formatCurrencyLabel, formatPlugLabel } from '../../core/models/travel-info-badge.model';
import { countryCodeFromFlagEmoji } from '../flag-icon/flag-emoji.util';

/**
 * Combines the visa/currency/plug info that used to be three always-visible badges
 * on each stop card (`.stop-visa-badge`/`.stop-currency-badge`/`.stop-plug-badge`)
 * into one small hoverable trigger + floating popover — same hover-delay/
 * viewport-flip/touch-click pattern as StopListComponent's weather-chip popover
 * (now itself extracted into CityWeatherChipComponent, see Task 2). Renders nothing
 * at all when none of the three rows have anything to show for this city.
 *
 * The popover itself is reparented to <body> (same Renderer2.appendChild technique
 * CitySuggestCloudComponent/HighlightTourComponent use for their whole host, applied
 * here to just the popover child) because the trigger normally lives inside a
 * `.stop-item` card, and that card's hover/active `transform` establishes a new
 * containing block *and* stacking context for any `position: fixed` descendant —
 * without reparenting, the popover gets visually trapped behind later sibling cards
 * instead of floating above the whole page next to the cursor.
 */
@Component({
  selector: 'app-city-info-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .city-info-trigger {
      display: inline-flex; align-items: center; gap: 3px;
      margin-top: 4px; font-size: 10px; font-weight: 600;
      color: var(--t3); cursor: pointer; border-radius: 6px;
    }
    .city-info-trigger:focus-visible { outline: 2px solid var(--lav-d); outline-offset: 2px; }
    .city-info-mark {
      font-size: 8px; font-weight: 700; color: var(--t3);
      background: var(--border); border-radius: 50%;
      width: 11px; height: 11px; display: inline-flex;
      align-items: center; justify-content: center;
    }
    .city-info-popover {
      position: fixed; z-index: 900;
      min-width: 190px; max-width: 240px;
      background: #fff; border-radius: 12px; box-shadow: var(--sh-lg);
      padding: 8px; pointer-events: none;
      display: flex; flex-direction: column; gap: 4px;
      animation: fadeIn .15s ease;
    }
    .city-info-row { display: flex; align-items: center; gap: 6px; font-size: 11px; font-family: inherit; color: var(--t2); pointer-events: auto; }
    .city-info-row.city-info-cta {
      color: var(--t3); font-style: italic; font-size: 11px; font-family: inherit; font-weight: 400;
      cursor: pointer; background: none; border: none; padding: 0; text-align: left;
    }
    .city-info-row.city-info-cta:focus-visible { outline: 2px solid var(--lav-d); outline-offset: -2px; border-radius: 2px; }
    .city-info-popover { pointer-events: auto; }
  `],
  template: `
    @if (hasInfo()) {
      <span class="city-info-trigger" tabindex="0"
            (mouseenter)="onHover($event)" (mouseleave)="onHoverLeave()"
            (focus)="onHover($event)" (blur)="onHoverLeave()"
            (click)="onClick($event)">
        <span i18n="@@cityInfo.trigger">Información sobre la ciudad</span>
        <span class="city-info-mark">?</span>
      </span>
    }
    @if (open(); as pos) {
      <div class="city-info-popover" #popoverEl role="tooltip" [style.left.px]="pos.x" [style.top.px]="pos.y"
           (mouseenter)="onHover($event)" (mouseleave)="onHoverLeave()">
        @if (visaItem(); as v) {
          @if (v.cta) {
            <button type="button" class="city-info-row city-info-cta" (click)="onCtaClick($event)">
              <span>{{ v.icon }}</span> {{ v.label }}
            </button>
          } @else {
            <div class="city-info-row"><span>{{ v.icon }}</span> {{ v.label }}</div>
          }
        }
        @if (currencyItem(); as c) {
          <div class="city-info-row"><span>{{ c.icon }}</span> {{ c.label }}</div>
        }
        @if (plugItem(); as p) {
          <div class="city-info-row"><span>{{ p.icon }}</span> {{ p.label }}</div>
        }
      </div>
    }
  `,
})
export class CityInfoBadgeComponent implements OnDestroy {
  private readonly visaRequirement = inject(VisaRequirementService);
  private readonly travelInfo = inject(TravelInfoService);
  private readonly renderer = inject(Renderer2);

  readonly city = input.required<City>();
  readonly homeIso2 = input<string | null>(null);
  readonly isLoggedIn = input(false);

  readonly ctaClick = output<void>();

  protected readonly setCountryCta = $localize`:@@cityInfo.setCountryCta:Agrega tu país de residencia para ver info de visa`;

  private readonly destIso2 = computed(() => countryCodeFromFlagEmoji(this.city().flag));

  protected readonly visaItem = computed(() => {
    if (!this.isLoggedIn()) return null;
    const home = this.homeIso2();
    if (!home) return { cta: true, icon: '🛂', label: this.setCountryCta };
    const dest = this.destIso2();
    if (!dest) return null;
    const result = this.visaRequirement.requirement(home, dest);
    if (!result) return null;
    const meta = getVisaRequirementMeta(result.category, result.days);
    return { cta: false, icon: meta.icon, label: meta.label };
  });

  protected readonly currencyItem = computed(() => {
    const dest = this.destIso2();
    if (!dest) return null;
    const currency = this.travelInfo.currencyInfo(dest);
    if (!currency) return null;
    return { icon: '🪙', label: formatCurrencyLabel(currency.name, currency.symbol) };
  });

  protected readonly plugItem = computed(() => {
    const dest = this.destIso2();
    if (!dest) return null;
    const plug = this.travelInfo.plugInfo(dest, this.homeIso2());
    if (!plug) return null;
    const icon = plug.adapterNeeded === true ? '🔌⚠️' : '🔌';
    return { icon, label: formatPlugLabel(plug.plugTypes, plug.voltages, plug.adapterNeeded) };
  });

  protected readonly hasInfo = computed(() => !!(this.visaItem() || this.currencyItem() || this.plugItem()));

  protected readonly open = signal<{ x: number; y: number } | null>(null);
  private hoverTimer: ReturnType<typeof setTimeout> | null = null;

  // Reparents the popover to <body> every time it's (re)created by the @if above,
  // so it always escapes the trigger's card — see the class doc comment.
  protected readonly popoverEl = viewChild<ElementRef<HTMLElement>>('popoverEl');
  private readonly reparentPopover = effect(() => {
    const el = this.popoverEl();
    if (el) this.renderer.appendChild(document.body, el.nativeElement);
  });

  ngOnDestroy(): void {
    this.popoverEl()?.nativeElement.remove();
  }

  protected onHover(e: MouseEvent | FocusEvent): void {
    if (this.hoverTimer) clearTimeout(this.hoverTimer);
    this.hoverTimer = setTimeout(() => {
      const cardW = 220;
      const cardH = 120;
      let x: number;
      let y: number;
      if (e instanceof MouseEvent) {
        x = e.clientX + 14;
        y = e.clientY + 14;
      } else {
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        x = rect.right + 10;
        y = rect.top;
      }
      if (x + cardW > window.innerWidth) x -= cardW + 28;
      y = Math.min(y, window.innerHeight - cardH);
      this.open.set({ x, y });
    }, 150);
  }

  protected onHoverLeave(): void {
    if (this.hoverTimer) clearTimeout(this.hoverTimer);
    // Use a small delay (50ms) to allow moving from trigger to popover without closing
    this.hoverTimer = setTimeout(() => {
      this.open.set(null);
      this.hoverTimer = null;
    }, 50);
  }

  protected onClick(e: MouseEvent): void {
    e.stopPropagation();
    if (!window.matchMedia('(hover: none)').matches) return; // desktop/hover-capable: hover already handles it
    if (this.open()) { this.open.set(null); return; }
    const cardW = 220;
    const cardH = 120;
    const x = Math.max(12, Math.min(e.clientX - cardW / 2, window.innerWidth - cardW - 12));
    const y = Math.min(e.clientY + 16, window.innerHeight - cardH - 12);
    this.open.set({ x, y });
  }

  protected onCtaClick(e: Event): void {
    e.stopPropagation();
    this.open.set(null);
    this.ctaClick.emit();
  }
}
