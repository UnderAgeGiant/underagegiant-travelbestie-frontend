import { Injectable, inject, signal } from '@angular/core';
import { GameAssetsService } from './game-assets.service';

const MUTED_KEY = 'tb_game_muted';
const MUSIC_GAIN = 0.35;

/**
 * Miel Runner sound (2026-10-25): one looping lo-fi track (GameAssetsService.musicData()) plus synthesized
 * jump / crash / airport-chime effects (owner-approved values). One AudioContext, created on the player's own
 * gesture (unlock()). Every method is a silent no-op without Web Audio, without music data, or while muted.
 */
@Injectable({ providedIn: 'root' })
export class GameAudioService {
  private readonly assets = inject(GameAssetsService);
  private readonly _muted = signal(readMuted());
  readonly muted = this._muted.asReadonly();

  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private buffer: AudioBuffer | null = null;
  private decoding: Promise<AudioBuffer | null> | null = null;
  private music: AudioBufferSourceNode | null = null;
  private musicWanted = false;

  toggleMute(): void {
    const muted = !this._muted();
    this._muted.set(muted);
    try { localStorage.setItem(MUTED_KEY, muted ? '1' : '0'); } catch { /* in-memory only */ }
    if (muted) this.stopMusic(); // music starts again with the next run
    try { this.master?.gain.setValueAtTime(muted ? 0 : 1, this.ctx!.currentTime); } catch { /* */ } // cuts effects already playing
  }

  /** Must run inside the user gesture that starts a run (autoplay policies). */
  unlock(): void {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    try {
      if (!this.ctx) {
        this.ctx = new Ctor();
        this.master = this.ctx.createGain();
        this.master.gain.value = this._muted() ? 0 : 1;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume().catch(() => undefined);
    } catch { this.ctx = null; this.master = null; }
  }

  startMusic(): void {
    this.musicWanted = true;
    if (this.music || !this.audible()) return;
    if (this.buffer) { this.playMusic(this.buffer); return; }
    const data = this.assets.musicData();
    if (!data) return;
    this.decoding ??= this.ctx!.decodeAudioData(data.slice(0)).catch(() => null); // slice: decoding detaches its input
    void this.decoding.then(b => {
      this.buffer = b;
      if (b && this.musicWanted && !this.music && this.audible()) this.playMusic(b);
    });
  }

  stopMusic(): void {
    this.musicWanted = false;
    try { this.music?.stop(); } catch { /* already stopped */ }
    this.music = null;
  }

  /** Sine sweep 300 → 750 Hz over 0.18 s, fast decay. */
  jump(): void {
    if (!this.audible()) return;
    const t = this.ctx!.currentTime;
    this.tone(300, 750, 'linear', t, 0.18, 0.5, 14, 0.3);
  }

  /** Sine falling 140 → 40 Hz over 0.35 s plus a short low-passed noise burst. */
  crash(): void {
    if (!this.audible()) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    this.tone(140, 40, 'exp', t, 0.35, 0.8, 9, 0.6);
    try {
      const len = Math.floor(ctx.sampleRate * 0.3);
      const noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const ch = noise.getChannelData(0);
      for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = noise;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 600;
      const g = this.envelope(t, 1.0, 22);
      src.connect(lp).connect(g);
      src.start(t);
      src.stop(t + 0.3);
    } catch { /* sound never blocks the game */ }
  }

  /** Airport "ding-dong": E5 then C5 0.55 s later; each a sine + 0.3× partial at 2.01×, ~1.9 s in total. */
  chime(): void {
    if (!this.audible()) return;
    const t = this.ctx!.currentTime;
    for (const [f, at] of [[659.25, 0], [523.25, 0.55]]) {
      this.tone(f, f, 'linear', t + at, 0, 0.3, 2.2, 1.35);
      this.tone(f * 2.01, f * 2.01, 'linear', t + at, 0, 0.3 * 0.3, 2.2, 1.35);
    }
  }

  private audible(): boolean {
    return !!this.ctx && !!this.master && !this._muted();
  }

  private playMusic(buffer: AudioBuffer): void {
    try {
      const ctx = this.ctx!;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      const g = ctx.createGain();
      g.gain.value = MUSIC_GAIN;
      src.connect(g).connect(this.master!);
      src.start();
      this.music = src;
    } catch { this.music = null; }
  }

  /** A gain node at `peak` decaying as exp(-rate·t), wired to the master. */
  private envelope(t: number, peak: number, rate: number): GainNode {
    const g = this.ctx!.createGain();
    g.gain.setValueAtTime(peak, t);
    g.gain.setTargetAtTime(0, t, 1 / rate);
    g.connect(this.master!);
    return g;
  }

  private tone(from: number, to: number, ramp: 'linear' | 'exp', t: number, sweep: number, peak: number, rate: number, dur: number): void {
    try {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(from, t);
      if (sweep > 0) {
        if (ramp === 'exp') osc.frequency.exponentialRampToValueAtTime(to, t + sweep);
        else osc.frequency.linearRampToValueAtTime(to, t + sweep);
      }
      osc.connect(this.envelope(t, peak, rate));
      osc.start(t);
      osc.stop(t + dur);
    } catch { /* sound never blocks the game */ }
  }
}

function readMuted(): boolean {
  try { return localStorage.getItem(MUTED_KEY) === '1'; } catch { return false; }
}
