/** Feature 73 — Miel Runner. Mirrors the manager's src/lib/game.ts EXACTLY; change both together. */
export const RUNNER_RULES = {
  START_SPEED: 300,
  ACCEL: 6,
  MAX_SPEED: 900,
  MIN_SPAWN_MS: 900,
  MAX_SPAWN_MS: 2000,
  POINTS_PER_SECOND: 10,
  POINTS_PER_OBSTACLE: 5,
} as const;

export const scoreFor = (durationMs: number, obstacles: number): number =>
  RUNNER_RULES.POINTS_PER_SECOND * Math.floor(durationMs / 1000) + RUNNER_RULES.POINTS_PER_OBSTACLE * obstacles;

export const maxObstacles = (durationMs: number): number => Math.floor(durationMs / RUNNER_RULES.MIN_SPAWN_MS) + 1;
