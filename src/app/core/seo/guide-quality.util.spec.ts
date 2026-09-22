import { evaluateGuideQuality, QualityAttraction } from './guide-quality.util';

const good = (i: number, o: Partial<QualityAttraction> = {}): QualityAttraction => ({
  active: true, rating: 4.1 + (i % 8) / 10, imageUrl: 'https://x/y.jpg',
  description: 'Una descripción suficientemente larga para superar el umbral de sesenta caracteres.', ...o,
});

describe('evaluateGuideQuality', () => {
  it('passes a deep, varied, described, illustrated city', () => {
    const r = evaluateGuideQuality(Array.from({ length: 40 }, (_, i) => good(i)));
    expect(r).toEqual({ ok: true, reasons: [] });
  });

  it('ignores inactive entries', () => {
    const list = [...Array.from({ length: 30 }, (_, i) => good(i)), ...Array.from({ length: 20 }, (_, i) => good(i, { active: false, imageUrl: undefined }))];
    expect(evaluateGuideQuality(list).ok).toBe(true);
  });

  it('fails a thin city', () => {
    const r = evaluateGuideQuality(Array.from({ length: 14 }, (_, i) => good(i)));
    expect(r.ok).toBe(false);
    expect(r.reasons.join()).toMatch(/active < 30/);
  });

  it('fails when descriptions or images are missing', () => {
    const list = Array.from({ length: 40 }, (_, i) => good(i, i % 2 ? { description: 'corta', imageUrl: undefined } : {}));
    const text = evaluateGuideQuality(list).reasons.join();
    expect(text).toMatch(/descriptions < 90%/);
    expect(text).toMatch(/images < 80%/);
  });

  it('fails the flat-rating cluster (the UNESCO 4.9 artifact)', () => {
    const list = Array.from({ length: 40 }, (_, i) => good(i, { rating: i < 20 ? 4.9 : 4.1 + (i % 8) / 10 }));
    expect(evaluateGuideQuality(list).reasons.join()).toMatch(/same rating > 25%/);
    const flat = Array.from({ length: 40 }, (_, i) => good(i, { rating: 4.9 }));
    expect(evaluateGuideQuality(flat).reasons.join()).toMatch(/distinct ratings < 6/);
  });
});
