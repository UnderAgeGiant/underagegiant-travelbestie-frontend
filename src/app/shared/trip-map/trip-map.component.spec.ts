import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TripMapComponent } from './trip-map.component';
import { WORLD_MAP_COUNTRIES } from '../../data/world-map-countries.data';

describe('TripMapComponent', () => {
  let fixture: ComponentFixture<TripMapComponent>;

  function setUp(
    cities: { cityId: string; stopId?: string }[],
    overrides: Partial<{ interactive: boolean; showFlightPath: boolean; showCountryBorders: boolean; showLabels: boolean }> = {},
  ) {
    TestBed.configureTestingModule({ imports: [TripMapComponent] });
    fixture = TestBed.createComponent(TripMapComponent);
    fixture.componentRef.setInput('cities', cities);
    if (overrides.interactive !== undefined) fixture.componentRef.setInput('interactive', overrides.interactive);
    if (overrides.showFlightPath !== undefined) fixture.componentRef.setInput('showFlightPath', overrides.showFlightPath);
    if (overrides.showCountryBorders !== undefined) fixture.componentRef.setInput('showCountryBorders', overrides.showCountryBorders);
    if (overrides.showLabels !== undefined) fixture.componentRef.setInput('showLabels', overrides.showLabels);
    fixture.detectChanges();
  }

  it('renders one pin per resolvable city, in input order', () => {
    setUp([{ cityId: 'paris' }, { cityId: 'london' }, { cityId: 'rome' }]);
    const pins = fixture.nativeElement.querySelectorAll('g.trip-map-pin');
    expect(pins.length).toBe(3);
    expect(pins[0].getAttribute('aria-label')).toBe('Paris');
    expect(pins[1].getAttribute('aria-label')).toBe('London');
    expect(pins[2].getAttribute('aria-label')).toBe('Rome');
  });

  it('positions each pin with a transform placing its tip at the projected coordinate', () => {
    setUp([{ cityId: 'paris' }]);
    const pin: SVGGElement = fixture.nativeElement.querySelector('g.trip-map-pin');
    // Paris projects to roughly (50.65, 11.43) — see latlng-projection.util.spec.ts.
    expect(pin.getAttribute('transform')).toMatch(/translate\(50\.6\d*,\s*11\.4\d*\)/);
  });

  it('silently skips a city with no CITY_COORDS entry', () => {
    setUp([{ cityId: 'paris' }, { cityId: 'nonexistent-test-city-xyz' }, { cityId: 'london' }]);
    const pins = fixture.nativeElement.querySelectorAll('g.trip-map-pin');
    expect(pins.length).toBe(2);
  });

  it('emits pinClick with the stopId when interactive and the pin has one', () => {
    setUp([{ cityId: 'paris', stopId: 'stop-1' }], { interactive: true });
    const emitted: string[] = [];
    fixture.componentInstance.pinClick.subscribe((id) => emitted.push(id));
    fixture.nativeElement.querySelector('g.trip-map-pin').dispatchEvent(new Event('click'));
    expect(emitted).toEqual(['stop-1']);
  });

  it('emits pinClick on Space as well as Enter, for role=button keyboard activation', () => {
    setUp([{ cityId: 'paris', stopId: 'stop-1' }], { interactive: true });
    const emitted: string[] = [];
    fixture.componentInstance.pinClick.subscribe((id) => emitted.push(id));
    const pin: SVGGElement = fixture.nativeElement.querySelector('g.trip-map-pin');
    pin.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    expect(emitted).toEqual(['stop-1']);
  });

  it('does not emit pinClick when interactive is false', () => {
    setUp([{ cityId: 'paris', stopId: 'stop-1' }], { interactive: false });
    const emitted: string[] = [];
    fixture.componentInstance.pinClick.subscribe((id) => emitted.push(id));
    fixture.nativeElement.querySelector('g.trip-map-pin').dispatchEvent(new Event('click'));
    expect(emitted).toEqual([]);
  });

  it('does not emit pinClick for a pin with no stopId even when interactive', () => {
    setUp([{ cityId: 'paris' }], { interactive: true });
    const emitted: string[] = [];
    fixture.componentInstance.pinClick.subscribe((id) => emitted.push(id));
    fixture.nativeElement.querySelector('g.trip-map-pin').dispatchEvent(new Event('click'));
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

  it('zooms the viewBox to frame a tight cluster of pins instead of showing the whole world', () => {
    setUp([{ cityId: 'paris' }, { cityId: 'london' }]);
    const svg: SVGSVGElement = fixture.nativeElement.querySelector('svg.trip-map-svg');
    const [, , width] = svg.getAttribute('viewBox')!.split(' ').map(Number);
    expect(width).toBeLessThan(100);
  });

  it('falls back to the full-world viewBox when there are no resolvable pins', () => {
    setUp([{ cityId: 'nonexistent-test-city-xyz' }]);
    const svg: SVGSVGElement = fixture.nativeElement.querySelector('svg.trip-map-svg');
    expect(svg.getAttribute('viewBox')).toBe('0 0 100 50');
  });

  it('renders one bordered path per real country when showCountryBorders is true (the default)', () => {
    setUp([{ cityId: 'paris' }]);
    const countries = fixture.nativeElement.querySelectorAll('path.trip-map-country');
    expect(countries.length).toBe(WORLD_MAP_COUNTRIES.length);
    expect(fixture.nativeElement.querySelector('filter')).toBeNull();
    expect(fixture.nativeElement.querySelector('path.trip-map-land')).toBeNull();
  });

  it('falls back to a single simplified land silhouette (with its smoothing filter) when showCountryBorders is false', () => {
    setUp([{ cityId: 'paris' }], { showCountryBorders: false });
    expect(fixture.nativeElement.querySelectorAll('path.trip-map-country').length).toBe(0);
    const filter: SVGFilterElement = fixture.nativeElement.querySelector('filter');
    const land: SVGPathElement = fixture.nativeElement.querySelector('path.trip-map-land');
    expect(land).not.toBeNull();
    const filterId = filter.getAttribute('id');
    expect(filterId).toBeTruthy();
    expect(land.getAttribute('filter')).toBe(`url(#${filterId})`);
  });

  it('shrinks the plane proportionally when the viewBox zooms in on a tight cluster, instead of ballooning to a fixed absolute size', () => {
    setUp([{ cityId: 'paris' }, { cityId: 'london' }], { showFlightPath: true });
    const svg: SVGSVGElement = fixture.nativeElement.querySelector('svg.trip-map-svg');
    const [, , viewBoxWidth] = svg.getAttribute('viewBox')!.split(' ').map(Number);
    const plane: SVGSVGElement = fixture.nativeElement.querySelector('svg.trip-map-plane');
    const planeWidth = Number(plane.getAttribute('width'));
    expect(viewBoxWidth).toBeLessThan(100); // sanity: this scenario is actually zoomed
    expect(planeWidth).toBeCloseTo((viewBoxWidth / 100) * 4, 5);
    expect(planeWidth).toBeLessThan(4);
  });

  it('scales the route stroke width proportionally to the current zoom, same as the pins and plane', () => {
    setUp([{ cityId: 'paris' }, { cityId: 'london' }], { showFlightPath: true });
    const svg: SVGSVGElement = fixture.nativeElement.querySelector('svg.trip-map-svg');
    const [, , viewBoxWidth] = svg.getAttribute('viewBox')!.split(' ').map(Number);
    const route: SVGPathElement = fixture.nativeElement.querySelector('path.trip-map-route');
    const strokeWidth = Number(route.getAttribute('stroke-width'));
    expect(viewBoxWidth).toBeLessThan(100); // sanity: this scenario is actually zoomed
    expect(strokeWidth).toBeCloseTo((viewBoxWidth / 100) * 0.39, 5);
  });

  it('uses the same widely-spaced dash pattern as AboutComponent\'s flight-path connector (self-normalized by pathLength, so unitless "1 5" matches exactly regardless of viewBox size)', () => {
    setUp([{ cityId: 'paris' }, { cityId: 'london' }], { showFlightPath: true });
    const route: SVGPathElement = fixture.nativeElement.querySelector('path.trip-map-route');
    expect(route.getAttribute('stroke-dasharray')).toBe('1 5');
  });

  it('renders a bubble label with the city name next to each pin when showLabels is true (the default)', () => {
    setUp([{ cityId: 'paris' }, { cityId: 'london' }]);
    const labels = fixture.nativeElement.querySelectorAll('g.trip-map-label');
    expect(labels.length).toBe(2);
    const texts: string[] = Array.from(labels).map((g: any) => g.querySelector('text.trip-map-label-text').textContent.trim());
    expect(texts).toEqual(['Paris', 'London']);
    expect(labels[0].querySelector('rect.trip-map-label-bubble')).not.toBeNull();
  });

  it('renders no labels when showLabels is false', () => {
    setUp([{ cityId: 'paris' }], { showLabels: false });
    expect(fixture.nativeElement.querySelectorAll('g.trip-map-label').length).toBe(0);
  });

  it('sizes the label bubble wider for a longer city name', () => {
    setUp([{ cityId: 'rome' }, { cityId: 'buenosaires' }]); // "Rome" (4 chars) vs "Buenos Aires" (12 chars)
    const bubbles: SVGRectElement[] = fixture.nativeElement.querySelectorAll('rect.trip-map-label-bubble');
    const romeWidth = Number(bubbles[0].getAttribute('width'));
    const buenosAiresWidth = Number(bubbles[1].getAttribute('width'));
    expect(buenosAiresWidth).toBeGreaterThan(romeWidth);
  });
});
