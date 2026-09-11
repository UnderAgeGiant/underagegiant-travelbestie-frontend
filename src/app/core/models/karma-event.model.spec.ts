import { karmaReasonLabel } from './karma-event.model';

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
