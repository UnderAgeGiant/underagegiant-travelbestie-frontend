import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TripMapComponent } from './trip-map.component';

describe('TripMapComponent', () => {
  let fixture: ComponentFixture<TripMapComponent>;

  function setUp(cities: { cityId: string; stopId?: string }[], overrides: Partial<{ interactive: boolean; showFlightPath: boolean }> = {}) {
    TestBed.configureTestingModule({ imports: [TripMapComponent] });
    fixture = TestBed.createComponent(TripMapComponent);
    fixture.componentRef.setInput('cities', cities);
    if (overrides.interactive !== undefined) fixture.componentRef.setInput('interactive', overrides.interactive);
    if (overrides.showFlightPath !== undefined) fixture.componentRef.setInput('showFlightPath', overrides.showFlightPath);
    fixture.detectChanges();
  }

  it('renders one pin per resolvable city, in input order', () => {
    setUp([{ cityId: 'paris' }, { cityId: 'london' }, { cityId: 'rome' }]);
    const pins = fixture.nativeElement.querySelectorAll('circle.trip-map-pin');
    expect(pins.length).toBe(3);
    expect(pins[0].getAttribute('aria-label')).toBe('Paris');
    expect(pins[1].getAttribute('aria-label')).toBe('London');
    expect(pins[2].getAttribute('aria-label')).toBe('Rome');
  });

  it('silently skips a city with no CITY_COORDS entry', () => {
    setUp([{ cityId: 'paris' }, { cityId: 'nonexistent-test-city-xyz' }, { cityId: 'london' }]);
    const pins = fixture.nativeElement.querySelectorAll('circle.trip-map-pin');
    expect(pins.length).toBe(2);
  });

  it('emits pinClick with the stopId when interactive and the pin has one', () => {
    setUp([{ cityId: 'paris', stopId: 'stop-1' }], { interactive: true });
    const emitted: string[] = [];
    fixture.componentInstance.pinClick.subscribe((id) => emitted.push(id));
    fixture.nativeElement.querySelector('circle.trip-map-pin').dispatchEvent(new Event('click'));
    expect(emitted).toEqual(['stop-1']);
  });

  it('does not emit pinClick when interactive is false', () => {
    setUp([{ cityId: 'paris', stopId: 'stop-1' }], { interactive: false });
    const emitted: string[] = [];
    fixture.componentInstance.pinClick.subscribe((id) => emitted.push(id));
    fixture.nativeElement.querySelector('circle.trip-map-pin').dispatchEvent(new Event('click'));
    expect(emitted).toEqual([]);
  });

  it('does not emit pinClick for a pin with no stopId even when interactive', () => {
    setUp([{ cityId: 'paris' }], { interactive: true });
    const emitted: string[] = [];
    fixture.componentInstance.pinClick.subscribe((id) => emitted.push(id));
    fixture.nativeElement.querySelector('circle.trip-map-pin').dispatchEvent(new Event('click'));
    expect(emitted).toEqual([]);
  });

  it('renders no route path or plane when showFlightPath is false', () => {
    setUp([{ cityId: 'paris' }, { cityId: 'london' }], { showFlightPath: false });
    expect(fixture.nativeElement.querySelector('path.trip-map-route')).toBeNull();
    expect(fixture.nativeElement.querySelector('svg.trip-map-plane')).toBeNull();
  });

  it('renders a route path and plane when showFlightPath is true and there are 2+ pins', () => {
    setUp([{ cityId: 'paris' }, { cityId: 'london' }], { showFlightPath: true });
    expect(fixture.nativeElement.querySelector('path.trip-map-route')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('svg.trip-map-plane')).not.toBeNull();
  });

  it('renders no route path or plane with fewer than 2 pins, even when showFlightPath is true', () => {
    setUp([{ cityId: 'paris' }], { showFlightPath: true });
    expect(fixture.nativeElement.querySelector('path.trip-map-route')).toBeNull();
    expect(fixture.nativeElement.querySelector('svg.trip-map-plane')).toBeNull();
  });
});
