import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DestinationComponent } from './destination.component';
import { TripService } from '../trip/trip.service';
import { WORLD_CITIES } from '../../data/cities.data';
import { __setAttractionSourceForTests, loadCityAttractions } from '../../data/attractions.data';

const PARIS = WORLD_CITIES.find(c => c.id === 'paris')!;

describe('DestinationComponent — attraction load states', () => {
  const realFetch = globalThis.fetch;
  let fixture: ComponentFixture<DestinationComponent>;
  let trip: TripService;

  function setup(): void {
    localStorage.clear();
    (window as any).matchMedia = () => ({ matches: false, media: '', addEventListener: () => {}, removeEventListener: () => {} });
    __setAttractionSourceForTests(null);
    TestBed.configureTestingModule({
      imports: [DestinationComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    trip = TestBed.inject(TripService);
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    fixture = TestBed.createComponent(DestinationComponent);
  }

  afterEach(() => {
    globalThis.fetch = realFetch;
    __setAttractionSourceForTests((globalThis as any).__tbJestAttractionSource);
  });

  it('while the city file loads: shows the loading text, no count badge, and leaves the trip untouched', () => {
    globalThis.fetch = jest.fn(() => new Promise<Response>(() => {})) as unknown as typeof fetch;
    setup();
    const before = JSON.stringify(trip.stops());

    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Cargando atracciones…');
    expect(el.querySelector('.dest-banner-badges')!.textContent).not.toMatch(/\d+\s+atracci/);
    expect(JSON.stringify(trip.stops())).toBe(before);
  });

  it('on a failed city file: shows the error text and Reintentar, which fetches the city again', async () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error('network down'));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    setup();
    const before = JSON.stringify(trip.stops());
    fixture.detectChanges();
    await loadCityAttractions(['paris']);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('No pudimos cargar las atracciones.');
    expect(el.textContent).not.toContain('Cargando atracciones…');
    expect(el.querySelector('.dest-banner-badges')!.textContent).not.toMatch(/\d+\s+atracci/);
    expect(JSON.stringify(trip.stops())).toBe(before);

    const retry = Array.from(el.querySelectorAll('button')).find(b => b.textContent?.includes('Reintentar'))!;
    expect(retry).toBeTruthy();
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] });
    retry.click();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
