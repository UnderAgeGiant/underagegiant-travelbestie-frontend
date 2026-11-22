import { readAiLastInputs, writeAiLastInputs, clearAiLastInputs } from './ai-last-inputs';

describe('ai-last-inputs', () => {
  const TODAY = new Date(2026, 6, 1); // 01/07/2026
  beforeEach(() => localStorage.clear());
  afterEach(() => jest.restoreAllMocks());

  it('round-trips inputs per user', () => {
    writeAiLastInputs('ana@test.com', { cities: ['rome'], duration: 5, startDate: '02/07/2026', preferences: 'museos', budget: '500', categories: ['foodie'] });
    expect(readAiLastInputs('ana@test.com', TODAY)).toEqual({ cities: ['rome'], duration: 5, startDate: '02/07/2026', preferences: 'museos', budget: '500', categories: ['foodie'] });
    expect(readAiLastInputs('bob@test.com', TODAY)).toBeNull();
  });

  it('startDate before today is dropped, the rest kept; today itself is kept', () => {
    writeAiLastInputs('ana@test.com', { cities: ['rome'], duration: 5, startDate: '30/06/2026' });
    expect(readAiLastInputs('ana@test.com', TODAY)).toEqual({ cities: ['rome'], duration: 5 });
    writeAiLastInputs('ana@test.com', { cities: ['rome'], startDate: '01/07/2026' });
    expect(readAiLastInputs('ana@test.com', TODAY)!.startDate).toBe('01/07/2026');
  });

  it('invalid JSON or a missing cities array → null', () => {
    localStorage.setItem('tb_ai_last_inputs:ana@test.com', '{nope');
    expect(readAiLastInputs('ana@test.com', TODAY)).toBeNull();
    localStorage.setItem('tb_ai_last_inputs:ana@test.com', '{"duration":3}');
    expect(readAiLastInputs('ana@test.com', TODAY)).toBeNull();
  });

  it('storage throwing → null / no throw', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(readAiLastInputs('ana@test.com', TODAY)).toBeNull();
    expect(() => writeAiLastInputs('ana@test.com', { cities: [] })).not.toThrow();
    expect(() => clearAiLastInputs()).not.toThrow();
  });

  it('clearAiLastInputs removes all users\' keys and nothing else', () => {
    writeAiLastInputs('ana@test.com', { cities: ['rome'] });
    writeAiLastInputs('bob@test.com', { cities: ['paris'] });
    localStorage.setItem('tb_other', 'x');
    clearAiLastInputs();
    expect(localStorage.getItem('tb_ai_last_inputs:ana@test.com')).toBeNull();
    expect(localStorage.getItem('tb_ai_last_inputs:bob@test.com')).toBeNull();
    expect(localStorage.getItem('tb_other')).toBe('x');
  });
});
