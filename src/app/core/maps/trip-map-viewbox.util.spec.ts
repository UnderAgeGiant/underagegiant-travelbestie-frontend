import { computeTripMapViewBox } from './trip-map-viewbox.util';

describe('computeTripMapViewBox', () => {
  it('returns the full world box when there are no points', () => {
    expect(computeTripMapViewBox([])).toEqual({ x: 0, y: 0, width: 100, height: 50 });
  });

  it('frames a single point with the minimum span, centered on it', () => {
    expect(computeTripMapViewBox([{ x: 50, y: 25 }])).toEqual({ x: 45, y: 22.5, width: 10, height: 5 });
  });

  it('frames two nearby points with the minimum span, centered on their midpoint', () => {
    const box = computeTripMapViewBox([
      { x: 50, y: 25 },
      { x: 52, y: 26 },
    ]);
    expect(box).toEqual({ x: 46, y: 23, width: 10, height: 5 });
  });

  it('always returns a 2:1 width:height box, even when padding a wide-but-short span', () => {
    const box = computeTripMapViewBox([
      { x: 30, y: 25 },
      { x: 70, y: 25.5 },
    ]);
    expect(box.width).toBeCloseTo(box.height * 2, 5);
  });

  it('clamps a world-spanning trip to the full world extent without exceeding it', () => {
    const box = computeTripMapViewBox([
      { x: 10, y: 20 },
      { x: 90, y: 30 },
    ]);
    expect(box).toEqual({ x: 0, y: 0, width: 100, height: 50 });
  });

  it('never lets the box extend past the world edges for an off-center cluster', () => {
    const box = computeTripMapViewBox([
      { x: 1, y: 1 },
      { x: 2, y: 1.5 },
    ]);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(100);
    expect(box.y + box.height).toBeLessThanOrEqual(50);
  });
});
