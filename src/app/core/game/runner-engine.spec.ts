import { createRun, step, runResult, MIEL_BOX, RunState, MAX_DT_MS, PLANE_FROM_MS, PLANE_LIFT, OBSTACLE_SIZES, GRAVITY, JUMP_VELOCITY, GROUP_FROM_MS, GROUP_GAP, Obstacle } from './runner-engine';
import { RUNNER_RULES, maxObstacles, scoreFor } from './runner-rules';

const tick = (s: RunState, ms: number, jumpAt: (s: RunState) => boolean = () => false): RunState => {
  for (let t = 0; t < ms && !s.over; t += 16) s = step(s, 16, jumpAt(s));
  return s;
};

describe('runner engine', () => {
  it('is deterministic for a seed', () => {
    expect(runResult(tick(createRun(42), 5000))).toEqual(runResult(tick(createRun(42), 5000)));
  });

  it('speeds up over time and caps at MAX_SPEED', () => {
    const s = createRun(1);
    expect(s.speed).toBe(RUNNER_RULES.START_SPEED);
    const later = step({ ...s, elapsedMs: 200_000, obstacles: [] }, 16, false);
    expect(later.speed).toBe(RUNNER_RULES.MAX_SPEED);
  });

  it('clamps a stalled frame', () => {
    expect(step(createRun(1), 5_000, false).elapsedMs).toBe(MAX_DT_MS);
  });

  it('ends the run when Miel hits an obstacle on the ground', () => {
    const s: RunState = { ...createRun(1), obstacles: [{ kind: 'stack', x: MIEL_BOX.x + 4, passed: false }] };
    expect(step(s, 16, false).over).toBe(true);
  });

  it('a well-timed jump clears an obstacle and counts it once', () => {
    let s: RunState = { ...createRun(1), nextSpawnMs: Infinity, obstacles: [{ kind: 'stack', x: 160, passed: false }] };
    s = tick(s, 2000, st => !!st.obstacles[0] && st.obstacles[0].x - (MIEL_BOX.x + MIEL_BOX.w) < 60 && st.y === 0);
    expect(s.over).toBe(false);
    expect(s.cleared).toBe(1);
  });

  it.each([
    ['start speed', 0],
    ['max speed', 200_000],
  ])('the widest obstacle (stack) is clearable at %s', (_, elapsedMs) => {
    let s: RunState = { ...createRun(1), elapsedMs, nextSpawnMs: Infinity, obstacles: [{ kind: 'stack', x: 400, passed: false }] };
    s = step(s, 16, false);
    s = tick(s, 3000, st => !!st.obstacles[0] && st.y === 0 && st.obstacles[0].x - (MIEL_BOX.x + MIEL_BOX.w) < st.speed * 0.12);
    expect(s.over).toBe(false);
    expect(s.cleared).toBe(1);
  });

  it('jumping at nothing earns nothing', () => {
    let s: RunState = { ...createRun(1), nextSpawnMs: Infinity };
    s = tick(s, 3000, () => true);
    expect(s.cleared).toBe(0);
    expect(runResult(s).score).toBe(30);
  });

  it('never clears more obstacles than the backend cap allows', () => {
    // Bot that always jumps when an obstacle is close: long run, check the invariant the server enforces.
    let s = createRun(7);
    s = tick(s, 120_000, st => st.y === 0 && st.obstacles.some(o => o.kind !== 'plane' && !o.passed && o.x - (MIEL_BOX.x + MIEL_BOX.w) < st.speed * 0.12));
    const r = runResult(s);
    expect(r.obstacles).toBeLessThanOrEqual(maxObstacles(r.durationMs));
  });

  it('reports an integer durationMs with real (fractional) rAF deltas — the backend schema requires ints', () => {
    let s: RunState = { ...createRun(3), nextSpawnMs: Infinity };
    for (let i = 0; i < 175; i++) s = step(s, 16.7, false);
    const r = runResult(s);
    expect(Number.isInteger(r.durationMs)).toBe(true);
    expect(r.durationMs).toBe(Math.floor(s.elapsedMs));
    expect(r.score).toBe(scoreFor(r.durationMs, r.obstacles));
  });

  describe('flying plane (Task 14)', () => {
    it('Miel standing on the ground passes under a plane and scores it', () => {
      let s: RunState = { ...createRun(1), nextSpawnMs: Infinity, obstacles: [{ kind: 'plane', x: 200, passed: false }] };
      s = tick(s, 2000);
      expect(s.over).toBe(false);
      expect(s.cleared).toBe(1);
    });

    // A jump at the plane: late (rising into it) or early (falling onto it) ends the run, at start and max speed.
    const jumpAt = (elapsedMs: number, gap: number): RunState => {
      let s: RunState = { ...createRun(1), elapsedMs, nextSpawnMs: Infinity, obstacles: [{ kind: 'plane', x: 600, passed: false }] };
      let jumped = false;
      return tick(s, 3000, st => {
        const go = !jumped && !!st.obstacles[0] && st.obstacles[0].x - (MIEL_BOX.x + MIEL_BOX.w) < gap;
        if (go) jumped = true;
        return go;
      });
    };

    // [0, 50] was the old "clear it from above" timing (Task 14 Plan A), reversed in Task 15.
    it.each([[0, 10], [0, 50], [0, 120], [200_000, 40]])('jumping into a plane ends the run (elapsed %i ms, gap %i px)', (elapsedMs, gap) => {
      expect(jumpAt(elapsedMs, gap).over).toBe(true);
    });

    it('the plane is out of reach of a full jump (feet at peak below its top hit edge)', () => {
      const peak = JUMP_VELOCITY ** 2 / (2 * GRAVITY);
      expect(peak + 6).toBeLessThan(PLANE_LIFT + OBSTACLE_SIZES.plane.h - 6);
    });

    // A low hop that stays under the plane is fine (58 px headroom); reaching its band (Miel's top hit edge, y + 38,
    // above the plane's bottom hit edge, LIFT + 6) while it overlaps must end the run — so nothing passes over it.
    it('no jump timing clears a plane: surviving means Miel stayed below it while it overlapped her', () => {
      for (let d = -120; d <= 400; d += 4) {
        let s: RunState = { ...createRun(1), nextSpawnMs: Infinity, obstacles: [{ kind: 'plane', x: 400, passed: false }] };
        let airborneOverlap = false, jumped = false;
        for (let t = 0; t < 3000 && !s.over && !s.obstacles[0]?.passed; t += 16) {
          const go = !jumped && s.obstacles[0].x - (MIEL_BOX.x + MIEL_BOX.w) < d;
          if (go) jumped = true;
          s = step(s, 16, go);
          const p = s.obstacles[0];
          if (p && s.y + MIEL_BOX.h - 6 > PLANE_LIFT + 6 && p.x < MIEL_BOX.x + MIEL_BOX.w - 12 && p.x + OBSTACLE_SIZES.plane.w - 12 > MIEL_BOX.x) airborneOverlap = true;
        }
        if (!s.over) expect(airborneOverlap).toBe(false);
      }
    });

    it('no planes before PLANE_FROM_MS, some after', () => {
      const kinds = (s: RunState) => s.obstacles.map(o => o.kind);
      let s = createRun(3);
      const seen: string[] = [];
      // bot that clears luggage and never jumps under a plane
      const bot = (st: RunState) => st.y === 0 && st.obstacles.some(o => o.kind !== 'plane' && !o.passed && o.x - (MIEL_BOX.x + MIEL_BOX.w) < st.speed * 0.12);
      for (let t = 0; t < PLANE_FROM_MS - 1000 && !s.over; t += 16) { s = step(s, 16, bot(s)); seen.push(...kinds(s)); }
      expect(seen).not.toContain('plane');
      for (let t = 0; t < 120_000 && !s.over; t += 16) { s = step(s, 16, bot(s)); seen.push(...kinds(s)); }
      expect(seen).toContain('plane');
    });
  });

  describe('obstacle groups (Task 15)', () => {
    it('one jump clears the widest group (3 backpacks) at START_SPEED and the group scores once', () => {
      const w = OBSTACLE_SIZES.backpack.w + GROUP_GAP;
      const group = (): Obstacle[] => [0, 1, 2].map(i => ({ kind: 'backpack' as const, x: 300 + i * w, passed: false, follower: i > 0 }));
      let survived = false;
      for (let d = 0; d <= 200 && !survived; d += 2) {
        let s: RunState = { ...createRun(1), nextSpawnMs: Infinity, obstacles: group() };
        let jumped = false;
        for (let t = 0; t < 3000 && !s.over; t += 16) {
          const go = !jumped && s.obstacles[0].x - (MIEL_BOX.x + MIEL_BOX.w) < d;
          if (go) jumped = true;
          s = step(s, 16, go);
        }
        if (!s.over) { survived = true; expect(s.cleared).toBe(1); }
      }
      expect(survived).toBe(true);
    });

    it('groups only appear after GROUP_FROM_MS, never contain a stack or plane', () => {
      let s = createRun(7);
      const before: Obstacle[] = [], after: Obstacle[] = [];
      for (let t = 0; t < 120_000; t += 16) {
        s = step({ ...s, over: false, y: 0, vy: 0 }, 16, false);   // ghost run: ignore collisions, inspect spawns
        (s.elapsedMs < GROUP_FROM_MS ? before : after).push(...s.obstacles);
      }
      expect(before.some(o => o.follower)).toBe(false);
      const followers = after.filter(o => o.follower);
      expect(followers.length).toBeGreaterThan(0);
      expect(followers.every(o => o.kind === 'suitcase' || o.kind === 'backpack')).toBe(true);
    });
  });
});
