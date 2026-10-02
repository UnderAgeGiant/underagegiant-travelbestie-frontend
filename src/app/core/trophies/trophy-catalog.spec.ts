import { trophyImage, trophyKey, nextGoal, trophyName, trophyDescription, TIERED_TYPES, SINGLE_TYPES } from './trophy-catalog';

describe('trophy catalog', () => {
  it('maps images to /trophies/*.png', () => {
    expect(trophyImage('ai_plans', 'gold')).toBe('/trophies/trophy-ai-plans-gold.png');
    expect(trophyImage('plan_visited', 'single')).toBe('/trophies/trophy-plan-visited.png');
  });
  it('groups 4 tiered and 4 single types', () => {
    expect(TIERED_TYPES).toEqual(['ai_plans', 'comments', 'favorites', 'clones']);
    expect(SINGLE_TYPES).toEqual(['excel_export', 'publish_plan', 'share_plan', 'plan_visited']);
  });
  it('nextGoal returns the first unmet tier', () => {
    expect(nextGoal('comments', 0)).toEqual({ tier: 'bronze', needed: 1 });
    expect(nextGoal('comments', 7)).toEqual({ tier: 'silver', needed: 20 });
    expect(nextGoal('comments', 70)).toBeNull();
    expect(nextGoal('share_plan', 0)).toEqual({ tier: 'single', needed: 1 });
  });
  it('has names/descriptions for every type', () => {
    expect(trophyName('favorites')).toBe('Maravilloso plan!');
    expect(trophyDescription('clones', 'silver')).toContain('5');
    expect(trophyKey('clones', 'gold')).toBe('clones:gold');
  });
});
