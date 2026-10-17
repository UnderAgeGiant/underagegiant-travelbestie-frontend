import { createRun, step, runResult, MIEL_BOX, RunState, MAX_DT_MS, PLANE_FROM_MS } from './runner-engine';
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

    it.each([[0, 10], [0, 120], [200_000, 40]])('jumping into a plane ends the run (elapsed %i ms, gap %i px)', (elapsedMs, gap) => {
      expect(jumpAt(elapsedMs, gap).over).toBe(true);
    });

    // Honest physics: the jump peaks ~100 px, the plane spans 48–70 px, so a perfectly timed jump goes over it.
    // Ruling (Task 14): kept — the spec says "jumping INTO it ends the run". Pinned so a change is deliberate.
    it('a perfectly timed jump can clear the plane from above (narrow window)', () => {
      expect(jumpAt(0, 50).over).toBe(false);
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
});
