import { trophyImage, trophyKey, nextGoal, trophyName, trophyDescription, TIERED_TYPES, SINGLE_TYPES, TROPHY_THRESHOLDS } from './trophy-catalog';

describe('trophy catalog', () => {
  it('maps images to /trophies/*.png', () => {
    expect(trophyImage('ai_plans', 'gold')).toBe('/trophies/trophy-ai-plans-gold.png');
    expect(trophyImage('plan_visited', 'single')).toBe('/trophies/trophy-plan-visited.png');
  });
  it('groups 6 tiered and 5 single types', () => {
    expect(TIERED_TYPES).toEqual(['ai_plans', 'comments', 'favorites', 'clones', 'followers', 'runner']);
    expect(SINGLE_TYPES).toEqual(['excel_export', 'publish_plan', 'share_plan', 'plan_visited', 'runner_persistent']);
  });
  it('nextGoal returns the first unmet tier', () => {
    expect(nextGoal('comments', 0)).toEqual({ tier: 'bronze', needed: 1 });
    expect(nextGoal('comments', 7)).toEqual({ tier: 'silver', needed: 20 });
    expect(nextGoal('comments', 70)).toBeNull();
    expect(nextGoal('share_plan', 0)).toEqual({ tier: 'single', needed: 1 });
  });
  it('knows the followers trophy (1/25/100) and its image', () => {
    expect(TROPHY_THRESHOLDS.followers).toEqual({ bronze: 1, silver: 25, gold: 100 });
    expect(trophyImage('followers', 'gold')).toBe('/trophies/trophy-followers-gold.png');
    expect(TIERED_TYPES).toContain('followers');
  });
  it('has names/descriptions for every type', () => {
    expect(trophyName('favorites')).toBe('Maravilloso plan!');
    expect(trophyDescription('clones', 'silver')).toContain('5');
    expect(trophyKey('clones', 'gold')).toBe('clones:gold');
  });
  it('knows the runner trophies (F73): score tiers in the description', () => {
    expect(trophyName('runner')).toBe('Miel Corredora');
    expect(trophyDescription('runner', 'silver')).toContain('2000');
    expect(trophyImage('runner_persistent', 'single')).toBe('/trophies/trophy-runner-persistent.png');
    expect(nextGoal('runner_persistent', 3)).toEqual({ tier: 'single', needed: 10 });
  });
});
