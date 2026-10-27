import { TestBed } from '@angular/core/testing';
import { GameAssetsService, GAME_MUSIC_URL } from './game-assets.service';
import { ALL_RUNNER_SPRITES } from './runner-sprites';

/** A fetch Response whose body streams the given chunks; each read() waits for `release()` when gated. */
function streamingResponse(chunks: Uint8Array[], gate?: Promise<void>[]) {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  let i = 0;
  return {
    ok: true,
    headers: { get: (h: string) => (h.toLowerCase() === 'content-length' ? String(total) : null) },
    body: {
      getReader: () => ({
        read: async () => {
          if (gate?.[i]) await gate[i];
          return i < chunks.length ? { done: false, value: chunks[i++] } : { done: true, value: undefined };
        },
      }),
    },
  };
}

const flush = () => new Promise(r => setTimeout(r, 0));

describe('GameAssetsService', () => {
  const realImage = (global as any).Image;
  let imageMode: 'load' | 'error';

  beforeEach(() => {
    imageMode = 'load';
    (global as any).Image = class {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_: string) { queueMicrotask(() => (imageMode === 'load' ? this.onload : this.onerror)?.()); }
    };
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    (global as any).Image = realImage;
    delete (global as any).fetch;
  });

  it('progress reaches 100 after the music and every sprite settle', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue(streamingResponse([new Uint8Array(3), new Uint8Array(5)]));
    const s = TestBed.inject(GameAssetsService);
    expect(s.progress()).toBe(0);
    expect(s.ready()).toBe(false);
    await s.preload();
    expect(s.progress()).toBe(100);
    expect(s.ready()).toBe(true);
    expect(s.musicData()!.byteLength).toBe(8);
    expect((global as any).fetch).toHaveBeenCalledWith(GAME_MUSIC_URL);
    expect(ALL_RUNNER_SPRITES.length).toBeGreaterThan(0);
  });

  it('progress rises with music bytes (Content-Length known)', async () => {
    let release!: () => void;
    const second = new Promise<void>(r => (release = r));
    (global as any).fetch = jest.fn().mockResolvedValue(streamingResponse([new Uint8Array(4), new Uint8Array(4)], [Promise.resolve(), second]));
    const s = TestBed.inject(GameAssetsService);
    const done = s.preload();
    await flush();
    expect(s.progress()).toBeGreaterThan(0);
    expect(s.progress()).toBeLessThan(100);
    release();
    await done;
    expect(s.progress()).toBe(100);
  });

  it('a failed music fetch still ends at 100 and musicData() is null', async () => {
    (global as any).fetch = jest.fn().mockRejectedValue(new Error('offline'));
    const s = TestBed.inject(GameAssetsService);
    await s.preload();
    expect(s.progress()).toBe(100);
    expect(s.musicData()).toBeNull();
  });

  it('a 404 music response counts as done with no data', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: false, headers: { get: () => null } });
    const s = TestBed.inject(GameAssetsService);
    await s.preload();
    expect(s.progress()).toBe(100);
    expect(s.musicData()).toBeNull();
  });

  it('an image error counts as done', async () => {
    imageMode = 'error';
    (global as any).fetch = jest.fn().mockResolvedValue(streamingResponse([new Uint8Array(2)]));
    const s = TestBed.inject(GameAssetsService);
    await s.preload();
    expect(s.progress()).toBe(100);
  });

  it('preload() twice fetches the music once', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue(streamingResponse([new Uint8Array(2)]));
    const s = TestBed.inject(GameAssetsService);
    const a = s.preload();
    const b = s.preload();
    expect(a).toBe(b);
    await a;
    await s.preload();
    expect((global as any).fetch).toHaveBeenCalledTimes(1);
  });
});
