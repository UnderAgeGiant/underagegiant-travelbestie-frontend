import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TripFullPlanComponent } from './trip-full-plan.component';
import { TransitLeg, TripStop } from '../../core/models/trip.model';
import { findCuratedAttraction } from '../../data/attractions.data';
import { AttractionNamePipe } from '../pipes/attraction-name.pipe';

const seg = { mode: 'flight' as const, departureDate: '', departureTime: '', arrivalDate: '', arrivalTime: '', notes: '', durationMinutes: 60 };
const PARIS: TripStop = {
  stopId: 's1', cityId: 'paris', checkIn: '01/06/2026', checkOut: '03/06/2026',
  lodging: { name: 'Hotel Lutetia', url: 'https://example.com' },
  selectedAttractions: [
    { entryId: 'e2', attractionId: 'paris_1', startTime: '15:00', date: '02/06/2026' },
    { entryId: 'e3', attractionId: 'paris_0', startTime: '12:00', date: '02/06/2026' },
    { entryId: 'e1', activityType: 'lunch', title: 'Almuerzo con Ana', startTime: '10:00', date: '01/06/2026' },
  ],
} as TripStop;
const TOKYO: TripStop = { stopId: 's2', cityId: 'tokyo', checkIn: '03/06/2026', checkOut: '06/06/2026', selectedAttractions: [] } as TripStop;
const LEGS: TransitLeg[] = [
  { fromCityId: '__start__', toCityId: '__start__', segments: [seg] },
  { fromCityId: 'paris', toCityId: 'tokyo', segments: [seg] },
  { fromCityId: '__end__', toCityId: '__end__', segments: [seg] },
] as TransitLeg[];

@Component({
  imports: [TripFullPlanComponent],
  template: `<tb-trip-full-plan [stops]="stops" [transits]="legs" [showTitle]="title()" (citySelect)="picked = $event" />`,
})
class HostComponent {
  stops = [PARIS, TOKYO];
  legs = LEGS;
  title = signal(false);
  picked: string | null = null;
}

describe('TripFullPlanComponent', () => {
  let host: HostComponent;
  let el: HTMLElement;
  const render = () => {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    host = f.componentInstance;
    el = f.nativeElement;
    return f;
  };

  it('renders departure, each city in order, transits and return', () => {
    render();
    expect(el.querySelectorAll('.itin-edge-transit').length).toBe(2);
    const cities = [...el.querySelectorAll('.itin-city-name')].map(n => n.textContent!.trim());
    expect(cities).toEqual(['Paris', 'Tokyo']);
    expect(el.querySelector('.itin-transit-dest')!.textContent).toContain('Tokyo');
    expect(el.textContent).toContain('01/06/2026 → 03/06/2026');
    expect(el.textContent).toContain('Hotel Lutetia');
  });

  it('lists lodging and attractions sorted by date then start time', () => {
    render();
    const labels = [...el.querySelectorAll('.itin-city')[0].querySelectorAll('.itin-item:not(.itin-item-lodging) .itin-item-label')]
      .map(n => n.textContent!.trim());
    const a0 = findCuratedAttraction('paris', 'paris_0')!;
    const a1 = findCuratedAttraction('paris', 'paris_1')!;
    expect(labels.length).toBe(3);
    expect(labels[0]).toBe('Almuerzo con Ana');
    const name = (a: typeof a0) => TestBed.runInInjectionContext(() => new AttractionNamePipe().transform(a));
    expect(labels[1]).toBe(name(a0));
    expect(labels[2]).toBe(name(a1));
    expect(el.querySelectorAll('.itin-city')[0].querySelector('.itin-item:not(.itin-item-lodging) .itin-item-meta')!.textContent)
      .toContain('01/06 · 10:00');
  });

  it('renders a personal activity with its own title', () => {
    render();
    expect(el.textContent).toContain('Almuerzo con Ana');
  });

  it('emits citySelect with the stopId when a city name is clicked', () => {
    render();
    (el.querySelectorAll('button.itin-city-name')[1] as HTMLButtonElement).click();
    expect(host.picked).toBe('s2');
  });

  it('shows the "Plan completo" title only when showTitle is true', () => {
    const f = render();
    expect(el.querySelector('.tfp-title')).toBeNull();
    host.title.set(true);
    f.detectChanges();
    expect(el.querySelector('.tfp-title')!.textContent).toContain('Plan completo');
  });

  it('renders no presentation pill and no result header', () => {
    render();
    expect(el.querySelector('tb-plan-presentation-pill, .ai-plan-result-header')).toBeNull();
  });
});
