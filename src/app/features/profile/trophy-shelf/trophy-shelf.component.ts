import { AfterViewInit, Component, ElementRef, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TrophyService } from '../../../core/trophies/trophy.service';
import {
  SINGLE_TYPES, TIERED_TYPES, isKnownTrophy, TROPHY_THRESHOLDS, tierLabel, trophyDescription, trophyImage, trophyKey, trophyName,
} from '../../../core/trophies/trophy-catalog';
import { EarnedTrophy, TrophyTier, TrophyType } from '../../../core/models/trophy.model';

interface Row { type: TrophyType; tier: TrophyTier; earnedAt: string | null; count: number; needed: number; }

/** Profile trophy section: earned medals float as soap bubbles; "Ver todos" toggles in place to the full grouped list. */
@Component({
  selector: 'tb-trophy-shelf',
  standalone: true,
  imports: [DatePipe],
  host: { id: 'trofeos' },
  template: `
    <section class="ts">
      <div class="section-head" i18n="@@trophy.title">Mis trofeos 🏆</div>

      @if (svc.loadError()) {
        <div class="section-empty">
          <span i18n="@@trophy.loadError">No pudimos cargar tus trofeos.</span>
          <button class="btn-pill btn-outline ts-retry" type="button" (click)="svc.load()" i18n="@@trophy.retry">Reintentar</button>
        </div>
      } @else if (!showAll()) {
        @if (svc.loading() && bubbles().length === 0) {
          <div class="ts-empty"><p i18n="@@trophy.loading">Cargando…</p></div>
        } @else if (bubbles().length === 0) {
          <div class="ts-empty">
            <img src="/Dog-waiting-1.png" alt="" width="96" height="96" />
            <p i18n="@@trophy.empty">Aún no tienes trofeos, ¡empieza a planear!</p>
          </div>
        } @else {
          <div class="ts-bubbles">
            @for (b of bubbles(); track key(b); let i = $index) {
              <button class="ts-bubble" type="button"
                      [style.animation-duration.s]="6 + (i % 5)" [style.animation-delay.s]="-i * 1.3"
                      [attr.aria-label]="name(b.type) + ' ' + tier(b.tier) + ', ' + (b.earnedAt | date: 'mediumDate')"
                      (click)="toggleTip(b)">
                <img [src]="image(b.type, b.tier)" alt="" width="120" height="120" />
                <span class="ts-tip" [class.ts-tip-open]="activeKey() === key(b)">
                  <strong>{{ name(b.type) }}</strong>
                  @if (b.tier !== 'single') { <span> · {{ tier(b.tier) }}</span> }
                  <br /><span class="ts-date">{{ b.earnedAt | date: 'mediumDate' }}</span>
                </span>
              </button>
            }
          </div>
        }
        <button class="btn-pill btn-outline ts-toggle" type="button" (click)="showAll.set(true)" i18n="@@trophy.seeAll">Ver todos los trofeos</button>
      } @else {
        @for (g of groups(); track g.label) {
          <h4 class="ts-group">{{ g.label }}</h4>
          @for (r of g.rows; track r.type + r.tier) {
            <div class="ts-row" [class.ts-locked]="!r.earnedAt">
              <img [src]="image(r.type, r.tier)" alt="" width="56" height="56" />
              <div class="ts-row-text">
                <div class="ts-row-name">{{ name(r.type) }}@if (r.tier !== 'single') { <span> · {{ tier(r.tier) }}</span> }</div>
                <div class="ts-row-desc">{{ desc(r.type, r.tier) }}</div>
                @if (r.earnedAt) {
                  <div class="ts-date">{{ r.earnedAt | date: 'mediumDate' }}</div>
                } @else {
                  <div class="ts-progress"><span [style.width.%]="(r.count / r.needed) * 100"></span></div>
                  <div class="ts-date">{{ r.count }} / {{ r.needed }}</div>
                }
              </div>
            </div>
          }
        }
        <button class="btn-pill btn-outline ts-toggle" type="button" (click)="showAll.set(false)" i18n="@@trophy.back">← Volver a mis trofeos</button>
      }
    </section>
  `,
  styles: [`
    .ts-bubbles { display: flex; flex-wrap: wrap; gap: 22px; justify-content: center; padding: 12px 0 20px; }
    .ts-bubble { position: relative; width: 132px; height: 132px; border-radius: 50%; padding: 6px; cursor: pointer;
      border: 1.5px solid rgba(255,255,255,.9);
      background: radial-gradient(circle at 30% 25%, rgba(255,255,255,.95) 0 8%, rgba(255,255,255,.35) 9% 30%, rgba(200,220,255,.25) 60%, rgba(180,140,242,.25) 100%);
      box-shadow: inset -6px -8px 16px rgba(180,140,242,.25), inset 4px 6px 10px rgba(255,255,255,.6), 0 6px 18px rgba(0,0,0,.08);
      animation: ts-float 7s ease-in-out infinite; }
    .ts-bubble img { width: 100%; height: 100%; border-radius: 50%; object-fit: contain; }
    .ts-tip { display: none; position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%); z-index: 3;
      background: rgba(0,0,0,.8); color: #fff; font-size: 11px; padding: 6px 9px; border-radius: 8px; white-space: nowrap; }
    .ts-bubble:hover .ts-tip, .ts-bubble:focus-visible .ts-tip, .ts-tip-open { display: block; }
    @keyframes ts-float { 0%,100% { transform: translate(0,0); } 25% { transform: translate(6px,-10px); }
      50% { transform: translate(-4px,-16px); } 75% { transform: translate(-8px,-6px); } }
    .ts-empty { text-align: center; color: var(--t3); font-size: 13px; padding: 12px 0; }
    .ts-toggle { display: block; margin: 8px auto 0; }
    .ts-group { font-size: 13px; color: var(--t2); margin: 16px 0 6px; }
    .ts-row { display: flex; gap: 12px; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border); }
    .ts-locked img { filter: grayscale(1); opacity: .45; }
    .ts-locked .ts-row-name { color: var(--t3); }
    .ts-row-name { font-weight: 700; font-size: 13px; }
    .ts-row-desc, .ts-date { font-size: 12px; color: var(--t3); }
    .ts-progress { height: 5px; background: var(--border); border-radius: 99px; margin: 4px 0 2px; max-width: 160px; overflow: hidden; }
    .ts-progress span { display: block; height: 100%; background: var(--lav-d); }
    @media (prefers-reduced-motion: reduce) { .ts-bubble { animation: none; } }
  `],
})
export class TrophyShelfComponent implements AfterViewInit {
  readonly svc = inject(TrophyService);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly showAll = signal(false);
  readonly activeKey = signal<string | null>(null);

  /** One bubble per earned medal, oldest first. */
  readonly bubbles = computed(() => this.svc.earned().filter(isKnownTrophy).sort((a, b) => a.earnedAt.localeCompare(b.earnedAt)));

  readonly groups = computed(() => {
    const earned = new Map(this.svc.earned().map(e => [trophyKey(e.type, e.tier), e.earnedAt]));
    const progress = this.svc.progress();
    const rowsFor = (type: TrophyType): Row[] =>
      (Object.entries(TROPHY_THRESHOLDS[type]) as [TrophyTier, number][]).map(([tier, needed]) => ({
        type, tier, needed, earnedAt: earned.get(trophyKey(type, tier)) ?? null, count: Math.min(progress[type] ?? 0, needed),
      }));
    return [
      ...TIERED_TYPES.map(type => ({ label: trophyName(type), rows: rowsFor(type) })),
      { label: $localize`:@@trophy.group.single:Únicos`, rows: SINGLE_TYPES.flatMap(rowsFor) },
    ];
  });

  constructor() { this.svc.load(); }

  ngAfterViewInit(): void {
    if (typeof location !== 'undefined' && location.hash === '#trofeos') {
      this.host.nativeElement.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    }
  }

  readonly key = (t: EarnedTrophy) => trophyKey(t.type, t.tier);
  readonly image = trophyImage;
  readonly name = trophyName;
  readonly tier = tierLabel;
  readonly desc = trophyDescription;
  toggleTip(t: EarnedTrophy): void { this.activeKey.update(k => (k === this.key(t) ? null : this.key(t))); }
}
