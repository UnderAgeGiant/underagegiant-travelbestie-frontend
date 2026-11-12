import { sizedImageUrl } from './sized-image-url.util';

const T = 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Taj_Mahal%2C_Agra%2C_India_edit2.jpg';

describe('sizedImageUrl', () => {
  it('shrinks a Wikimedia thumb', () =>
    expect(sizedImageUrl(`${T}/1920px-Taj_Mahal%2C_Agra%2C_India_edit2.jpg`, 500)).toBe(
      `${T}/500px-Taj_Mahal%2C_Agra%2C_India_edit2.jpg`,
    ));

  it('keeps the query string on thumb.wikimedia.org', () =>
    expect(
      sizedImageUrl('https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8c/M.JPG/1280px-M.JPG?utm_source=commons.wikimedia.org', 960),
    ).toBe('https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8c/M.JPG/960px-M.JPG?utm_source=commons.wikimedia.org'));

  it('never upscales', () =>
    expect(sizedImageUrl(`${T}/330px-x.jpg`, 500)).toBe(`${T}/330px-x.jpg`));

  it('turns a jpg/png original into a thumb', () =>
    expect(sizedImageUrl('https://upload.wikimedia.org/wikipedia/commons/1/16/Paliwal_Park_Agra_Uttar_Pradesh.jpg', 500)).toBe(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Paliwal_Park_Agra_Uttar_Pradesh.jpg/500px-Paliwal_Park_Agra_Uttar_Pradesh.jpg',
    ));

  it.each([
    'https://upload.wikimedia.org/wikipedia/commons/a/ab/Map.svg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Doc.pdf/page1-500px-Doc.pdf.jpg',
    'https://images.unsplash.com/photo-1564507592333-87154ceb8e23?auto=format&fit=crop&w=800&q=80',
    'https://live.staticflickr.com/1/2_3.jpg',
    'https://www.civitatis.com/f/francia/paris/visita-guiada-paris-v02-grid.jpg',
    'not a url',
  ])('leaves %s unchanged', (u) => expect(sizedImageUrl(u, 500)).toBe(u));
});
