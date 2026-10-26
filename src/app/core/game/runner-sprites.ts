import { ObstacleKind } from './runner-engine';

/**
 * Sprite sources (owner's final art in public/game/). A path ('/…') is drawn as an image; anything else as
 * emoji text — that branch stays as the fallback while an image hasn't loaded yet.
 */
export const MIEL_RUNNER_SPRITES = {
  run1: '/game/miel-run-1.png',
  run2: '/game/miel-run-2.png',
  jump: '/game/miel-jump.png',
  hit:  '/game/miel-hit.png',
  obstacles: {
    suitcase: '/game/obstacle-suitcase.png',
    backpack: '/game/obstacle-backpack.png',
    stack:    '/game/obstacle-luggage-stack.png',
    plane:    '/game/obstacle-plane.png', // art already faces left: never mirrored (only the ✈️ fallback is)
  } as Record<ObstacleKind, string>,
};

/** Every sprite path, for preloading. */
export const ALL_RUNNER_SPRITES: string[] = [
  MIEL_RUNNER_SPRITES.run1, MIEL_RUNNER_SPRITES.run2, MIEL_RUNNER_SPRITES.jump, MIEL_RUNNER_SPRITES.hit,
  ...Object.values(MIEL_RUNNER_SPRITES.obstacles),
];
