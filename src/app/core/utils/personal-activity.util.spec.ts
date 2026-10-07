import { activityMeta, getPersonalActivityMetas } from '../models/personal-activity.model';
import { isPersonal, personalAttraction, resolvePlannedAttraction } from './personal-activity.util';

describe('personal activities', () => {
  it('ships the 8 launch types in order', () =>
    expect(getPersonalActivityMetas().map(m => m.type))
      .toEqual(['breakfast', 'lunch', 'dinner', 'coffee', 'walk', 'rest', 'shopping', 'free_time']));
  it('unknown type falls back to free_time', () => expect(activityMeta('brunch').type).toBe('free_time'));
  it('undefined type falls back to free_time', () => expect(activityMeta(undefined).type).toBe('free_time'));
  it('isPersonal', () => {
    expect(isPersonal({ activityType: 'lunch' })).toBe(true);
    expect(isPersonal({})).toBe(false);
  });
  it('personalAttraction uses the stored title for every locale', () => {
    const a = personalAttraction({ activityType: 'lunch', title: 'Almuerzo con Rosa' });
    expect(a).toMatchObject({ id: 'personal:lunch', name: 'Almuerzo con Rosa', nameEn: 'Almuerzo con Rosa', icon: '🍽️', estimatedMinutes: 60, active: true });
  });
  it('personalAttraction with a missing title falls back to the label', () =>
    expect(personalAttraction({ activityType: 'walk' }).name).toBe(activityMeta('walk').label));
  it('resolvePlannedAttraction: personal entry never touches the catalog', () =>
    expect(resolvePlannedAttraction('nowhere', { activityType: 'rest', title: 'Siesta' })!.name).toBe('Siesta'));
  it('resolvePlannedAttraction: catalog entry resolves, unknown resolves to null', () => {
    expect(resolvePlannedAttraction('paris', { attractionId: 'paris_0' })?.id).toBe('paris_0');
    expect(resolvePlannedAttraction('paris', { attractionId: 'nope_999' })).toBeNull();
  });
});
