import { karmaReasonLabel, isPlanLinkedReason } from './karma-event.model';

describe('karmaReasonLabel', () => {
  it('returns a natural-language label for a known reason', () => {
    expect(karmaReasonLabel('trip_created')).toBe('Viaje creado');
  });

  it('returns a distinct label for ai_plan vs ai_plan_refund', () => {
    expect(karmaReasonLabel('ai_plan')).toBe('Plan de IA generado');
    expect(karmaReasonLabel('ai_plan_refund')).toBe('Reembolso de plan de IA');
  });

  it('falls back to the raw string for an unrecognized reason', () => {
    expect(karmaReasonLabel('some_future_reason')).toBe('some_future_reason');
  });
});

describe('isPlanLinkedReason', () => {
  it('is true for every reason that can resolve to a trip or ai_plan_request target', () => {
    expect(isPlanLinkedReason('trip_created')).toBe(true);
    expect(isPlanLinkedReason('itinerary_exported')).toBe(true);
    expect(isPlanLinkedReason('collaborator_invite')).toBe(true);
    expect(isPlanLinkedReason('trip_shared')).toBe(true);
    expect(isPlanLinkedReason('ai_city_suggest')).toBe(true);
    expect(isPlanLinkedReason('ai_plan')).toBe(true);
  });

  it('is false for reasons that never link to a plan', () => {
    expect(isPlanLinkedReason('companion_boost')).toBe(false);
    expect(isPlanLinkedReason('karma_purchased')).toBe(false);
    expect(isPlanLinkedReason('attraction_comment_first')).toBe(false);
    expect(isPlanLinkedReason('step_comment')).toBe(false);
    expect(isPlanLinkedReason('ai_plan_refund')).toBe(false);
    // ai_suggest's null target is the common "never saved a trip" case, not a deletion — see karma-event.model.ts
    expect(isPlanLinkedReason('ai_suggest')).toBe(false);
  });
});
