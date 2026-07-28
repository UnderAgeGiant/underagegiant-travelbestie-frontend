import { attractionImages } from './attraction-images.util';

describe('attractionImages', () => {
  it('returns an empty array when there is no imageUrl and no images', () => {
    expect(attractionImages({})).toEqual([]);
  });

  it('returns a single-item array when only imageUrl is set', () => {
    expect(attractionImages({ imageUrl: 'https://img/a.jpg' })).toEqual(['https://img/a.jpg']);
  });

  it('puts imageUrl first, followed by the images array', () => {
    expect(attractionImages({
      imageUrl: 'https://img/cover.jpg',
      images: ['https://img/b.jpg', 'https://img/c.jpg'],
    })).toEqual(['https://img/cover.jpg', 'https://img/b.jpg', 'https://img/c.jpg']);
  });

  it('returns just the images array when imageUrl is absent', () => {
    expect(attractionImages({ images: ['https://img/b.jpg'] })).toEqual(['https://img/b.jpg']);
  });

  it('deduplicates a URL that appears in both imageUrl and images', () => {
    expect(attractionImages({
      imageUrl: 'https://img/a.jpg',
      images: ['https://img/a.jpg', 'https://img/b.jpg'],
    })).toEqual(['https://img/a.jpg', 'https://img/b.jpg']);
  });

  it('skips empty-string entries in images', () => {
    expect(attractionImages({
      imageUrl: 'https://img/a.jpg',
      images: ['', 'https://img/b.jpg'],
    })).toEqual(['https://img/a.jpg', 'https://img/b.jpg']);
  });
});
