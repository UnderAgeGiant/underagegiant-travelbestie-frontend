import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CityWeatherChipComponent } from './city-weather-chip.component';
import { TripStop } from '../../core/models/trip.model';

function stop(checkIn: string, checkOut: string): TripStop {
  return { stopId: 's1', cityId: 'paris', checkIn, checkOut, selectedAttractions: [] };
}

// The popover is reparented to <body> (see the component's own doc comment) so it
// always escapes a transformed ancestor card — query it from document.body, not
// fixture.nativeElement, which now only ever contains the chip itself.
function popover(): HTMLElement | null {
  return document.body.querySelector('.city-weather-popover');
}

// jsdom has no matchMedia — mirrors the helper already used in stop-list.component.spec.ts.
function installMatchMediaMock(initialMatches: boolean): void {
  (window as any).matchMedia = () => ({
    matches: initialMatches, media: '(hover: none)',
    addEventListener: () => {}, removeEventListener: () => {},
  });
}

describe('CityWeatherChipComponent', () => {
  let http: HttpTestingController;
  let fixture: ComponentFixture<CityWeatherChipComponent>;

  beforeEach(() => {
    installMatchMediaMock(false);
    TestBed.configureTestingModule({
      imports: [CityWeatherChipComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CityWeatherChipComponent);
  });

  afterEach(() => { http.verify(); jest.useRealTimers(); });

  it('requests weather for its stop as soon as it is created', () => {
    fixture.componentRef.setInput('stop', stop('01/06/2026', '05/06/2026'));
    fixture.detectChanges();

    const req = http.expectOne(r => r.url.includes('/weather') && r.params.get('cityId') === 'paris');
    expect(req.request.params.get('checkIn')).toBe('01/06/2026');
    expect(req.request.params.get('checkOut')).toBe('05/06/2026');
    req.flush({ days: [] }, { headers: { ETag: '"etag-1"' } });
  });

  it('renders a min/max temperature chip once weather resolves', () => {
    fixture.componentRef.setInput('stop', stop('01/06/2026', '05/06/2026'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.city-weather-chip')).toBeNull();

    http.expectOne(r => r.url.includes('/weather')).flush(
      { days: [{ date: '01/06/2026', type: 'forecast', tempMinC: 14, tempMaxC: 23, weatherCode: 3 }] },
      { headers: { ETag: '"etag-1"' } },
    );
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('.city-weather-chip');
    expect(chip).not.toBeNull();
    expect(chip.textContent).toContain('14°');
    expect(chip.textContent).toContain('23°');
    expect(chip.classList.contains('city-weather-chip-historic')).toBe(false);
  });

  it('renders the chip in grayscale-historic mode with a "?" mark when the day is a historic estimate', () => {
    fixture.componentRef.setInput('stop', stop('01/06/2026', '05/06/2026'));
    fixture.detectChanges();
    http.expectOne(r => r.url.includes('/weather')).flush(
      { days: [{ date: '01/06/2026', type: 'historic', tempMinC: 9, tempMaxC: 18, weatherCode: 61 }] },
      { headers: { ETag: '"etag-1"' } },
    );
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('.city-weather-chip');
    expect(chip.classList.contains('city-weather-chip-historic')).toBe(true);
    expect(chip.querySelector('.city-weather-mark')).not.toBeNull();
  });

  it('does not render a chip when the day is unavailable', () => {
    fixture.componentRef.setInput('stop', stop('01/06/2026', '05/06/2026'));
    fixture.detectChanges();
    http.expectOne(r => r.url.includes('/weather')).flush(
      { days: [{ date: '01/06/2026', type: 'unavailable' }] },
      { headers: { ETag: '"etag-1"' } },
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.city-weather-chip')).toBeNull();
  });

  it('opens a popover on hover listing every day in the stop\'s range with icon, min/max, and a forecast/historic tag', () => {
    jest.useFakeTimers();
    fixture.componentRef.setInput('stop', stop('01/06/2026', '03/06/2026'));
    fixture.detectChanges();
    http.expectOne(r => r.url.includes('/weather')).flush(
      {
        days: [
          { date: '01/06/2026', type: 'forecast', tempMinC: 14, tempMaxC: 23, weatherCode: 3 },
          { date: '02/06/2026', type: 'forecast', tempMinC: 15, tempMaxC: 24, weatherCode: 0 },
          { date: '03/06/2026', type: 'historic', tempMinC: 9,  tempMaxC: 18, weatherCode: 61 },
        ],
      },
      { headers: { ETag: '"etag-1"' } },
    );
    fixture.detectChanges();

    expect(popover()).toBeNull();

    const chip = fixture.nativeElement.querySelector('.city-weather-chip');
    chip.dispatchEvent(new MouseEvent('mouseenter', { clientX: 100, clientY: 100 }));
    jest.advanceTimersByTime(150);
    fixture.detectChanges();

    const rows = popover()!.querySelectorAll('.city-weather-popover-row');
    expect(rows.length).toBe(3);
    expect(rows[0].textContent).toContain('14°/23°');
    expect(rows[0].classList.contains('city-weather-popover-row-historic')).toBe(false);
    expect(rows[2].textContent).toContain('9°/18°');
    expect(rows[2].classList.contains('city-weather-popover-row-historic')).toBe(true);
  });

  it('does not open the popover before the 150ms hover delay elapses', () => {
    jest.useFakeTimers();
    fixture.componentRef.setInput('stop', stop('01/06/2026', '01/06/2026'));
    fixture.detectChanges();
    http.expectOne(r => r.url.includes('/weather')).flush(
      { days: [{ date: '01/06/2026', type: 'forecast', tempMinC: 14, tempMaxC: 23, weatherCode: 3 }] },
      { headers: { ETag: '"etag-1"' } },
    );
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('.city-weather-chip');
    chip.dispatchEvent(new MouseEvent('mouseenter', { clientX: 100, clientY: 100 }));
    jest.advanceTimersByTime(100);
    fixture.detectChanges();

    expect(popover()).toBeNull();
  });

  it('closes the popover on mouseleave', () => {
    jest.useFakeTimers();
    fixture.componentRef.setInput('stop', stop('01/06/2026', '01/06/2026'));
    fixture.detectChanges();
    http.expectOne(r => r.url.includes('/weather')).flush(
      { days: [{ date: '01/06/2026', type: 'forecast', tempMinC: 14, tempMaxC: 23, weatherCode: 3 }] },
      { headers: { ETag: '"etag-1"' } },
    );
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('.city-weather-chip');
    chip.dispatchEvent(new MouseEvent('mouseenter', { clientX: 100, clientY: 100 }));
    jest.advanceTimersByTime(150);
    fixture.detectChanges();
    expect(popover()).not.toBeNull();

    chip.dispatchEvent(new MouseEvent('mouseleave'));
    fixture.detectChanges();
    expect(popover()).toBeNull();
  });

  it('toggles the popover on click for touch devices with no hover capability', () => {
    fixture.componentRef.setInput('stop', stop('01/06/2026', '01/06/2026'));
    fixture.detectChanges();
    http.expectOne(r => r.url.includes('/weather')).flush(
      { days: [{ date: '01/06/2026', type: 'forecast', tempMinC: 14, tempMaxC: 23, weatherCode: 3 }] },
      { headers: { ETag: '"etag-1"' } },
    );
    fixture.detectChanges();

    installMatchMediaMock(true); // simulate '(hover: none)' matching (touch device)
    const chip = fixture.nativeElement.querySelector('.city-weather-chip');
    chip.dispatchEvent(new MouseEvent('click', { clientX: 100, clientY: 100 }));
    fixture.detectChanges();
    expect(popover()).not.toBeNull();

    chip.dispatchEvent(new MouseEvent('click', { clientX: 100, clientY: 100 }));
    fixture.detectChanges();
    expect(popover()).toBeNull();
  });

  it('does not open the popover on click when the device can hover (desktop)', () => {
    fixture.componentRef.setInput('stop', stop('01/06/2026', '01/06/2026'));
    fixture.detectChanges();
    http.expectOne(r => r.url.includes('/weather')).flush(
      { days: [{ date: '01/06/2026', type: 'forecast', tempMinC: 14, tempMaxC: 23, weatherCode: 3 }] },
      { headers: { ETag: '"etag-1"' } },
    );
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('.city-weather-chip');
    chip.dispatchEvent(new MouseEvent('click', { clientX: 100, clientY: 100 }));
    fixture.detectChanges();

    expect(popover()).toBeNull();
  });

  it('reparents the popover to document.body so it always escapes a transformed ancestor card', () => {
    jest.useFakeTimers();
    fixture.componentRef.setInput('stop', stop('01/06/2026', '01/06/2026'));
    fixture.detectChanges();
    http.expectOne(r => r.url.includes('/weather')).flush(
      { days: [{ date: '01/06/2026', type: 'forecast', tempMinC: 14, tempMaxC: 23, weatherCode: 3 }] },
      { headers: { ETag: '"etag-1"' } },
    );
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('.city-weather-chip');
    chip.dispatchEvent(new MouseEvent('mouseenter', { clientX: 100, clientY: 100 }));
    jest.advanceTimersByTime(150);
    fixture.detectChanges();

    const pop = popover();
    expect(pop).toBeTruthy();
    expect(pop!.parentElement).toBe(document.body);
    expect(fixture.nativeElement.contains(pop)).toBe(false);
  });

  it('removes the popover from document.body when the component is destroyed', () => {
    jest.useFakeTimers();
    fixture.componentRef.setInput('stop', stop('01/06/2026', '01/06/2026'));
    fixture.detectChanges();
    http.expectOne(r => r.url.includes('/weather')).flush(
      { days: [{ date: '01/06/2026', type: 'forecast', tempMinC: 14, tempMaxC: 23, weatherCode: 3 }] },
      { headers: { ETag: '"etag-1"' } },
    );
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('.city-weather-chip');
    chip.dispatchEvent(new MouseEvent('mouseenter', { clientX: 100, clientY: 100 }));
    jest.advanceTimersByTime(150);
    fixture.detectChanges();
    expect(popover()).toBeTruthy();

    fixture.destroy();
    expect(popover()).toBeNull();
  });
});
