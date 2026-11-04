import { inject } from '@vercel/analytics';
import { initVercelAnalytics, stripQuery } from './vercel-analytics';

jest.mock('@vercel/analytics', () => ({ inject: jest.fn() }));

describe('stripQuery', () => {
  it('drops the query string and hash', () => {
    expect(stripQuery({ type: 'pageview', url: 'https://tripilove.com/reset?token=abc#x' }).url)
      .toBe('https://tripilove.com/reset');
  });

  it('leaves a plain URL unchanged', () => {
    expect(stripQuery({ type: 'pageview', url: 'https://tripilove.com/trips/1' }).url)
      .toBe('https://tripilove.com/trips/1');
  });
});

describe('initVercelAnalytics', () => {
  beforeEach(() => (inject as jest.Mock).mockClear());

  it('injects nothing outside production', () => {
    initVercelAnalytics(false);
    expect(inject).not.toHaveBeenCalled();
  });

  it('injects once in production mode with the query stripper', () => {
    initVercelAnalytics(true);
    expect(inject).toHaveBeenCalledTimes(1);
    expect(inject).toHaveBeenCalledWith({ mode: 'production', beforeSend: stripQuery });
  });
});
