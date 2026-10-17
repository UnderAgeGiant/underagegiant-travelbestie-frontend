import { createRun, step, runResult, MIEL_BOX, RunState, MAX_DT_MS } from './runner-engine';
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
    s = tick(s, 120_000, st => st.y === 0 && st.obstacles.some(o => !o.passed && o.x - (MIEL_BOX.x + MIEL_BOX.w) < st.speed * 0.12));
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
});
