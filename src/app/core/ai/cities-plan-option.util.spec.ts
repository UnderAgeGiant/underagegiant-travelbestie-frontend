import { citiesPlanOption } from './cities-plan-option.util';

describe('citiesPlanOption', () => {
  it('builds the byte-exact option (fixture shared with the backend buildCitiesPlanOption)', () => {
    expect(JSON.stringify(citiesPlanOption([{ id: 'rome', name: 'Rome' }, { id: 'florence', name: 'Florence' }], 5)))
      .toBe('{"id":0,"title":"Viaje a Rome, Florence","summary":"Itinerario de 5 días por Rome, Florence","highlights":["Rome","Florence"],"cityIds":["rome","florence"]}');
  });
});
