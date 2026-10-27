import { TestBed } from '@angular/core/testing';
import { GameAudioService } from './game-audio.service';
import { GameAssetsService } from './game-assets.service';

/** Just enough of an AudioContext to record what the service builds. */
class FakeAudioContext {
  static last: FakeAudioContext;
  state = 'running';
  currentTime = 0;
  sampleRate = 44100;
  destination = {};
  sources: { loop: boolean; started: boolean; stopped: boolean; buffer: unknown }[] = [];
  oscillators = 0;
  constructor() { FakeAudioContext.last = this; }
  resume() { return Promise.resolve(); }
  private param() { return { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {} }; }
  createGain() { return { gain: this.param(), connect: (n: unknown) => n }; }
  createBiquadFilter() { return { type: '', frequency: this.param(), connect: (n: unknown) => n }; }
  createOscillator() {
    this.oscillators++;
    return { type: '', frequency: this.param(), connect: (n: unknown) => n, start() {}, stop() {} };
  }
  createBuffer(_c: number, len: number) { return { getChannelData: () => new Float32Array(len) }; }
  createBufferSource() {
    const s = { loop: false, started: false, stopped: false, buffer: null as unknown, connect: (n: unknown) => n,
                start() { s.started = true; }, stop() { s.stopped = true; } };
    this.sources.push(s);
    return s;
  }
  decodeAudioData(_d: ArrayBuffer) { return Promise.resolve({ duration: 1 }); }
}

describe('GameAudioService', () => {
  const realCtx = (window as any).AudioContext;
  let music: ArrayBuffer | null;

  beforeEach(() => {
    localStorage.clear();
    music = new ArrayBuffer(8);
    TestBed.configureTestingModule({
      providers: [{ provide: GameAssetsService, useValue: { musicData: () => music } }],
    });
  });

  afterEach(() => {
    (window as any).AudioContext = realCtx;
    jest.restoreAllMocks();
  });

  it('all calls are silent no-ops without AudioContext', () => {
    delete (window as any).AudioContext;
    const s = TestBed.inject(GameAudioService);
    expect(() => { s.unlock(); s.startMusic(); s.jump(); s.crash(); s.chime(); s.stopMusic(); s.toggleMute(); }).not.toThrow();
  });

  it('muted defaults to false and toggleMute persists tb_game_muted', () => {
    const s = TestBed.inject(GameAudioService);
    expect(s.muted()).toBe(false);
    s.toggleMute();
    expect(s.muted()).toBe(true);
    expect(localStorage.getItem('tb_game_muted')).toBe('1');
    s.toggleMute();
    expect(localStorage.getItem('tb_game_muted')).toBe('0');
  });

  it('reads a stored mute on construction', () => {
    localStorage.setItem('tb_game_muted', '1');
    expect(TestBed.inject(GameAudioService).muted()).toBe(true);
  });

  it('throwing storage: muted false, toggle still flips in memory', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    const s = TestBed.inject(GameAudioService);
    expect(s.muted()).toBe(false);
    expect(() => s.toggleMute()).not.toThrow();
    expect(s.muted()).toBe(true);
  });

  it('with a fake AudioContext: startMusic creates a looping source; stopMusic stops it; muted → no source', async () => {
    (window as any).AudioContext = FakeAudioContext;
    const s = TestBed.inject(GameAudioService);
    s.unlock();
    s.startMusic();
    await Promise.resolve(); await Promise.resolve();
    const ctx = FakeAudioContext.last;
    expect(ctx.sources).toHaveLength(1);
    expect(ctx.sources[0].loop).toBe(true);
    expect(ctx.sources[0].started).toBe(true);
    s.stopMusic();
    expect(ctx.sources[0].stopped).toBe(true);

    s.toggleMute();
    s.startMusic();
    await Promise.resolve(); await Promise.resolve();
    expect(ctx.sources).toHaveLength(1);
    const osc = ctx.oscillators;
    s.jump(); s.chime();
    expect(ctx.oscillators).toBe(osc);
  });

  it('muting mid-run stops the music right away', async () => {
    (window as any).AudioContext = FakeAudioContext;
    const s = TestBed.inject(GameAudioService);
    s.unlock();
    s.startMusic();
    await Promise.resolve(); await Promise.resolve();
    s.toggleMute();
    expect(FakeAudioContext.last.sources[0].stopped).toBe(true);
  });

  it('mute then unmute mid-run resumes the music loop (review round 2 F1)', async () => {
    (window as any).AudioContext = FakeAudioContext;
    const s = TestBed.inject(GameAudioService);
    s.unlock();
    s.startMusic();
    await Promise.resolve(); await Promise.resolve();
    s.toggleMute();
    s.toggleMute();
    await Promise.resolve(); await Promise.resolve();
    const srcs = FakeAudioContext.last.sources;
    expect(srcs).toHaveLength(2);
    expect(srcs[1].loop).toBe(true);
    expect(srcs[1].started).toBe(true);
  });

  it('unmute after the run ended does not start music', async () => {
    (window as any).AudioContext = FakeAudioContext;
    const s = TestBed.inject(GameAudioService);
    s.unlock();
    s.startMusic();
    await Promise.resolve(); await Promise.resolve();
    s.toggleMute();
    s.stopMusic();
    s.toggleMute();
    await Promise.resolve(); await Promise.resolve();
    expect(FakeAudioContext.last.sources).toHaveLength(1);
  });

  it('missing music data: startMusic is a no-op, effects still play', () => {
    music = null;
    (window as any).AudioContext = FakeAudioContext;
    const s = TestBed.inject(GameAudioService);
    s.unlock();
    s.startMusic();
    expect(FakeAudioContext.last.sources).toHaveLength(0);
    s.jump();
    expect(FakeAudioContext.last.oscillators).toBe(1);
    s.chime();
    expect(FakeAudioContext.last.oscillators).toBe(5);
  });

  it('a decodeAudioData that throws synchronously never escapes startMusic (final review #3)', () => {
    (window as any).AudioContext = class extends FakeAudioContext {
      override decodeAudioData(): Promise<{ duration: number }> { throw new Error('legacy engine'); }
    };
    const s = TestBed.inject(GameAudioService);
    s.unlock();
    expect(() => s.startMusic()).not.toThrow();
    expect(() => s.startMusic()).not.toThrow();
  });
});
