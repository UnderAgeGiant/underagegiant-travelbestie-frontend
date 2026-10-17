import { RUNNER_RULES, scoreFor } from './runner-rules';

/** Pure simulation — no Angular, no DOM. Logical world 600×150, y grows downward, Miel stands on GROUND_Y. */
export const WORLD_W = 600;
export const WORLD_H = 150;
export const GROUND_Y = 140;
export const MAX_DT_MS = 50;              // a stalled frame can't teleport Miel through an obstacle
export const GRAVITY = 1800;              // px/s²
export const JUMP_VELOCITY = 600;         // px/s → ~0.67 s airtime, ~100 px peak
export const FIRST_SPAWN_MS = 1200;
const HIT_INSET = 6;                      // forgiving hitboxes, like the dino's

export const MIEL_BOX = { x: 40, w: 44, h: 44 } as const;
export type ObstacleKind = 'suitcase' | 'backpack' | 'stack';
export const OBSTACLE_SIZES: Record<ObstacleKind, { w: number; h: number }> = {
  suitcase: { w: 26, h: 34 },
  backpack: { w: 34, h: 30 },
  stack:    { w: 28, h: 56 },
};
const KINDS: ObstacleKind[] = ['suitcase', 'backpack', 'stack'];

export interface Obstacle { kind: ObstacleKind; x: number; passed: boolean }
export interface RunState {
  elapsedMs: number;
  speed: number;
  y: number;          // height above ground (0 = standing)
  vy: number;         // upward velocity
  obstacles: Obstacle[];
  nextSpawnMs: number;
  cleared: number;
  over: boolean;
  rng: () => number;
}

/** mulberry32 — tiny seeded PRNG so runs are reproducible in tests. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRun(seed: number): RunState {
  return {
    elapsedMs: 0, speed: RUNNER_RULES.START_SPEED, y: 0, vy: 0,
    obstacles: [], nextSpawnMs: FIRST_SPAWN_MS, cleared: 0, over: false, rng: mulberry32(seed),
  };
}

function hits(s: RunState, o: Obstacle): boolean {
  const size = OBSTACLE_SIZES[o.kind];
  const mielBottom = GROUND_Y - s.y - HIT_INSET;
  const obstacleTop = GROUND_Y - size.h + HIT_INSET;
  return MIEL_BOX.x + MIEL_BOX.w - HIT_INSET > o.x + HIT_INSET
      && MIEL_BOX.x + HIT_INSET < o.x + size.w - HIT_INSET
      && mielBottom > obstacleTop;
}

export function step(s: RunState, rawDtMs: number, jump: boolean): RunState {
  if (s.over) return s;
  const dt = Math.min(Math.max(rawDtMs, 0), MAX_DT_MS);
  const sec = dt / 1000;
  const elapsedMs = s.elapsedMs + dt;
  const speed = Math.min(RUNNER_RULES.START_SPEED + RUNNER_RULES.ACCEL * (elapsedMs / 1000), RUNNER_RULES.MAX_SPEED);

  let { y, vy } = s;
  if (jump && y === 0 && vy === 0) vy = JUMP_VELOCITY;
  if (y > 0 || vy > 0) {
    vy -= GRAVITY * sec;
    y = Math.max(0, y + vy * sec);
    if (y === 0) vy = 0;
  }

  let cleared = s.cleared;
  const obstacles: Obstacle[] = [];
  for (const o of s.obstacles) {
    const moved = { ...o, x: o.x - speed * sec };
    if (!moved.passed && moved.x + OBSTACLE_SIZES[o.kind].w < MIEL_BOX.x) { moved.passed = true; cleared++; }
    if (moved.x + OBSTACLE_SIZES[o.kind].w > -10) obstacles.push(moved);
  }

  let nextSpawnMs = s.nextSpawnMs;
  if (elapsedMs >= nextSpawnMs) {
    obstacles.push({ kind: KINDS[Math.floor(s.rng() * KINDS.length)], x: WORLD_W, passed: false });
    nextSpawnMs = elapsedMs + RUNNER_RULES.MIN_SPAWN_MS + s.rng() * (RUNNER_RULES.MAX_SPAWN_MS - RUNNER_RULES.MIN_SPAWN_MS);
  }

  const next: RunState = { ...s, elapsedMs, speed, y, vy, obstacles, nextSpawnMs, cleared };
  next.over = obstacles.some(o => hits(next, o));
  return next;
}

/** durationMs is floored: rAF deltas are fractional and the server accepts integers only (§17.2). */
export function runResult(s: RunState): { score: number; durationMs: number; obstacles: number } {
  const durationMs = Math.floor(s.elapsedMs);
  return { score: scoreFor(durationMs, s.cleared), durationMs, obstacles: s.cleared };
}
