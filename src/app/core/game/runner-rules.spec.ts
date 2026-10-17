import { RUNNER_RULES, scoreFor, maxObstacles } from './runner-rules';

describe('RUNNER_RULES', () => {
  it("matches the manager's src/lib/game.ts — change both together", () => {
    expect(RUNNER_RULES).toEqual({
      START_SPEED: 300, ACCEL: 6, MAX_SPEED: 900,
      MIN_SPAWN_MS: 900, MAX_SPAWN_MS: 2000,
      POINTS_PER_SECOND: 10, POINTS_PER_OBSTACLE: 5,
    });
  });
  it('scoreFor / maxObstacles match the backend', () => {
    expect(scoreFor(61_200, 58)).toBe(900);
    expect(maxObstacles(899)).toBe(1);
    expect(maxObstacles(60_000)).toBe(67);
  });
});
