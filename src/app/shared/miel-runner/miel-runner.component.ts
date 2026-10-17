import {
  ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy, AfterViewInit,
  inject, output, signal, viewChild,
} from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { GameService } from '../../core/game/game.service';
import { RankingService } from '../../core/rankings/ranking.service';
import {
  createRun, step, runResult, RunState, WORLD_W, WORLD_H, GROUND_Y, MIEL_BOX, OBSTACLE_SIZES, ObstacleKind,
} from '../../core/game/runner-engine';

/**
 * Sprite sources. A path ('/…') is drawn as an image, anything else as emoji text.
 * Placeholders until the owner's art lands in public/game/ (spec "Art"): swap the strings, no code change.
 */
export const MIEL_RUNNER_SPRITES = {
  run1: '/Dog-highlight-wagging-tail-1.png',
  run2: '/Dog-highlight-wagging-tail-2.png',
  jump: '/Dog-highlight-wagging-tail-1.png',
  hit:  '/Dog-highlight-wagging-tail-2.png',
  obstacles: { suitcase: '🧳', backpack: '🎒', stack: '🧳🧳' } as Record<ObstacleKind, string>,
};

const LOCAL_BEST_KEY = 'tb_game_best';
type Status = 'ready' | 'running' | 'over';

@Component({
  selector: 'tb-miel-runner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'mr', '(keydown)': 'onKey($event)' },
  template: `
    <div class="mr-hud">
      <span class="mr-score" i18n="@@game.score">Puntos: {{ score() }}</span>
      @if (best() !== null) { <span class="mr-best" i18n="@@game.best">Récord semanal: {{ best() }}</span> }
    </div>
    <canvas #canvas class="mr-canvas" tabindex="0" role="img"
            i18n-aria-label="@@game.canvasLabel" aria-label="Juego de Miel: toca o presiona espacio para saltar"
            (pointerdown)="onPointer()"></canvas>
    <div class="mr-overlay" aria-live="polite">
      @switch (status()) {
        @case ('ready') { <p class="mr-hint" i18n="@@game.tapToStart">Toca para empezar · Espacio o ↑ para saltar</p> }
        @case ('over') {
          <p class="mr-final" i18n="@@game.final">¡Fin del juego! {{ score() }} puntos</p>
          @if (newRecord()) { <p class="mr-record" i18n="@@game.newRecord">🏆 ¡Nuevo récord!</p> }
          @if (unsaved()) { <p class="mr-unsaved" i18n="@@game.unsaved">Esta partida no se guardará</p> }
          <button type="button" class="btn-pill btn-primary" (click)="start()" i18n="@@game.again">Jugar de nuevo</button>
        }
      }
    </div>
  `,
})
export class MielRunnerComponent implements AfterViewInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly game = inject(GameService);
  private readonly rankings = inject(RankingService);
  private readonly zone = inject(NgZone);
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  readonly runEnded = output<{ score: number; newRecord: boolean }>();
  readonly status = signal<Status>('ready');
  readonly score = signal(0);
  readonly best = signal<number | null>(null);
  readonly newRecord = signal(false);
  readonly unsaved = signal(false);

  private state: RunState | null = null;
  private runId: Promise<string | null> | null = null;
  private jumpQueued = false;
  private frame = 0;
  private lastTs = 0;
  private destroyed = false;
  private ctx: CanvasRenderingContext2D | null = null;
  private readonly images = new Map<string, HTMLImageElement>();
  private readonly onVisibility = (): void => { if (document.visibilityState === 'hidden') void this.endRun(); };

  constructor() {
    this.best.set(this.auth.isLoggedIn() ? (this.rankings.mine()?.runners?.value ?? null) : this.readLocalBest());
  }

  ngAfterViewInit(): void {
    const el = this.canvas().nativeElement;
    const dpr = window.devicePixelRatio || 1;
    el.width = WORLD_W * dpr;
    el.height = WORLD_H * dpr;
    this.ctx = el.getContext('2d');
    this.ctx?.scale(dpr, dpr);
    for (const src of [MIEL_RUNNER_SPRITES.run1, MIEL_RUNNER_SPRITES.run2, MIEL_RUNNER_SPRITES.jump, MIEL_RUNNER_SPRITES.hit,
                       ...Object.values(MIEL_RUNNER_SPRITES.obstacles)]) {
      if (src.startsWith('/') && !this.images.has(src)) {
        const img = new Image();
        img.onload = () => { if (this.status() !== 'running') this.draw(); }; // ready/over scenes are static: paint Miel once loaded
        img.src = src;
        this.images.set(src, img);
      }
    }
    document.addEventListener('visibilitychange', this.onVisibility);
    this.draw();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    document.removeEventListener('visibilitychange', this.onVisibility);
    cancelAnimationFrame(this.frame);
    if (this.status() === 'running') void this.endRun();
  }

  onPointer(): void {
    if (this.status() === 'running') this.jumpQueued = true;
    else this.start();
  }

  /** Bound on the host: keys only reach us while the game (canvas/button) has focus, so Space never scrolls elsewhere. */
  onKey(e: KeyboardEvent): void {
    if (e.key !== ' ' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    this.onPointer();
  }

  start(): void {
    this.state = createRun(Math.floor(Math.random() * 2 ** 32));
    this.runId = this.auth.isLoggedIn() ? this.game.startRun() : null; // runs in the background — the game never waits
    this.score.set(0);
    this.newRecord.set(false);
    this.unsaved.set(false);
    this.status.set('running');
    this.canvas().nativeElement.focus();
    this.lastTs = 0;
    this.zone.runOutsideAngular(() => { this.frame = requestAnimationFrame(ts => this.loop(ts)); });
  }

  private loop(ts: number): void {
    if (!this.state || this.status() !== 'running') return;
    const dt = this.lastTs ? ts - this.lastTs : 16;
    this.lastTs = ts;
    this.state = step(this.state, dt, this.jumpQueued);
    this.jumpQueued = false;
    this.draw();
    const s = runResult(this.state).score;
    if (s !== this.score()) this.zone.run(() => this.score.set(s));
    if (this.state.over) { this.zone.run(() => void this.endRun()); return; }
    this.frame = requestAnimationFrame(t => this.loop(t));
  }

  /** Ends the current run (collision, hidden tab, host closing us) and submits it. Safe to call twice. */
  async endRun(): Promise<void> {
    if (this.status() !== 'running' || !this.state) return;
    cancelAnimationFrame(this.frame);
    this.status.set('over');
    const result = runResult(this.state);
    this.score.set(result.score);
    this.draw();
    const run = this.state;
    let record = false;
    if (this.runId) {
      const id = await this.runId;
      const res = id ? await this.game.finishRun(id, result) : null;
      if (this.state !== run) return; // the player already restarted: the run is submitted, its flags are stale
      if (res) { record = res.newRecord; this.best.set(res.weeklyBest); }
      else this.unsaved.set(true);
    } else if (result.score > (this.readLocalBest() ?? -1)) {
      record = true;
      this.best.set(result.score);
      try { localStorage.setItem(LOCAL_BEST_KEY, String(result.score)); } catch { /* no storage */ }
    }
    this.newRecord.set(record);
    if (!this.destroyed) this.runEnded.emit({ score: result.score, newRecord: record }); // hosts close us mid-run (NG0953)
  }

  private readLocalBest(): number | null {
    try { const v = localStorage.getItem(LOCAL_BEST_KEY); return v === null ? null : Number(v) || 0; } catch { return null; }
  }

  private draw(): void {
    const c = this.ctx;
    if (!c) return;
    const s = this.state;
    c.clearRect(0, 0, WORLD_W, WORLD_H);
    c.strokeStyle = getComputedStyle(this.canvas().nativeElement).color;
    c.beginPath(); c.moveTo(0, GROUND_Y + 0.5); c.lineTo(WORLD_W, GROUND_Y + 0.5); c.stroke();
    const y = GROUND_Y - (s?.y ?? 0) - MIEL_BOX.h;
    const frame = !s ? MIEL_RUNNER_SPRITES.run1
      : s.over ? MIEL_RUNNER_SPRITES.hit
      : s.y > 0 ? MIEL_RUNNER_SPRITES.jump
      : Math.floor(s.elapsedMs / 120) % 2 ? MIEL_RUNNER_SPRITES.run2 : MIEL_RUNNER_SPRITES.run1;
    this.sprite(c, frame, MIEL_BOX.x, y, MIEL_BOX.w, MIEL_BOX.h);
    for (const o of s?.obstacles ?? []) {
      const size = OBSTACLE_SIZES[o.kind];
      this.sprite(c, MIEL_RUNNER_SPRITES.obstacles[o.kind], o.x, GROUND_Y - size.h, size.w, size.h);
    }
  }

  private sprite(c: CanvasRenderingContext2D, src: string, x: number, y: number, w: number, h: number): void {
    const img = this.images.get(src);
    if (img) { if (img.complete && img.naturalWidth) c.drawImage(img, x, y, w, h); return; }
    // Emoji placeholder: stacked glyphs fill the box top to bottom.
    const glyphs = [...src];
    const size = h / glyphs.length;
    c.font = `${size}px sans-serif`;
    c.textBaseline = 'top';
    glyphs.forEach((g, i) => c.fillText(g, x, y + i * size, w));
  }
}
