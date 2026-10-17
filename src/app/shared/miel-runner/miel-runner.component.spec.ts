import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MielRunnerComponent } from './miel-runner.component';
import { GameService } from '../../core/game/game.service';
import { AuthService } from '../../core/auth/auth.service';
import { RankingService } from '../../core/rankings/ranking.service';

describe('MielRunnerComponent', () => {
  let fixture: ComponentFixture<MielRunnerComponent>;
  let cmp: MielRunnerComponent;
  let game: { startRun: jest.Mock; finishRun: jest.Mock };
  const loggedIn = signal(true);

  beforeEach(() => {
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    HTMLCanvasElement.prototype.getContext = jest.fn(() => null) as never; // jsdom has no canvas
    game = { startRun: jest.fn().mockResolvedValue('r1'), finishRun: jest.fn().mockResolvedValue({ score: 10, weeklyBest: 10, newRecord: true, weekStart: '2026-10-12' }) };
    TestBed.configureTestingModule({
      imports: [MielRunnerComponent],
      providers: [
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
});
