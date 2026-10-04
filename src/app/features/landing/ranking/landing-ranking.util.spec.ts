import { buildCharts, myRankFor, meView, formatLastUpdate, formatWeekStart } from './landing-ranking.util';
import { WeeklyRankings } from '../../../core/models/ranking.model';

const W: WeeklyRankings = {
  weekStart: '2026-09-28', generatedAt: '2026-10-04T17:32:00.000Z',
  topPlanners: [{ name: 'Ana', value: 8 }, { name: 'Luis', value: 2 }],
  topDestinations: [{ cityId: 'paris', value: 3 }, { cityId: 'zz_unknown', value: 1 }],
  topTrophies: [],
  topFavorited: [{ title: 'Europa', shareId: 's 1', ownerName: 'Ana', value: 5 }],
};

describe('buildCharts', () => {
  it('builds the 4 charts in order with pct relative to the top value', () => {
    const charts = buildCharts(W, false);
    expect(charts.map(c => c.key)).toEqual(['planners', 'destinations', 'trophies', 'favorited']);
    expect(charts[0].rows.map(r => [r.label, r.pct])).toEqual([['Ana', 100], ['Luis', 25]]);
    expect(charts[0].fallback).toBe(false);
  });
  it('resolves city names and falls back to the raw id for unknown cities', () => {
    expect(buildCharts(W, false)[1].rows.map(r => r.label)).toEqual(['Paris', 'zz_unknown']);
  });
  it('links favorited plans to /shared/:shareId (encoded) with the owner as sublabel', () => {
    const row = buildCharts(W, false)[3].rows[0];
    expect(row.link).toBe('/shared/s%201');
    expect(row.sublabel).toContain('Ana');
  });
  it('an empty ranking uses the Travel Expert fallback, independently of the others', () => {
    const charts = buildCharts(W, false);
    expect(charts[2].fallback).toBe(true);
    expect(charts[2].rows[0].label).toBe('Travel Expert');
    expect(charts[0].fallback).toBe(false);
  });
  it('a failed request or null data gives fallback for all four, without links', () => {
    for (const charts of [buildCharts(null, true), buildCharts(null, false)]) {
      expect(charts.every(c => c.fallback)).toBe(true);
      expect(charts.every(c => c.rows.length > 0 && c.rows.every(r => !r.link))).toBe(true);
    }
  });
});

describe('myRankFor', () => {
  const mine = { weekStart: '2026-09-28', planners: { rank: 4, value: 1 }, trophies: null, favorited: null };
  it('maps keys and has nothing for destinations', () => {
    expect(myRankFor('planners', mine)).toEqual({ rank: 4, value: 1 });
    expect(myRankFor('trophies', mine)).toBeNull();
    expect(myRankFor('destinations', mine)).toBeNull();
    expect(myRankFor('planners', null)).toBeNull();
  });
});

describe('formatting', () => {
  it('formatLastUpdate shows time and a timezone name', () => {
    const s = formatLastUpdate('2026-10-04T17:32:00.000Z', 'es-CL', 'America/Santiago');
    expect(s).toContain('14:32');
    expect(formatLastUpdate('2026-10-04T17:32:00.000Z', 'en-US', 'UTC')).toMatch(/UTC/);
  });
  it('formatWeekStart renders the Monday without shifting the day', () => {
    expect(formatWeekStart('2026-09-28', 'en-US')).toContain('28');
  });
});

describe('meView', () => {
  const charts = buildCharts(W, false); // planners: Ana 8, Luis 2 · favorited: Europa (Ana) 5
  it('highlights the podium row matching the viewer by name and value', () => {
    expect(meView(charts[0], { rank: 1, value: 8 }, 'Ana')).toEqual({ highlight: 0, extra: null });
  });
  it('matches favorited plans by owner name, not plan title', () => {
    expect(meView(charts[3], { rank: 1, value: 5 }, 'Ana')).toEqual({ highlight: 0, extra: null });
  });
  it('outside the top 3 → an extra row with rank, value and pct relative to the chart max', () => {
    expect(meView(charts[0], { rank: 7, value: 2 }, 'Zoe')).toEqual({ highlight: null, extra: { rank: 7, value: 2, pct: 25 } });
  });
  it('a podium rank with no matching row (fallback chart, renamed user) still shows an extra row', () => {
    const fb = buildCharts(null, true)[0];
    expect(meView(fb, { rank: 1, value: 2 }, 'Ana').extra).toEqual({ rank: 1, value: 2, pct: 40 });
  });
  it('no position → nothing', () => {
    expect(meView(charts[0], null, 'Ana')).toEqual({ highlight: null, extra: null });
  });
});
