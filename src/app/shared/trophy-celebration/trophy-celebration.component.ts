import { Component, effect, inject, signal } from '@angular/core';
import { TrophyCelebrationService } from '../../core/trophies/trophy-celebration.service';
import { tierLabel, trophyImage, trophyName } from '../../core/trophies/trophy-catalog';

const STREAMER_COLORS = ['#F4B740', '#E8506A', '#4A7BE0', '#7CC4A4', '#B48CF2'];
const STREAMER_MS = 2600;

/** App-wide "¡Nuevo trofeo!" card + CSS streamer burst. Mounted once in AppComponent. */
@Component({
  selector: 'tb-trophy-celebration',
  standalone: true,
  template: `
    @if (streamers().length) {
      <div class="tc-streamers" aria-hidden="true">
        @for (s of streamers(); track s.id) {
          <span class="tc-streamer" [style.left.%]="s.left" [style.background]="s.color"
                [style.animation-delay.ms]="s.delay" [style.--tc-rot]="s.rot + 'deg'"></span>
        }
      </div>
    }
    @if (celebration.current(); as t) {
      <div class="tc-card" role="status" aria-live="polite">
        <img [src]="image(t)" alt="" width="88" height="88" />
        <div class="tc-text">
          <div class="tc-kicker" i18n="@@trophy.new">¡Nuevo trofeo!</div>
          <div class="tc-name">{{ name(t) }}</div>
          @if (t.tier !== 'single') { <div class="tc-tier">{{ tier(t) }}</div> }
        </div>
        <button class="tc-close" type="button" (click)="celebration.dismiss()"
                i18n-aria-label="@@trophy.close" aria-label="Cerrar">✕</button>
      </div>
    }
  `,
  styles: [`
    .tc-card { position: fixed; left: 50%; bottom: calc(24px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%);
      z-index: 1000; display: flex; align-items: center; gap: 12px; background: #fff; border-radius: 18px;
      padding: 10px 14px; box-shadow: var(--sh-md); border: 1.5px solid var(--border); animation: tc-pop .35s ease both; max-width: calc(100vw - 32px); }
    .tc-kicker { font-size: 11px; font-weight: 700; color: var(--lav-d); text-transform: uppercase; letter-spacing: .04em; }
    .tc-name { font-size: 15px; font-weight: 700; color: var(--t1); }
    .tc-tier { font-size: 12px; color: var(--t3); }
    .tc-close { border: none; background: transparent; font-size: 14px; cursor: pointer; color: var(--t3); }
    .tc-streamers { position: fixed; inset: 0; pointer-events: none; z-index: 999; overflow: hidden; }
    .tc-streamer { position: absolute; top: -20px; width: 8px; height: 22px; border-radius: 3px;
      animation: tc-fall 2.4s cubic-bezier(.2,.6,.4,1) both; }
    @keyframes tc-fall { to { transform: translateY(110vh) rotate(var(--tc-rot)); opacity: .2; } }
    @keyframes tc-pop { from { transform: translate(-50%, 20px); opacity: 0; } }
    @media (prefers-reduced-motion: reduce) { .tc-streamers { display: none; } .tc-card { animation: none; } }
  `],
})
export class TrophyCelebrationComponent {
  readonly celebration = inject(TrophyCelebrationService);
  readonly streamers = signal<{ id: string; left: number; color: string; delay: number; rot: number }[]>([]);
  private timer: ReturnType<typeof setTimeout> | null = null;

  readonly image = (t: { type: any; tier: any }) => trophyImage(t.type, t.tier);
  readonly name  = (t: { type: any }) => trophyName(t.type);
  readonly tier  = (t: { tier: any }) => tierLabel(t.tier);

  constructor() {
    effect(() => {
      const id = this.celebration.burstId();
      if (!id) return;
      this.streamers.set(Array.from({ length: 28 }, (_, i) => ({
        id: `${id}-${i}`, left: Math.random() * 100, color: STREAMER_COLORS[i % STREAMER_COLORS.length],
        delay: Math.random() * 400, rot: 200 + Math.random() * 520,
      })));
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => this.streamers.set([]), STREAMER_MS);
    }, { allowSignalWrites: true });
  }
}
