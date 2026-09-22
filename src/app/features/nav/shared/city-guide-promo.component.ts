import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CITY_GUIDES, CityGuideEntry } from '../../../data/city-guides.data';
import { WORLD_CITIES } from '../../../data/cities.data';
import { getAttractions } from '../../../data/attractions.data';
import { isGuideAttraction, pickTopSights } from '../../../core/seo/city-guide-seo.util';

interface PromoItem { guide: CityGuideEntry; imageUrl: string | undefined; }

/** Best-rated described sight's photo for a guide's city — same source the guide page itself
 *  uses for its "Imperdibles" cards, so the nav teaser never invents new imagery. */
function topPhotoFor(cityId: string): string | undefined {
  const city = WORLD_CITIES.find(c => c.id === cityId);
  if (!city) return undefined;
  return pickTopSights(getAttractions(city).filter(isGuideAttraction), 8).find(s => s.imageUrl)?.imageUrl;
}

/**
 * Small rotating teaser, shown next to the desktop nav's search box on the landing page only
 * (gated by NavDesktopComponent's `showCityGuidePromo` input): "Guía de destino a: <city>" over
 * a Ken-Burns'd photo, cycling through every owner-approved (`reviewed: true`) city guide.
 * Renders nothing until at least one guide is reviewed.
 */
@Component({
  selector: 'app-city-guide-promo',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (activeGuide(); as g) {
      <a class="nav-guide-promo" [routerLink]="['/ciudad', g.slug]" [attr.aria-label]="promoLabel + ' ' + g.displayName">
        @for (item of items; track item.guide.slug; let i = $index) {
          <span class="nav-guide-promo-slide" [class.active]="i === activeIndex()">
            @if (item.imageUrl) { <img [src]="item.imageUrl" [alt]="item.guide.displayName" loading="lazy" /> }
          </span>
        }
        <span class="nav-guide-promo-scrim"></span>
        <span class="nav-guide-promo-text">
          <span class="nav-guide-promo-label" i18n="@@nav.guidePromoLabel">Guía de destino a:</span>
          <span class="nav-guide-promo-city">{{ g.displayName }}</span>
        </span>
      </a>
    }
  `,
})
export class CityGuidePromoComponent implements OnInit, OnDestroy {
  private static readonly ROTATE_MS = 5000;

  protected readonly items: PromoItem[] = CITY_GUIDES
    .filter(g => g.reviewed)
    .map(guide => ({ guide, imageUrl: topPhotoFor(guide.cityId) }));

  protected readonly activeIndex = signal(0);
  protected readonly activeGuide = computed(() => this.items[this.activeIndex()]?.guide ?? null);
  /** Plain (non-$localize) fallback for the aria-label concat — $localize can't run inside a
   *  template expression, so the visible i18n text lives in .nav-guide-promo-label instead. */
  protected readonly promoLabel = 'Guía de destino a:';

  private timer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    if (this.items.length > 1) {
      this.timer = setInterval(
        () => this.activeIndex.update(i => (i + 1) % this.items.length),
        CityGuidePromoComponent.ROTATE_MS,
      );
    }
  }

  ngOnDestroy(): void { clearInterval(this.timer); }
}
