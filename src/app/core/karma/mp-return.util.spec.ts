import { parseMpReturnParams, stripMpReturnParams } from './mp-return.util';

describe('parseMpReturnParams', () => {
  it('parses mp_purchase and mp_status=success', () => {
    expect(parseMpReturnParams('?mp_purchase=mp_abc123&mp_status=success'))
      .toEqual({ purchaseRef: 'mp_abc123', status: 'success' });
  });

  it('defaults to success when mp_status is missing', () => {
    expect(parseMpReturnParams('?mp_purchase=mp_abc123'))
      .toEqual({ purchaseRef: 'mp_abc123', status: 'success' });
  });

  it('parses failure and pending statuses', () => {
    expect(parseMpReturnParams('?mp_purchase=mp_x&mp_status=failure')!.status).toBe('failure');
    expect(parseMpReturnParams('?mp_purchase=mp_x&mp_status=pending')!.status).toBe('pending');
  });

  it('returns null when there is no mp_purchase param', () => {
    expect(parseMpReturnParams('?foo=bar')).toBeNull();
    expect(parseMpReturnParams('')).toBeNull();
  });
});

describe('stripMpReturnParams', () => {
  it('removes mp_purchase and mp_status, keeping other params', () => {
    expect(stripMpReturnParams('?mp_purchase=mp_x&mp_status=success&highlight=clone')).toBe('?highlight=clone');
  });

  it('returns empty string when nothing else remains', () => {
    expect(stripMpReturnParams('?mp_purchase=mp_x&mp_status=success')).toBe('');
  });
});
