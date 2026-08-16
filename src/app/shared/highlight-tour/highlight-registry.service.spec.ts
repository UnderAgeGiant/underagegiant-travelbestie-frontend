import { TestBed } from '@angular/core/testing';
import { HighlightRegistryService } from './highlight-registry.service';

describe('HighlightRegistryService', () => {
  let service: HighlightRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HighlightRegistryService);
  });

  it('get() returns null for an unregistered id', () => {
    expect(service.get('search-bar')).toBeNull();
  });

  it('register() then get() returns the same element', () => {
    const el = document.createElement('div');
    service.register('search-bar', el);
    expect(service.get('search-bar')).toBe(el);
  });

  it('unregister() with a matching element clears it', () => {
    const el = document.createElement('div');
    service.register('search-bar', el);
    service.unregister('search-bar', el);
    expect(service.get('search-bar')).toBeNull();
  });

  it('unregister() with a stale (different) element is a no-op — guards against a destroyed old instance clobbering a freshly mounted one', () => {
    const oldEl = document.createElement('div');
    const newEl = document.createElement('div');
    service.register('search-bar', oldEl);
    service.register('search-bar', newEl); // e.g. desktop nav swapped in over mobile nav
    service.unregister('search-bar', oldEl); // old instance's ngOnDestroy fires after the swap
    expect(service.get('search-bar')).toBe(newEl);
  });
});
