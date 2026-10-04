import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, LOCALE_ID, OnInit, afterNextRender, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RankingService } from '../../../core/rankings/ranking.service';
import { MIEL_HOST_IMAGE, RankingKey, buildCharts, formatLastUpdate, formatWeekStart, myRankFor } from './landing-ranking.util';

@Component({
  selector: 'tb-landing-ranking',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="landing-snap-child landing-ranking" [class.filled]="filled()" aria-labelledby="rk-title">
      <header class="rk-head">
        <div class="rk-miel tb-soap-bubble"><img [src]="mielImage" alt="Asistente Miel" i18n-alt="@@ranking.mielAlt" width="112" height="112" /></div>
        <div class="rk-bubble">
          <h2 id="rk-title" i18n="@@ranking.title">Ranking de la semana</h2>
          <p i18n="@@ranking.bubble">¡Así va la semana, viajeros!</p>
        </div>
      </header>

      @if (svc.weekly() || svc.weeklyError()) {
        <div class="rk-grid">
          @for (chart of charts(); track chart.key) {
            <article class="rk-chart" [class.rk-fallback]="chart.fallback">
              <h3>{{ chart.title }}</h3>
              <ol class="rk-rows">
                @for (row of chart.rows; track $index) {
                  <li class="rk-row" [style.--i]="$index">
                    <span class="rk-rank">{{ $index + 1 }}</span>
                    <span class="rk-label">
                      @if (row.link) { <a [routerLink]="row.link">{{ row.label }}</a> } @else { {{ row.label }} }
                      @if (row.sublabel) { <small>{{ row.sublabel }}</small> }
                    </span>
                    <span class="rk-bar" aria-hidden="true"><span class="rk-bar-fill" [style.--pct]="row.pct + '%'"></span></span>
                    <span class="rk-value">{{ row.value }}</span>
                  </li>
                }
              </ol>
              @if (chart.key !== 'destinations' && !svc.mineError()) {
                <div class="rk-me">
                  @if (svc.mineLoading()) {
                    <span class="rk-calc"><span class="rk-calc-bar" aria-hidden="true"></span><span i18n="@@ranking.calculating">Calculando…</span></span>
                  } @else if (me(chart.key); as m) {
                    <span><strong i18n="@@ranking.you">Tú</strong> · #{{ m.rank }} · {{ m.value }}</span>
                  } @else {
                    <span i18n="@@ranking.notYet">Aún no apareces esta semana</span>
                  }
                </div>
              }
            </article>
          }
        </div>
      }

      @if (lastUpdate(); as lu) {
        <p class="rk-updated">
          <span i18n="@@ranking.weekOf">Semana del</span> {{ lu.week }} ·
          <span i18n="@@ranking.lastUpdate">Última actualización:</span> {{ lu.at }}
        </p>
      }
    </section>
  `,
})
export class LandingRankingComponent implements OnInit {
  readonly svc = inject(RankingService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly locale = inject(LOCALE_ID);
  readonly mielImage = MIEL_HOST_IMAGE;
  readonly filled = signal(false);

  readonly charts = computed(() => buildCharts(this.svc.weekly(), this.svc.weeklyError()));
  readonly lastUpdate = computed(() => {
    const w = this.svc.weekly();
    if (!w || this.svc.weeklyError()) return null;
    return { at: formatLastUpdate(w.generatedAt, this.locale), week: formatWeekStart(w.weekStart, this.locale) };
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    // Not InViewDirective: that one self-disconnects after the first hit; the bars must refill on every pass.
    afterNextRender(() => {
      const io = new IntersectionObserver(([e]) => this.filled.set(e.isIntersecting), { threshold: 0.3 });
      io.observe(this.host.nativeElement);
      destroyRef.onDestroy(() => io.disconnect());
    });
  }

  ngOnInit(): void {
    this.svc.load();
    this.svc.loadMine();
  }

  me(key: RankingKey) { return myRankFor(key, this.svc.mine()); }
}
