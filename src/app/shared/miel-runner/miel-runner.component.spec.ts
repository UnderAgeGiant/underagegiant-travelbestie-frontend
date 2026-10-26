import { TestBed, ComponentFixture } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { MielRunnerComponent } from './miel-runner.component';
import { createRun, obstacleBottom, OBSTACLE_SIZES } from '../../core/game/runner-engine';
import { GameService } from '../../core/game/game.service';
import { AuthService } from '../../core/auth/auth.service';
import { RankingService } from '../../core/rankings/ranking.service';
import { GameAssetsService } from '../../core/game/game-assets.service';
import { GameAudioService } from '../../core/game/game-audio.service';

describe('MielRunnerComponent', () => {
  let fixture: ComponentFixture<MielRunnerComponent>;
  let cmp: MielRunnerComponent;
  let game: { startRun: jest.Mock; finishRun: jest.Mock };
  const loggedIn = signal(true);
  const progress = signal(100);
  const muted = signal(false);
  let assets: { progress: typeof progress; ready: ReturnType<typeof computed<boolean>>; preload: jest.Mock };
  let audio: Record<'unlock' | 'startMusic' | 'stopMusic' | 'chime' | 'jump' | 'crash' | 'toggleMute', jest.Mock> & { muted: typeof muted };

  beforeEach(() => {
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    HTMLCanvasElement.prototype.getContext = jest.fn(() => null) as never; // jsdom has no canvas
    game = { startRun: jest.fn().mockResolvedValue('r1'), finishRun: jest.fn().mockResolvedValue({ score: 10, weeklyBest: 10, newRecord: true, weekStart: '2026-10-12' }) };
    progress.set(100);
    muted.set(false);
    assets = { progress, ready: computed(() => progress() === 100), preload: jest.fn().mockResolvedValue(undefined) };
    audio = { muted, unlock: jest.fn(), startMusic: jest.fn(), stopMusic: jest.fn(), chime: jest.fn(), jump: jest.fn(), crash: jest.fn(),
              toggleMute: jest.fn(() => muted.set(!muted())) };
    TestBed.configureTestingModule({
      imports: [MielRunnerComponent],
      providers: [
        { provide: GameAssetsService, useValue: assets },
        { provide: GameAudioService, useValue: audio },
        { provide: GameService, useValue: game },
        { provide: AuthService, useValue: { isLoggedIn: loggedIn } },
        { provide: RankingService, useValue: { mine: signal(null) } },
      ],
    });
    fixture = TestBed.createComponent(MielRunnerComponent);
    cmp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => { jest.restoreAllMocks(); loggedIn.set(true); try { localStorage.clear(); } catch { /* */ } });

  it('starts in "ready" and never auto-plays', () => {
    expect(cmp.status()).toBe('ready');
    expect(game.startRun).not.toHaveBeenCalled();
  });

  it('shows a progressbar with the % and no start hint until assets are ready (2026-10-25)', () => {
    progress.set(40);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const bar = el.querySelector('[role="progressbar"]')!;
    expect(bar.getAttribute('aria-valuenow')).toBe('40');
    expect(bar.textContent).toContain('40%');
    expect(el.querySelector('.mr-hint')).toBeNull();
    expect(assets.preload).toHaveBeenCalled();
    progress.set(100);
    fixture.detectChanges();
    expect(el.querySelector('[role="progressbar"]')).toBeNull();
    expect(el.querySelector('.mr-hint')).not.toBeNull();
  });

  it('a click or key before ready does not start a run', () => {
    progress.set(40);
    cmp.onPointer();
    cmp.onKey(new KeyboardEvent('keydown', { key: ' ', cancelable: true }));
    expect(cmp.status()).toBe('ready');
    expect(audio.unlock).not.toHaveBeenCalled();
  });

  it('start(): unlock + chime + startMusic', () => {
    cmp.onPointer();
    expect(audio.unlock).toHaveBeenCalled();
    expect(audio.chime).toHaveBeenCalled();
    expect(audio.startMusic).toHaveBeenCalled();
  });

  it('a jump plays the jump sound once; the ending hit plays crash and stops the music', async () => {
    cmp.onPointer();
    (cmp as any).jumpQueued = true;
    (cmp as any).loop(16);
    (cmp as any).loop(32);
    expect(audio.jump).toHaveBeenCalledTimes(1);
    (cmp as any).state = { ...(cmp as any).state, over: true };
    await cmp.endRun();
    expect(audio.crash).toHaveBeenCalledTimes(1);
    expect(audio.stopMusic).toHaveBeenCalled();
  });

  it('a run ended by a hidden tab stops the music without the crash sound', async () => {
    cmp.onPointer();
    await cmp.endRun();
    expect(audio.stopMusic).toHaveBeenCalled();
    expect(audio.crash).not.toHaveBeenCalled();
  });

  it('the mute button toggles muted and its aria-label', () => {
    const el = fixture.nativeElement as HTMLElement;
    const btn = () => el.querySelector('.mr-mute') as HTMLButtonElement;
    expect(btn().getAttribute('aria-label')).toBe('Silenciar');
    expect(btn().getAttribute('aria-pressed')).toBe('false');
    btn().click();
    fixture.detectChanges();
    expect(audio.toggleMute).toHaveBeenCalled();
    expect(btn().getAttribute('aria-label')).toBe('Activar sonido');
    expect(btn().getAttribute('aria-pressed')).toBe('true');
  });

  it('Space on the focused mute button never starts or jumps the game (final review #1)', () => {
    const el = fixture.nativeElement as HTMLElement;
    const btn = el.querySelector('.mr-mute') as HTMLButtonElement;
    const ev = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    btn.dispatchEvent(ev);
    expect(cmp.status()).toBe('ready');
    expect(ev.defaultPrevented).toBe(false); // the button keeps its native Space → click
  });

  it('destroying mid-run stops the music', () => {
    cmp.onPointer();
    fixture.destroy();
    expect(audio.stopMusic).toHaveBeenCalled();
  });

  it('a tap starts a run and requests a runId when logged in', () => {
    cmp.onPointer();
    expect(cmp.status()).toBe('running');
    expect(game.startRun).toHaveBeenCalledTimes(1);
  });

  it('logged-out runs never call the API and keep a local best', async () => {
    loggedIn.set(false);
    cmp.onPointer();
    await cmp.endRun();
    expect(game.startRun).not.toHaveBeenCalled();
    expect(game.finishRun).not.toHaveBeenCalled();
    expect(localStorage.getItem('tb_game_best')).not.toBeNull();
  });

  it('game over submits the run and shows a new record', async () => {
    const ended = jest.fn();
    cmp.runEnded.subscribe(ended);
    cmp.onPointer();
    await cmp.endRun();
    expect(game.finishRun).toHaveBeenCalledWith('r1', expect.objectContaining({ score: expect.any(Number), durationMs: expect.any(Number), obstacles: expect.any(Number) }));
    expect(cmp.status()).toBe('over');
    expect(cmp.newRecord()).toBe(true);
    expect(ended).toHaveBeenCalledWith({ score: expect.any(Number), newRecord: true });
  });

  it('shows "no se guardará" when the run could not be started', async () => {
    game.startRun.mockResolvedValueOnce(null);
    cmp.onPointer();
    await cmp.endRun();
    expect(cmp.unsaved()).toBe(true);
    expect(game.finishRun).not.toHaveBeenCalled();
  });

  it('Space jumps without scrolling only while the game has focus', () => {
    const ev = new KeyboardEvent('keydown', { key: ' ', cancelable: true });
    cmp.onKey(ev);
    expect(ev.defaultPrevented).toBe(true);
    expect(cmp.status()).toBe('running');
    const other = new KeyboardEvent('keydown', { key: 'a', cancelable: true });
    cmp.onKey(other);
    expect(other.defaultPrevented).toBe(false);
  });

  it('hiding the tab ends the run', async () => {
    cmp.onPointer();
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise(r => setTimeout(r));
    expect(cmp.status()).toBe('over');
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  });

  it('destroying mid-run submits the run', async () => {
    cmp.onPointer();
    fixture.destroy();
    await new Promise(r => setTimeout(r));
    expect(game.finishRun).toHaveBeenCalled();
  });

  it('destroying mid-run does not emit after destroy (NG0953)', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    cmp.onPointer();
    fixture.destroy();
    await new Promise(r => setTimeout(r));
    expect(warn).not.toHaveBeenCalled();
  });

  it('a late submit of the previous run never overwrites the new run flags', async () => {
    let resolveFinish!: (v: null) => void;
    game.finishRun.mockReturnValueOnce(new Promise(r => { resolveFinish = r; }));
    cmp.onPointer();
    const first = cmp.endRun();     // submit pending
    cmp.start();                    // player restarts right away
    resolveFinish(null);            // old run: not saved
    await first;
    expect(cmp.status()).toBe('running');
    expect(cmp.unsaved()).toBe(false);
  });

  it('redraws the ready scene once a sprite finishes loading, so Miel shows before the first tap (review M2)', () => {
    const draw = jest.spyOn(cmp as never, 'draw' as never);
    const img = (cmp as unknown as { images: Map<string, HTMLImageElement> }).images.values().next().value!;
    img.dispatchEvent(new Event('load'));
    expect(draw).toHaveBeenCalledTimes(1);
  });

  it('draws an emoji stand-in for an obstacle whose sprite has not loaded yet (Task 13)', () => {
    const ctx = { clearRect: jest.fn(), beginPath: jest.fn(), moveTo: jest.fn(), lineTo: jest.fn(), stroke: jest.fn(),
                  scale: jest.fn(), fillText: jest.fn(), drawImage: jest.fn(), strokeStyle: '', font: '', textBaseline: '' };
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ctx) as never;
    const f = TestBed.createComponent(MielRunnerComponent);
    f.detectChanges();
    const c = f.componentInstance as unknown as { state: unknown; draw(): void };
    c.state = { ...createRun(1), obstacles: [{ kind: 'stack', x: 300, passed: false }] };
    c.draw();
    expect(ctx.fillText).toHaveBeenCalledWith('🧳', expect.any(Number), expect.any(Number), expect.any(Number));
    expect(ctx.drawImage).not.toHaveBeenCalled();   // jsdom never loads images
  });

  it('draws the plane placeholder mirrored (flying left) at its height above the ground (Task 14)', () => {
    const ctx = { clearRect: jest.fn(), beginPath: jest.fn(), moveTo: jest.fn(), lineTo: jest.fn(), stroke: jest.fn(),
                  scale: jest.fn(), fillText: jest.fn(), drawImage: jest.fn(), save: jest.fn(), restore: jest.fn(), translate: jest.fn(),
                  strokeStyle: '', font: '', textBaseline: '' };
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ctx) as never;
    const f = TestBed.createComponent(MielRunnerComponent);
    f.detectChanges();
    ctx.scale.mockClear();
    const c = f.componentInstance as unknown as { state: unknown; draw(): void };
    c.state = { ...createRun(1), obstacles: [{ kind: 'plane', x: 300, passed: false }] };
    c.draw();
    expect(ctx.translate).toHaveBeenCalledWith(300 + OBSTACLE_SIZES.plane.w, obstacleBottom('plane') - OBSTACLE_SIZES.plane.h);
    // Mirrored AND stretched to the 3:1 box, so the placeholder covers its whole hitbox (the glyph is square).
    expect(ctx.scale).toHaveBeenCalledWith(-OBSTACLE_SIZES.plane.w / OBSTACLE_SIZES.plane.h, 1);
    expect(ctx.fillText).toHaveBeenCalledWith('✈️', 0, 0);
    expect(ctx.restore).toHaveBeenCalled();
  });

  it('draws the loaded plane PNG unmirrored, exactly at its hitbox', () => {
    const ctx = { clearRect: jest.fn(), beginPath: jest.fn(), moveTo: jest.fn(), lineTo: jest.fn(), stroke: jest.fn(),
                  scale: jest.fn(), fillText: jest.fn(), drawImage: jest.fn(), save: jest.fn(), restore: jest.fn(), translate: jest.fn(),
                  strokeStyle: '', font: '', textBaseline: '' };
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ctx) as never;
    const f = TestBed.createComponent(MielRunnerComponent);
    f.detectChanges();
    ctx.scale.mockClear();
    const c = f.componentInstance as unknown as { state: unknown; draw(): void; images: Map<string, HTMLImageElement> };
    const img = c.images.get('/game/obstacle-plane.png')!;
    Object.defineProperty(img, 'complete', { value: true });
    Object.defineProperty(img, 'naturalWidth', { value: 524 });
    c.state = { ...createRun(1), obstacles: [{ kind: 'plane', x: 300, passed: false }] };
    c.draw();
    const { w, h } = OBSTACLE_SIZES.plane;
    expect(ctx.drawImage).toHaveBeenCalledWith(img, 300, obstacleBottom('plane') - h, w, h);
    expect(ctx.scale).not.toHaveBeenCalled();
    expect(ctx.fillText).not.toHaveBeenCalledWith('✈️', expect.anything(), expect.anything());
  });

  describe('backdrop (Task 12)', () => {
    const layers = (): HTMLElement[] => [...fixture.nativeElement.querySelectorAll('.mr-bg')];

    it('renders at most 2 faded photo layers (current + next) from the default iconic list', () => {
      expect(cmp.backdrop().length).toBeGreaterThan(2);
      expect(layers()).toHaveLength(2);
      expect(fixture.nativeElement.querySelectorAll('.mr-bg--on')).toHaveLength(1);
    });

    it('advancing the index moves the visible layer to the next photo', () => {
      const next = cmp.backdrop()[1];
      cmp.bgIndex.set(1);
      fixture.detectChanges();
      const on = fixture.nativeElement.querySelector('.mr-bg--on') as HTMLElement;
      expect(on.style.backgroundImage).toContain(next);
      expect(layers()).toHaveLength(2);
    });

    it('crossfades in place: no layer node is moved or removed across a rotation (review M3)', () => {
      const before = layers();
      const [oldOn] = before.filter(e => e.classList.contains('mr-bg--on'));
      const oldUrl = oldOn.style.backgroundImage;
      cmp.bgIndex.set(1);
      fixture.detectChanges();
      const after = layers();
      expect(after).toHaveLength(2);
      expect(after[0]).toBe(before[0]);      // same instances, same order
      expect(after[1]).toBe(before[1]);
      expect(oldOn.classList).not.toContain('mr-bg--on');          // outgoing fades out…
      expect(oldOn.style.backgroundImage).toBe(oldUrl);            // …still showing its photo
      const newOn = after.find(e => e.classList.contains('mr-bg--on'))!;
      expect(newOn).not.toBe(oldOn);
      expect(newOn.style.backgroundImage).toContain(cmp.backdrop()[1]);
    });

    it('an empty backdrop renders no layers', () => {
      fixture.componentRef.setInput('backdrop', []);
      fixture.detectChanges();
      expect(layers()).toHaveLength(0);
    });

    it('rotates every 10 s, but not under prefers-reduced-motion', () => {
      const spy = jest.spyOn(window, 'setInterval');
      const mk = (reduce: boolean) => {
        window.matchMedia = jest.fn(() => ({ matches: reduce })) as never;
        TestBed.createComponent(MielRunnerComponent).detectChanges();
      };
      mk(true);
      expect(spy).not.toHaveBeenCalledWith(expect.any(Function), 10_000);
      mk(false);
      expect(spy).toHaveBeenCalledWith(expect.any(Function), 10_000);
      delete (window as { matchMedia?: unknown }).matchMedia;
    });
  });
});
