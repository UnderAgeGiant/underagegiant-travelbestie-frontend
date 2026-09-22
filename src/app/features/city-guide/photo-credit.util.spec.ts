import { photoCreditUrl } from './photo-credit.util';

describe('photoCreditUrl', () => {
  it('maps a Commons thumbnail URL to its file page', () => {
    expect(photoCreditUrl('https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Torre_Eiffel.jpg/1280px-Torre_Eiffel.jpg'))
      .toBe('https://commons.wikimedia.org/wiki/File:Torre_Eiffel.jpg');
  });
  it('maps an original Commons URL', () => {
    expect(photoCreditUrl('https://upload.wikimedia.org/wikipedia/commons/a/ab/Torre_Eiffel.jpg'))
      .toBe('https://commons.wikimedia.org/wiki/File:Torre_Eiffel.jpg');
  });
  it('keeps percent-encoding of the file name', () => {
    expect(photoCreditUrl('https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Paris_75005_Quai_de_Montebello.jpg/1920px-Paris_75005_Quai_de_Montebello.jpg'))
      .toBe('https://commons.wikimedia.org/wiki/File:Paris_75005_Quai_de_Montebello.jpg');
  });
  it('maps the thumb.wikimedia.org CDN host the same way (current imageinfo API behaviour)', () => {
    expect(photoCreditUrl('https://thumb.wikimedia.org/wikipedia/commons/thumb/6/68/Museo_del_Prado.jpg/1280px-Museo_del_Prado.jpg?utm_source=commons.wikimedia.org'))
      .toBe('https://commons.wikimedia.org/wiki/File:Museo_del_Prado.jpg');
  });
  it('returns null for other hosts, other wikis, junk or missing', () => {
    expect(photoCreditUrl('https://images.unsplash.com/photo-1')).toBeNull();
    expect(photoCreditUrl('https://upload.wikimedia.org/wikipedia/en/thumb/a/ab/X.png/200px-X.png')).toBeNull();
    expect(photoCreditUrl('not a url')).toBeNull();
    expect(photoCreditUrl(undefined)).toBeNull();
  });
});
