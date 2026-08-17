import { TestBed } from '@angular/core/testing';
import { AnonymousIdService } from './anonymous-id.service';

describe('AnonymousIdService', () => {
  let service: AnonymousIdService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnonymousIdService);
  });

  it('generates a UUID and persists it in localStorage on first call', () => {
    const id = service.get();
    expect(id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(localStorage.getItem('tb_anonymous_id')).toBe(id);
  });

  it('returns the same id on subsequent calls within the same instance', () => {
    const first = service.get();
    const second = service.get();
    expect(second).toBe(first);
  });

  it('reads back an id already persisted by a previous browser session', () => {
    localStorage.setItem('tb_anonymous_id', 'existing-id-123');
    expect(service.get()).toBe('existing-id-123');
  });
});
