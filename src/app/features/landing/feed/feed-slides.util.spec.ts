import { buildFeedSlides } from './feed-slides.util';
import { FeedPlan } from '../../../core/models/feed-plan.model';
import { findCuratedAttraction, getAttractions } from '../../../data/attractions.data';

jest.mock('../../../data/attractions.data', () => ({
  findCuratedAttraction: jest.fn(),
  getAttractions: jest.fn(() => []),
}));

const find = findCuratedAttraction as jest.Mock;
const att = (id: string, extra: object = {}) => ({
  id, name: `Name ${id}`, type: 'Histórico', category: 'poi', active: true, icon: '🏛️', bg: '#E8F0FD',
  rating: 4.7, estimatedMinutes: 60, imageUrl: `https://img/${id}.jpg`, ...extra,
});

const plan = (stops: FeedPlan['stops']): FeedPlan => ({
  id: 'p1', tripName: 'T', ownerName: 'Ana', createdAt: '2026-09-01T00:00:00Z', favoriteCount: 1, stops,
});

describe('buildFeedSlides', () => {
  beforeEach(() => { find.mockReset(); (getAttractions as jest.Mock).mockReturnValue([]); });

  it('flattens attractions across stops in trip order', () => {
    find.mockImplementation((_c: string, id: string) => att(id));
    const slides = buildFeedSlides(plan([
      { cityId: 'paris', checkIn: '01/07/2026', checkOut: '03/07/2026', selectedAttractions: [{ attractionId: 'paris_1', startTime: null, endTime: null }] },
      { cityId: 'rome',  checkIn: '04/07/2026', checkOut: '06/07/2026', selectedAttractions: [{ attractionId: 'rome_2',  startTime: null, endTime: null }] },
    ]), 'es-CL');
    expect(slides.map(s => s.attractionId)).toEqual(['paris_1', 'rome_2']);
    expect(slides[0]).toMatchObject({ name: 'Name paris_1', cityId: 'paris', icon: '🏛️', rating: 4.7 });
  });

  it('within a stop sorts by date then startTime, untimed last, stable otherwise', () => {
    find.mockImplementation((_c: string, id: string) => att(id));
    const slides = buildFeedSlides(plan([{
      cityId: 'paris', checkIn: '01/07/2026', checkOut: '03/07/2026',
      selectedAttractions: [
        { attractionId: 'a', date: '02/07/2026', startTime: '09:00', endTime: null },
        { attractionId: 'b', startTime: null, endTime: null },                       // defaults to check-in day
        { attractionId: 'c', date: '01/07/2026', startTime: '15:00', endTime: null },
        { attractionId: 'd', date: '01/07/2026', startTime: '10:00', endTime: null },
      ],
    }]), 'es-CL');
    expect(slides.map(s => s.attractionId)).toEqual(['d', 'c', 'b', 'a']);
  });

  it('skips attractions the catalog cannot resolve', () => {
    find.mockImplementation((_c: string, id: string) => (id === 'ghost' ? undefined : att(id)));
    const slides = buildFeedSlides(plan([{
      cityId: 'paris', checkIn: '01/07/2026', checkOut: '03/07/2026',
      selectedAttractions: [
        { attractionId: 'ghost', startTime: null, endTime: null },
        { attractionId: 'real',  startTime: null, endTime: null },
      ],
    }]), 'es-CL');
    expect(slides.map(s => s.attractionId)).toEqual(['real']);
  });

  it('image fallback chain: imageUrl -> images[0] -> city cover photo -> null', () => {
    find.mockImplementation((_c: string, id: string) => {
      if (id === 'own')    return att(id);
      if (id === 'gallery') return att(id, { imageUrl: undefined, images: ['https://img/g0.jpg'] });
      return att(id, { imageUrl: undefined });
    });
    const s = buildFeedSlides(plan([{
      cityId: 'paris', checkIn: '01/07/2026', checkOut: '03/07/2026',
      selectedAttractions: ['own', 'gallery', 'bare'].map(attractionId => ({ attractionId, startTime: null, endTime: null })),
    }]), 'es-CL');
    expect(s[0].imageUrl).toBe('https://img/own.jpg');
    expect(s[1].imageUrl).toBe('https://img/g0.jpg');
    expect(s[2].imageUrl).toContain('images.unsplash.com'); // CITY_COVER_PHOTOS.paris
    // a city with no cover photo and no attraction image yields null
    const none = buildFeedSlides(plan([{
      cityId: 'no-such-city', checkIn: '01/07/2026', checkOut: '03/07/2026',
      selectedAttractions: [{ attractionId: 'bare', startTime: null, endTime: null }],
    }]), 'es-CL');
    expect(none[0].imageUrl).toBeNull();
  });

  it('gives unique slide ids even when the same attraction appears twice', () => {
    find.mockImplementation((_c: string, id: string) => att(id));
    const s = buildFeedSlides(plan([{
      cityId: 'paris', checkIn: '01/07/2026', checkOut: '03/07/2026',
      selectedAttractions: [
        { attractionId: 'x', startTime: '09:00', endTime: null },
        { attractionId: 'x', startTime: '19:00', endTime: null },
      ],
    }]), 'es-CL');
    expect(new Set(s.map(x => x.id)).size).toBe(2);
  });

  it('returns [] for a plan with no attractions', () => {
    expect(buildFeedSlides(plan([{ cityId: 'paris', checkIn: '01/07/2026', checkOut: '03/07/2026', selectedAttractions: [] }]), 'es-CL')).toEqual([]);
  });
});
