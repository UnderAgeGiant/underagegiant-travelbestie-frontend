import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { NavShellComponent } from '../nav/nav-shell.component';
import { ProfileComponent } from '../profile/profile.component';
import { ApiService } from '../../core/api/api.service';
import { SeoService } from '../../core/seo/seo.service';
import { pickTopSights, isGuideAttraction } from '../../core/seo/city-guide-seo.util';
import { TravelInfoService } from '../../core/travel-info/travel-info.service';
import { VisaRequirementService } from '../../core/visa/visa-requirement.service';
import type { SeoCityPlan } from '../../core/models/seo-city-plan.model';
import { WORLD_CITIES } from '../../data/cities.data';
import { getAttractions } from '../../data/attractions.data';
import { guideBySlug } from '../../data/city-guides.data';
import { environment } from '../../../environments/environment';
import { buildCityGuide } from './city-guide.model';
import { computeGuideFacts } from './guide-facts';
import { guideSeoPage } from './guide-seo-page';
import { photoCreditUrl } from './photo-credit.util';

@Component({
  selector: 'app-city-guide',
  imports: [NavShellComponent, ProfileComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cg-page">
      <app-nav (logoClick)="goHome()" (profileClick)="showProfile.set(true)" />
      @if (showProfile()) { <app-profile (close)="showProfile.set(false)" /> }

      @if (model(); as m) {
        <main class="cg-main">
          <header class="cg-hero">
            <div class="cg-eyebrow" i18n="@@cityGuide.eyebrow">Guía de viaje {{ m.city.flag }}</div>
            <h1 i18n="@@cityGuide.h1">Qué hacer en {{ m.entry.displayName }}</h1>
            <p class="cg-intro">{{ m.entry.intro }}</p>
            <button type="button" class="btn-pill btn-primary cg-cta" (click)="startPlan()"
                    i18n="@@cityGuide.cta">Planificar mi viaje a {{ m.entry.displayName }}</button>
          </header>

          <section class="cg-facts" aria-labelledby="cg-facts-h">
            <h2 id="cg-facts-h" i18n="@@cityGuide.factsTitle">Viajando desde Chile</h2>
            <ul>
              @if (m.facts.visa; as v) { <li><span>{{ v.icon }}</span> <b i18n="@@cityGuide.factVisa">Visa:</b> {{ v.label }}</li> }
              @if (m.facts.currency) { <li><span>🪙</span> <b i18n="@@cityGuide.factCurrency">Moneda:</b> {{ m.facts.currency }}</li> }
              @if (m.facts.plug) { <li><span>🔌</span> <b i18n="@@cityGuide.factPlug">Enchufes:</b> {{ m.facts.plug }}</li> }
              <li><span>🕒</span> <b i18n="@@cityGuide.factTime">Hora:</b> {{ m.facts.timeDifference }}</li>
            </ul>
          </section>

          <section class="cg-must" aria-labelledby="cg-must-h">
            <h2 id="cg-must-h" i18n="@@cityGuide.mustSee">Imperdibles de {{ m.entry.displayName }}</h2>
            <div class="cg-grid">
              @for (a of m.mustSee; track a.id) {
                <article class="cg-card">
                  @if (a.imageUrl) { <img [src]="a.imageUrl" [alt]="a.name" loading="lazy" width="640" height="420" /> }
                  <div class="cg-card-body">
                    <h3>{{ a.name }}</h3>
                    <div class="cg-meta">★ {{ a.rating }} · {{ a.icon }} {{ a.type }}</div>
                    <p>{{ a.description }}</p>
                    <div class="cg-src">
                      @if (a.sourceUrl) { <a [attr.href]="a.sourceUrl" target="_blank" rel="noopener noreferrer" i18n="@@cityGuide.srcWikipedia">Wikipedia</a> }
                      @if (credit(a.imageUrl); as c) { <a [attr.href]="c" target="_blank" rel="noopener noreferrer" i18n="@@cityGuide.srcPhoto">Foto: Wikimedia Commons</a> }
                    </div>
                  </div>
                </article>
              }
            </div>
          </section>

          @for (s of m.sections; track s.category) {
            <section class="cg-more">
              <h2 i18n="@@cityGuide.moreIn">{{ s.label }} en {{ m.entry.displayName }}</h2>
              <ul class="cg-list">
                @for (a of s.items; track a.id) {
                  <li>
                    <b>{{ a.name }}</b> <span class="cg-meta">★ {{ a.rating }}</span>
                    <span>{{ a.description }}</span>
                    @if (a.sourceUrl) { <a [attr.href]="a.sourceUrl" target="_blank" rel="noopener noreferrer" i18n="@@cityGuide.srcWikipedia2">Wikipedia</a> }
                  </li>
                }
              </ul>
            </section>
          }

          @if (m.dayTrips.length) {
            <section class="cg-daytrips">
              <h2 i18n="@@cityGuide.dayTrips">Excursiones de un día desde {{ m.entry.displayName }}</h2>
              <ul class="cg-list">
                @for (a of m.dayTrips; track a.id) {
                  <li>
                    <b>{{ a.name }}</b> <span class="cg-meta">★ {{ a.rating }}</span>
                    <span>{{ a.description }}</span>
                    @if (a.sourceUrl) { <a [attr.href]="a.sourceUrl" target="_blank" rel="noopener noreferrer" i18n="@@cityGuide.srcWikipedia3">Wikipedia</a> }
                  </li>
                }
              </ul>
            </section>
          }

          <section class="cg-practical">
            <h2 i18n="@@cityGuide.whenTitle">Cuándo ir</h2><p>{{ m.entry.bestTime }}</p>
            <h2 i18n="@@cityGuide.getTitle">Cómo llegar desde Chile</h2><p>{{ m.entry.gettingThere }}</p>
            <h2 i18n="@@cityGuide.tipsTitle">Consejos prácticos</h2>
            <ul>@for (t of m.entry.tips; track t) { <li>{{ t }}</li> }</ul>
          </section>

          @if (plans().length) {
            <section class="cg-plans">
              <h2 i18n="@@cityGuide.plansTitle">Itinerarios reales de viajeros que pasan por {{ m.entry.displayName }}</h2>
              <ul class="cg-list">
                @for (p of plans(); track p.id) {
                  <li>
                    <a [routerLink]="['/shared', p.id]">{{ p.tripName }}</a>
                    <span class="cg-meta">{{ p.cities.join(' → ') }} · {{ p.attractionCount }} <ng-container i18n="@@cityGuide.planStops">lugares</ng-container> · ♥ {{ p.favoriteCount }}</span>
                  </li>
                }
              </ul>
            </section>
          }

          <section class="cg-faq">
            <h2 i18n="@@cityGuide.faqTitle">Preguntas frecuentes</h2>
            @for (f of m.entry.faq; track f.q) {
              <details><summary>{{ f.q }}</summary><p>{{ f.a }}</p></details>
            }
          </section>

          @if (m.related.length) {
            <nav class="cg-related" aria-labelledby="cg-rel-h">
              <h2 id="cg-rel-h" i18n="@@cityGuide.relatedTitle">Otras guías</h2>
              <ul>@for (r of m.related; track r.slug) { <li><a [routerLink]="['/ciudad', r.slug]">{{ r.displayName }}</a></li> }</ul>
            </nav>
          }

          <footer class="cg-foot" i18n="@@cityGuide.license">
            Las descripciones de los lugares provienen de Wikipedia y se publican bajo licencia CC BY-SA 4.0; las fotos, de Wikimedia Commons, con la licencia indicada en cada archivo.
          </footer>
        </main>
      }
    </div>
  `,
})
export class CityGuideComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);
  private readonly api = inject(ApiService);
  private readonly visa = inject(VisaRequirementService);
  private readonly travelInfo = inject(TravelInfoService);

  readonly showProfile = signal(false);
  readonly plans = signal<SeoCityPlan[]>([]);

  private readonly slug = toSignal(this.route.paramMap.pipe(map(p => p.get('slug') ?? '')), { initialValue: '' });

  readonly model = computed(() => {
    const entry = guideBySlug(this.slug());
    const city = entry && WORLD_CITIES.find(c => c.id === entry.cityId);
    if (!entry || !city) return null;
    const facts = computeGuideFacts(city, entry, new Date(), { visa: this.visa, travelInfo: this.travelInfo });
    return buildCityGuide(entry, city, getAttractions(city), facts);
  });

  constructor() {
    effect(() => {
      const m = this.model();
      if (!m) return;
      untracked(() => {
        const top = pickTopSights(getAttractions(m.city).filter(isGuideAttraction), 10);
        this.seo.apply(guideSeoPage(m, environment.siteUrl, top));
        this.api.getSeoCityPlans(m.entry.cityId).subscribe({
          next: r => this.plans.set(r.items),
          error: () => this.plans.set([]),
        });
      });
    }, { allowSignalWrites: true });
  }

  protected credit(imageUrl: string | undefined): string | null { return photoCreditUrl(imageUrl); }
  protected startPlan(): void {
    const m = this.model();
    if (m) void this.router.navigate(['/'], { queryParams: { addCity: m.entry.cityId } });
  }
  protected goHome(): void { void this.router.navigate(['/']); }
}
