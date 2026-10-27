import { Injectable, computed, signal } from '@angular/core';
import { ALL_RUNNER_SPRITES } from './runner-sprites';

/** "Lofi again" by omfgdude, CC0 — https://opengameart.org/content/lofi-again (converted from lofiagain.ogg to mono MP3). */
export const GAME_MUSIC_URL = '/game/music-lofi.mp3';

/**
 * Preloads Miel Runner's files (music + sprites) once and reports progress (2026-10-25).
 * Started from AiPlanningComponent.executePlan(), /preferences, and the game itself. Never rejects:
 * a failed asset counts as done (missing music = silent game, missing sprite = emoji fallback).
 */
@Injectable({ providedIn: 'root' })
export class GameAssetsService {
  private readonly musicFraction = signal(0);
  private readonly imagesSettled = signal(0);
  private music: ArrayBuffer | null = null;
  private loading: Promise<void> | null = null;

  /** 0–100: music bytes weigh 80, sprites 20. Floored, so 100 only when everything settled. */
  readonly progress = computed(() =>
    Math.floor(80 * this.musicFraction() + 20 * this.imagesSettled() / ALL_RUNNER_SPRITES.length));
  readonly ready = computed(() => this.progress() === 100);

  /** The downloaded MP3 bytes; null while loading, when missing, or when the fetch failed. */
  musicData(): ArrayBuffer | null {
    return this.music;
  }

  preload(): Promise<void> {
    return this.loading ??= Promise.all([this.loadMusic(), ...ALL_RUNNER_SPRITES.map(src => this.loadImage(src))]).then(() => undefined);
  }

  private async loadMusic(): Promise<void> {
    try {
      const res = await fetch(GAME_MUSIC_URL);
      if (!res.ok) return;
      const total = Number(res.headers.get('Content-Length')) || 0;
      const reader = total > 0 ? res.body?.getReader() : undefined;
      if (!reader) {
        this.music = await res.arrayBuffer();
        return;
      }
      const chunks: Uint8Array[] = [];
      let received = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        this.musicFraction.set(Math.min(received / total, 0.99)); // a wrong Content-Length must not reach 100 early
      }
      const bytes = new Uint8Array(received);
      let at = 0;
      for (const c of chunks) { bytes.set(c, at); at += c.length; }
      this.music = bytes.buffer;
    } catch {
      this.music = null;
    } finally {
      this.musicFraction.set(1);
    }
  }

  private loadImage(src: string): Promise<void> {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = img.onerror = () => { this.imagesSettled.update(n => n + 1); resolve(); };
      img.src = src;
    });
  }
}
