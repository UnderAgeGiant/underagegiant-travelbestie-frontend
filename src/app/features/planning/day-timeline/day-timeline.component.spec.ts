import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DayTimelineComponent } from './day-timeline.component';
import { TripService } from '../../trip/trip.service';
import { City } from '../../../core/models/city.model';
import { TouchDragService } from '../../../core/utils/touch-drag.service';
import { TouchDragGhostService } from '../../../core/utils/touch-drag-ghost.service';
import { NEW_ATTRACTION_MIME } from '../../../core/utils/day-timeline-drag.util';

const PARIS: City  = { id: 'paris',  name: 'Paris',  country: 'France', flag: '🇫🇷', region: 'europe' };
const LONDON: City = { id: 'london', name: 'London', country: 'United Kingdom', flag: '🇬🇧', region: 'europe' };

type MqlListener = (e: { matches: boolean }) => void;

function installMatchMediaMock(initialMatches: boolean) {
  let listener: MqlListener | null = null;
  const mql = {
    matches: initialMatches,
    media: '(max-width: 768px)',
    addEventListener: (_: string, cb: MqlListener) => { listener = cb; },
    removeEventListener: () => { listener = null; },
  };
  (window as any).matchMedia = () => mql;
  return {
    fire(matches: boolean) {
      mql.matches = matches;
      listener?.({ matches });
    },
  };
}

describe('DayTimelineComponent — mobile collapse default', () => {
  let trip: TripService;
  let component: DayTimelineComponent;
  let fixture: ComponentFixture<DayTimelineComponent>;

  beforeEach(() => {
    localStorage.clear();
    installMatchMediaMock(false); // default: desktop
    TestBed.configureTestingModule({
      imports: [DayTimelineComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    trip = TestBed.inject(TripService);
    fixture = TestBed.createComponent(DayTimelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('collapses by default when a stop is selected on mobile', () => {
    installMatchMediaMock(true);
    // Recreate with mobile media query
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [DayTimelineComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    const mobileTrip = TestBed.inject(TripService);
    const mobileFixture = TestBed.createComponent(DayTimelineComponent);
    mobileFixture.detectChanges();
    mobileTrip.addStop(PARIS, '01/06/2026', '05/06/2026');
    mobileFixture.detectChanges();
    expect(mobileFixture.componentInstance['collapsed']()).toBe(true);
  });

  it('does not collapse when a stop is selected on desktop', () => {
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    fixture.detectChanges();
    expect(component['collapsed']()).toBe(false);
  });

  it('does not re-collapse on edits to the same stop', () => {
    installMatchMediaMock(true);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [DayTimelineComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    const mobileTrip = TestBed.inject(TripService);
    const mobileFixture = TestBed.createComponent(DayTimelineComponent);
    mobileFixture.detectChanges();
    mobileTrip.addStop(PARIS, '01/06/2026', '05/06/2026');
    mobileFixture.detectChanges();
    mobileFixture.componentInstance['collapsed'].set(false);

    mobileTrip.updateDates(mobileTrip.activeStop()!.stopId, '02/06/2026', '06/06/2026');
    mobileFixture.detectChanges();

    expect(mobileFixture.componentInstance['collapsed']()).toBe(false);
  });

  it('re-collapses when switching to a different stop', () => {
    installMatchMediaMock(true);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [DayTimelineComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    const mobileTrip = TestBed.inject(TripService);
    const mobileFixture = TestBed.createComponent(DayTimelineComponent);
    mobileFixture.detectChanges();
    mobileTrip.addStop(PARIS, '01/06/2026', '05/06/2026');
    mobileFixture.detectChanges();
    mobileFixture.componentInstance['collapsed'].set(false);

    mobileTrip.addStop(LONDON, '06/06/2026', '10/06/2026');
    mobileFixture.detectChanges();

    expect(mobileFixture.componentInstance['collapsed']()).toBe(true);
  });
});

describe('DayTimelineComponent — trip-wide days', () => {
  it('builds day tabs spanning every stop in the trip', () => {
    installMatchMediaMock(false);
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const trip = TestBed.inject(TripService);
    trip.restoreStops([
      { stopId: 's1', cityId: 'paris',  checkIn: '01/06/2026', checkOut: '02/06/2026', selectedAttractions: [] },
      { stopId: 's2', cityId: 'london', checkIn: '04/06/2026', checkOut: '05/06/2026', selectedAttractions: [] },
    ] as any, null, []);

    const comp = TestBed.createComponent(DayTimelineComponent).componentInstance;
    const days = (comp as any).days() as Array<{ key: string; cityId: string }>;
    const keys = days.map(d => d.key);
    expect(keys).toEqual(expect.arrayContaining(['01/06', '02/06', '04/06', '05/06']));
    expect(days.some(d => d.cityId === 'paris')).toBe(true);
    expect(days.some(d => d.cityId === 'london')).toBe(true);
  });
});

describe('DayTimelineComponent — routeUrl arrival/departure terminals', () => {
  let trip: TripService;
  let component: DayTimelineComponent;
  let fixture: ComponentFixture<DayTimelineComponent>;

  beforeEach(() => {
    installMatchMediaMock(false);
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [DayTimelineComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    trip = TestBed.inject(TripService);
    fixture = TestBed.createComponent(DayTimelineComponent);
    component = fixture.componentInstance;
  });

  it('uses the arrival transit terminal (not lodging) as origin on the stop\'s first day', () => {
    trip.restoreStops([{
      stopId: 's1', cityId: 'paris', checkIn: '01/06/2026', checkOut: '03/06/2026',
      lodging: { name: 'Hotel Le Central', url: '' },
      selectedAttractions: [
        { entryId: 'e1', attractionId: 'paris_0', startTime: '10:00', endTime: null, date: '01/06/2026' },
      ],
    }] as any, null, [{
      fromCityId: '__start__', toCityId: 'paris',
      segments: [{ mode: 'flight', departureDate: '01/06/2026', departureTime: '07:00', arrivalDate: '01/06/2026', arrivalTime: '09:00', notes: '' }],
    }] as any);
    fixture.detectChanges();

    (component as any).selectedDay.set('01/06');
    const url = (component as any).routeUrl() as string;
    expect(url).toContain('origin=Aeropuerto');
    expect(url).not.toContain('origin=Hotel');
  });

  it('uses the departure transit terminal (not lodging) as destination on the stop\'s last day', () => {
    trip.restoreStops([{
      stopId: 's1', cityId: 'paris', checkIn: '01/06/2026', checkOut: '03/06/2026',
      lodging: { name: 'Hotel Le Central', url: '' },
      selectedAttractions: [
        { entryId: 'e1', attractionId: 'paris_0', startTime: '10:00', endTime: null, date: '03/06/2026' },
      ],
    }] as any, null, [{
      fromCityId: 'paris', toCityId: '__end__',
      segments: [{ mode: 'train', departureDate: '03/06/2026', departureTime: '18:00', arrivalDate: '03/06/2026', arrivalTime: '20:00', notes: '' }],
    }] as any);
    fixture.detectChanges();

    (component as any).selectedDay.set('03/06');
    const url = (component as any).routeUrl() as string;
    expect(url).toContain(encodeURIComponent('Estación de tren'));
    expect(url).not.toContain('destination=Hotel');
  });

  it('falls back to lodging on days that are neither arrival nor departure', () => {
    trip.restoreStops([{
      stopId: 's1', cityId: 'paris', checkIn: '01/06/2026', checkOut: '03/06/2026',
      lodging: { name: 'Hotel Le Central', url: '' },
      selectedAttractions: [
        { entryId: 'e1', attractionId: 'paris_0', startTime: '10:00', endTime: null, date: '02/06/2026' },
      ],
    }] as any, null, [{
      fromCityId: '__start__', toCityId: 'paris',
      segments: [{ mode: 'flight', departureDate: '01/06/2026', departureTime: '07:00', arrivalDate: '01/06/2026', arrivalTime: '09:00', notes: '' }],
    }] as any);
    fixture.detectChanges();

    (component as any).selectedDay.set('02/06');
    const url = (component as any).routeUrl() as string;
    expect(url).toContain('origin=Hotel');
    expect(url).toContain('destination=Hotel');
  });

  it('falls back to lodging for bus/car arrivals (no fixed terminal)', () => {
    trip.restoreStops([{
      stopId: 's1', cityId: 'paris', checkIn: '01/06/2026', checkOut: '03/06/2026',
      lodging: { name: 'Hotel Le Central', url: '' },
      selectedAttractions: [
        { entryId: 'e1', attractionId: 'paris_0', startTime: '10:00', endTime: null, date: '01/06/2026' },
      ],
    }] as any, null, [{
      fromCityId: '__start__', toCityId: 'paris',
      segments: [{ mode: 'bus', departureDate: '01/06/2026', departureTime: '07:00', arrivalDate: '01/06/2026', arrivalTime: '09:00', notes: '' }],
    }] as any);
    fixture.detectChanges();

    (component as any).selectedDay.set('01/06');
    const url = (component as any).routeUrl() as string;
    expect(url).toContain('origin=Hotel');
  });
});

describe('DayTimelineComponent — header actions row (aligned, sorted by scope)', () => {
  let trip: TripService;
  let component: DayTimelineComponent;
  let fixture: ComponentFixture<DayTimelineComponent>;

  beforeEach(() => {
    installMatchMediaMock(false);
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [DayTimelineComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    trip = TestBed.inject(TripService);
    fixture = TestBed.createComponent(DayTimelineComponent);
    component = fixture.componentInstance;
  });

  function actionTexts(): string[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.tl-head-actions > .tl-head-action'))
      .map((el: any) => el.textContent.trim());
  }

  it('renders no actions row at all when none of the four actions apply', () => {
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.tl-head-actions')).toBeNull();
  });

  it('groups day-scoped actions (route, day slideshow) before plan-scoped actions (export, plan slideshow), all in one aligned row', () => {
    trip.restoreStops([{
      stopId: 's1', cityId: 'paris', checkIn: '01/06/2026', checkOut: '03/06/2026',
      lodging: { name: 'Hotel Le Central', url: '' },
      selectedAttractions: [
        { entryId: 'e1', attractionId: 'paris_0', startTime: '10:00', endTime: null, date: '01/06/2026' },
      ],
    }] as any, null, [{
      fromCityId: '__start__', toCityId: 'paris',
      segments: [{ mode: 'flight', departureDate: '01/06/2026', departureTime: '07:00', arrivalDate: '01/06/2026', arrivalTime: '09:00', notes: '' }],
    }] as any);
    fixture.componentRef.setInput('showPlanSlideshow', true);
    fixture.detectChanges();
    (component as any).selectedDay.set('01/06');
    (trip as any)._loadedPlanId.set('plan-1');
    fixture.detectChanges();

    const row = fixture.nativeElement.querySelector('.tl-head-actions');
    expect(row).not.toBeNull();
    const texts = actionTexts();
    expect(texts.length).toBe(4);
    // Day-scoped first…
    expect(texts[0]).toContain('Ruta del día');
    expect(texts[1]).toContain('Presentación del día');
    // …then plan-scoped.
    expect(texts[2]).toContain('Exportar');
    expect(texts[3]).toContain('Presentación del plan');
  });
});

describe('DayTimelineComponent — hour grid range', () => {
  it('renders the full day from 00:00 to 23:00', () => {
    installMatchMediaMock(false);
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [DayTimelineComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    const comp = TestBed.createComponent(DayTimelineComponent).componentInstance;
    const hours = (comp as any).hours as number[];
    expect(hours[0]).toBe(0);                       // first hour line is 00:00
    expect(hours[hours.length - 1]).toBe(23);       // last hour line is 23:00
    expect(hours).toHaveLength(24);
    expect((comp as any).gridHeight()).toBe(23 * 46 + 12); // (TL_H1 − TL_H0) · TL_RH + 12
  });

  it('positions an early-morning attraction at its true offset from midnight', () => {
    installMatchMediaMock(false);
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [DayTimelineComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    const trip = TestBed.inject(TripService);
    trip.restoreStops([{
      stopId: 's1', cityId: 'paris', checkIn: '01/06/2026', checkOut: '02/06/2026',
      selectedAttractions: [
        { entryId: 'e1', attractionId: 'paris_0', startTime: '05:00', endTime: '06:00', date: '01/06/2026' },
      ],
    }] as any, null, []);
    const fixture = TestBed.createComponent(DayTimelineComponent);
    fixture.detectChanges();
    (fixture.componentInstance as any).selectedDay.set('01/06');
    const blocks = (fixture.componentInstance as any).blocks() as Array<{ top: number }>;
    expect(blocks).toHaveLength(1);
    expect(blocks[0].top).toBe(5 * 46);  // 05:00 = 5 hours after the 00:00 grid origin
  });
});

describe('DayTimelineComponent — drag scheduling', () => {
  let trip: TripService;
  let component: DayTimelineComponent;
  let fixture: ComponentFixture<DayTimelineComponent>;

  beforeEach(() => {
    localStorage.clear();
    installMatchMediaMock(false);
    TestBed.configureTestingModule({
      imports: [DayTimelineComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    trip = TestBed.inject(TripService);
    fixture = TestBed.createComponent(DayTimelineComponent);
    component = fixture.componentInstance;
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    fixture.detectChanges();
  });

  it('adds a new attraction at the dropped, 15-minute-snapped time', () => {
    jest.spyOn(trip, 'addAttraction');
    // Grid offset 0 → the grid's first displayed hour (00:00); no real DOM
    // layout happens in jsdom, so getBoundingClientRect() on the (unrendered)
    // #tlGridEl returns a zeroed rect — clientY 0 therefore maps to offset 0.
    // getData is keyed by MIME type, same as the real DataTransfer API — Task 9
    // extends onGridDrop to check RESCHEDULE_MIME first, so a fake that returned
    // this payload regardless of the requested type would break once that lands.
    const newAttractionJson = JSON.stringify({ attractionId: 'paris_louvre', category: 'poi', estimatedMinutes: 150 });
    const fakeEvent = {
      preventDefault: jest.fn(),
      clientY: 0,
      dataTransfer: {
        types: ['application/x-tb-new-attraction'],
        getData: (mime: string) => (mime === 'application/x-tb-new-attraction' ? newAttractionJson : ''),
      },
    } as unknown as DragEvent;

    component['onGridDrop'](fakeEvent);

    expect(trip.addAttraction).toHaveBeenCalledWith(
      trip.activeStop()!.stopId, 'paris_louvre', '00:00', expect.stringMatching(/^\d{2}\/\d{2}\/2026$/), 'poi', 150,
    );
  });

  it('ignores a drop whose payload is not a recognized drag type', () => {
    jest.spyOn(trip, 'addAttraction');
    const fakeEvent = {
      preventDefault: jest.fn(),
      clientY: 0,
      dataTransfer: { types: ['text/plain'], getData: () => '' },
    } as unknown as DragEvent;

    component['onGridDrop'](fakeEvent);

    expect(trip.addAttraction).not.toHaveBeenCalled();
  });

  it('shows a live time-preview bubble while dragging an unlocked attraction block', () => {
    trip.addAttraction(trip.activeStop()!.stopId, 'paris_louvre', '09:00', undefined, 'poi', 150);
    fixture.detectChanges();
    const entryId = trip.activeStop()!.selectedAttractions[0].entryId!;

    const startEvent = { dataTransfer: { setData: jest.fn(), effectAllowed: '' } } as unknown as DragEvent;
    component['onBlockDragStart'](startEvent, entryId);
    expect(component['draggingEntryId']()).toBe(entryId);

    const overEvent = {
      preventDefault: jest.fn(), clientY: 0,
      dataTransfer: { types: ['application/x-tb-reschedule'], dropEffect: '' },
    } as unknown as DragEvent;
    component['onGridDragOver'](overEvent);
    expect(component['dragPreview']()).not.toBeNull();
    expect(component['dragPreview']()!.time).toBe('00:00');

    component['onBlockDragEnd']();
    expect(component['draggingEntryId']()).toBeNull();
    expect(component['dragPreview']()).toBeNull();
  });

  it('reschedules a dropped attraction block, preserving its original duration', () => {
    trip.addAttraction(trip.activeStop()!.stopId, 'paris_louvre', '09:00', undefined, 'poi', 150);
    fixture.detectChanges();
    const stopId  = trip.activeStop()!.stopId;
    const entryId = trip.activeStop()!.selectedAttractions[0].entryId!;
    jest.spyOn(trip, 'updateStartTime');

    const dropEvent = {
      preventDefault: jest.fn(), clientY: 46 * 2, // 2 hours down the grid → 02:00
      dataTransfer: {
        types: ['application/x-tb-reschedule'],
        getData: () => JSON.stringify({ stopId, entryId }),
      },
    } as unknown as DragEvent;

    component['onGridDrop'](dropEvent);

    // Original block was 09:00–11:30 (150 min) — the reschedule must keep that
    // 150-minute duration, not reset it to the attraction's catalog default.
    expect(trip.updateStartTime).toHaveBeenCalledWith(stopId, entryId, '02:00', undefined, 150);
  });

  it('reschedules a block that never got an explicit endTime, using the catalog attraction\'s own duration instead of a flat 60-minute fallback (family feedback bugfix)', () => {
    // No estimatedMinutes passed here — TripService.addAttraction only sets `endTime`
    // when it's given one, so this is the common real-world case: a stop's own
    // selectedAttractions entry has startTime but no endTime, and the block's DISPLAYED
    // duration on the timeline comes entirely from the curated catalog attraction's own
    // estimatedMinutes (paris_0 in this fixture's curated data: 120 minutes). The old
    // reschedule code ignored the catalog entirely and fell back to a flat 60 whenever
    // endTime wasn't set, silently shrinking this block on every drag.
    trip.addAttraction(trip.activeStop()!.stopId, 'paris_0', '09:00');
    fixture.detectChanges();
    const stopId  = trip.activeStop()!.stopId;
    const entryId = trip.activeStop()!.selectedAttractions[0].entryId!;
    expect(trip.activeStop()!.selectedAttractions[0].endTime).toBeFalsy();
    jest.spyOn(trip, 'updateStartTime');

    const dropEvent = {
      preventDefault: jest.fn(), clientY: 46 * 2, // 2 hours down the grid → 02:00
      dataTransfer: {
        types: ['application/x-tb-reschedule'],
        getData: () => JSON.stringify({ stopId, entryId }),
      },
    } as unknown as DragEvent;

    component['onGridDrop'](dropEvent);

    expect(trip.updateStartTime).toHaveBeenCalledWith(stopId, entryId, '02:00', undefined, 120);
  });

  it('does not reschedule a locked (fixed-schedule) attraction', () => {
    trip.addAttraction(trip.activeStop()!.stopId, 'freetour_1', '09:00', '01/06/2026', 'freetour', 120);
    fixture.detectChanges();
    const stopId  = trip.activeStop()!.stopId;
    const entryId = trip.activeStop()!.selectedAttractions[0].entryId!;
    jest.spyOn(trip, 'updateStartTime');

    const dropEvent = {
      preventDefault: jest.fn(), clientY: 0,
      dataTransfer: { types: ['application/x-tb-reschedule'], getData: () => JSON.stringify({ stopId, entryId }) },
    } as unknown as DragEvent;

    component['onGridDrop'](dropEvent);

    expect(trip.updateStartTime).not.toHaveBeenCalled();
  });
});

describe('DayTimelineComponent — readOnly (public shared-trip view)', () => {
  let trip: TripService;
  let component: DayTimelineComponent;
  let fixture: ComponentFixture<DayTimelineComponent>;

  beforeEach(() => {
    localStorage.clear();
    installMatchMediaMock(false);
    TestBed.configureTestingModule({
      imports: [DayTimelineComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    trip = TestBed.inject(TripService);
    fixture = TestBed.createComponent(DayTimelineComponent);
    component = fixture.componentInstance;
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    trip.addAttraction(trip.activeStop()!.stopId, 'paris_louvre', '09:00', undefined, 'poi', 150);
    fixture.detectChanges();
  });

  it('marks attraction blocks non-draggable when readOnly is true', () => {
    fixture.componentRef.setInput('readOnly', true);
    fixture.detectChanges();
    const blocks = component['blocks']();
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks.every(b => b.draggable === false)).toBe(true);
  });

  it('keeps attraction blocks draggable when readOnly is false (default)', () => {
    fixture.detectChanges();
    const blocks = component['blocks']();
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks.some(b => b.draggable === true)).toBe(true);
  });

  it('ignores onBlockDragStart when readOnly is true', () => {
    fixture.componentRef.setInput('readOnly', true);
    fixture.detectChanges();
    const entryId = trip.activeStop()!.selectedAttractions[0].entryId!;
    const startEvent = { dataTransfer: { setData: jest.fn(), effectAllowed: '' } } as unknown as DragEvent;

    component['onBlockDragStart'](startEvent, entryId);

    expect(component['draggingEntryId']()).toBeNull();
    expect(startEvent.dataTransfer!.setData).not.toHaveBeenCalled();
  });

  it('ignores a reschedule drop when readOnly is true', () => {
    fixture.componentRef.setInput('readOnly', true);
    fixture.detectChanges();
    const stopId  = trip.activeStop()!.stopId;
    const entryId = trip.activeStop()!.selectedAttractions[0].entryId!;
    jest.spyOn(trip, 'updateStartTime');

    const dropEvent = {
      preventDefault: jest.fn(), clientY: 46 * 2,
      dataTransfer: {
        types: ['application/x-tb-reschedule'],
        getData: () => JSON.stringify({ stopId, entryId }),
      },
    } as unknown as DragEvent;

    component['onGridDrop'](dropEvent);

    expect(trip.updateStartTime).not.toHaveBeenCalled();
  });

  it('ignores a new-attraction drop when readOnly is true', () => {
    fixture.componentRef.setInput('readOnly', true);
    fixture.detectChanges();
    jest.spyOn(trip, 'addAttraction');

    const newAttractionJson = JSON.stringify({ attractionId: 'paris_notredame', category: 'poi', estimatedMinutes: 90 });
    const dropEvent = {
      preventDefault: jest.fn(),
      clientY: 0,
      dataTransfer: {
        types: ['application/x-tb-new-attraction'],
        getData: (mime: string) => (mime === 'application/x-tb-new-attraction' ? newAttractionJson : ''),
      },
    } as unknown as DragEvent;

    component['onGridDrop'](dropEvent);

    expect(trip.addAttraction).not.toHaveBeenCalled();
  });

  it('does not show a drag preview on dragover when readOnly is true', () => {
    fixture.componentRef.setInput('readOnly', true);
    fixture.detectChanges();

    const overEvent = {
      preventDefault: jest.fn(), clientY: 0,
      dataTransfer: { types: ['application/x-tb-reschedule'], dropEffect: '' },
    } as unknown as DragEvent;
    component['onGridDragOver'](overEvent);

    expect(component['dragPreview']()).toBeNull();
    expect(overEvent.preventDefault).not.toHaveBeenCalled();
  });
});

function fakeTouch(x: number, y: number): Touch {
  return { clientX: x, clientY: y } as Touch;
}

describe('DayTimelineComponent — touch drag-to-reschedule (mobile)', () => {
  let trip: TripService;
  let touchDragGhost: TouchDragGhostService;
  let component: DayTimelineComponent;
  let fixture: ComponentFixture<DayTimelineComponent>;

  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
    installMatchMediaMock(true);
    TestBed.configureTestingModule({
      imports: [DayTimelineComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    trip = TestBed.inject(TripService);
    touchDragGhost = TestBed.inject(TouchDragGhostService);
    fixture = TestBed.createComponent(DayTimelineComponent);
    component = fixture.componentInstance;
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    fixture.detectChanges();
  });

  afterEach(() => jest.useRealTimers());

  // Regression test — same root cause as AttractionCardComponent: a bare draggable="true" on
  // .tl-block would give WebKit/iOS Safari (and several Android WebViews) native touch-driven
  // drag recognition on the block, fighting the touch handlers below for the same gesture. This
  // was the actual root cause of drag-to-reschedule also not working on mobile after the first
  // touch-support pass, which added these handlers but left the [attr.draggable] binding
  // unconditional on block eligibility alone (not gated on device.isMobile() too).
  it('never marks an otherwise-draggable block as HTML5-draggable on mobile', () => {
    trip.addAttraction(trip.activeStop()!.stopId, 'paris_0', '09:00');
    fixture.detectChanges();

    const block = fixture.nativeElement.querySelector('.tl-block');
    expect(block).not.toBeNull();
    expect(block.getAttribute('draggable')).toBeNull();
  });

  it('does nothing on touchstart until the long-press delay elapses', () => {
    trip.addAttraction(trip.activeStop()!.stopId, 'paris_0', '09:00');
    fixture.detectChanges();
    const entryId = trip.activeStop()!.selectedAttractions[0].entryId!;

    component['onBlockTouchStart']({ touches: [fakeTouch(10, 20)] } as unknown as TouchEvent, entryId);

    expect(component['draggingEntryId']()).toBeNull();
  });

  it('arms the drag and updates the preview after the long-press delay, once the finger moves', () => {
    trip.addAttraction(trip.activeStop()!.stopId, 'paris_0', '09:00');
    fixture.detectChanges();
    const entryId = trip.activeStop()!.selectedAttractions[0].entryId!;

    component['onBlockTouchStart']({ touches: [fakeTouch(10, 20)] } as unknown as TouchEvent, entryId);
    jest.advanceTimersByTime(350);
    expect(component['draggingEntryId']()).toBe(entryId);

    const preventDefault = jest.fn();
    component['onBlockTouchMove']({ touches: [fakeTouch(10, 46 * 2)], preventDefault } as unknown as TouchEvent);

    expect(preventDefault).toHaveBeenCalled();
    expect(component['dragPreview']()!.time).toBe('02:00');
  });

  it('cancels the pending long-press if the finger moves before it fires (treated as a scroll)', () => {
    trip.addAttraction(trip.activeStop()!.stopId, 'paris_0', '09:00');
    fixture.detectChanges();
    const entryId = trip.activeStop()!.selectedAttractions[0].entryId!;

    component['onBlockTouchStart']({ touches: [fakeTouch(10, 20)] } as unknown as TouchEvent, entryId);
    component['onBlockTouchMove']({ touches: [fakeTouch(30, 20)], preventDefault: jest.fn() } as unknown as TouchEvent);
    jest.advanceTimersByTime(350);

    expect(component['draggingEntryId']()).toBeNull();
  });

  // Regression test — round 6 of family feedback: mobile drag-to-reschedule still didn't work
  // on a real device even after the draggable="true" fix above, because a real touch device
  // commits to native-scrolling the grid on the very first touchmove of the gesture, before this
  // component's long-press arm timer ever fires — a later preventDefault() call (once armed) is
  // then a no-op. `.tl-block-draggable` now carries `touch-action: none` (src/styles.css) so the
  // browser never starts that native scroll at all; this component instead replays the vertical
  // delta by hand onto the real scrollable grid ancestor so a plain swipe still scrolls normally.
  it('replays a pre-armed swipe onto the scrollable grid ancestor since native scroll is disabled on the block', () => {
    trip.addAttraction(trip.activeStop()!.stopId, 'paris_0', '09:00');
    fixture.detectChanges();
    const entryId  = trip.activeStop()!.selectedAttractions[0].entryId!;
    const block    = fixture.nativeElement.querySelector('.tl-block') as HTMLElement;
    const gridWrap = fixture.nativeElement.querySelector('.tl-grid-wrap') as HTMLElement;
    Object.defineProperty(gridWrap, 'scrollHeight', { value: 2000, configurable: true });
    Object.defineProperty(gridWrap, 'clientHeight', { value: 400, configurable: true });
    gridWrap.style.overflowY = 'auto';
    gridWrap.scrollTop = 100;

    component['onBlockTouchStart']({
      touches: [fakeTouch(10, 100)], currentTarget: block,
    } as unknown as TouchEvent, entryId);
    // Finger moves 30px up, past the cancel threshold but well before the 350ms arm delay —
    // treated as a scroll, not a drag, and must still move the grid the way native scroll would.
    component['onBlockTouchMove']({
      touches: [fakeTouch(10, 70)], preventDefault: jest.fn(),
    } as unknown as TouchEvent);

    expect(gridWrap.scrollTop).toBe(130);
    expect(component['draggingEntryId']()).toBeNull();
  });

  it('reschedules the block, preserving its catalog duration, on touchend', () => {
    trip.addAttraction(trip.activeStop()!.stopId, 'paris_0', '09:00'); // no endTime — catalog duration is 120
    fixture.detectChanges();
    const stopId  = trip.activeStop()!.stopId;
    const entryId = trip.activeStop()!.selectedAttractions[0].entryId!;
    jest.spyOn(trip, 'updateStartTime');

    component['onBlockTouchStart']({ touches: [fakeTouch(10, 20)] } as unknown as TouchEvent, entryId);
    jest.advanceTimersByTime(350);
    component['onBlockTouchMove']({ touches: [fakeTouch(10, 46 * 2)], preventDefault: jest.fn() } as unknown as TouchEvent);
    component['onBlockTouchEnd']({
      preventDefault: jest.fn(), changedTouches: [fakeTouch(10, 46 * 2)],
    } as unknown as TouchEvent);

    expect(trip.updateStartTime).toHaveBeenCalledWith(stopId, entryId, '02:00', undefined, 120);
    expect(component['draggingEntryId']()).toBeNull();
    expect(component['dragPreview']()).toBeNull();
  });

  it('does not arm a reschedule drag when readOnly is true', () => {
    fixture.componentRef.setInput('readOnly', true);
    fixture.detectChanges();
    trip.addAttraction(trip.activeStop()!.stopId, 'paris_0', '09:00');
    fixture.detectChanges();
    const entryId = trip.activeStop()!.selectedAttractions[0].entryId!;

    component['onBlockTouchStart']({ touches: [fakeTouch(10, 20)] } as unknown as TouchEvent, entryId);
    jest.advanceTimersByTime(350);

    expect(component['draggingEntryId']()).toBeNull();
  });

  it('onBlockTouchCancel clears drag state', () => {
    trip.addAttraction(trip.activeStop()!.stopId, 'paris_0', '09:00');
    fixture.detectChanges();
    const entryId = trip.activeStop()!.selectedAttractions[0].entryId!;

    component['onBlockTouchStart']({ touches: [fakeTouch(10, 20)] } as unknown as TouchEvent, entryId);
    jest.advanceTimersByTime(350);
    component['onBlockTouchCancel']();

    expect(component['draggingEntryId']()).toBeNull();
    expect(component['dragPreview']()).toBeNull();
  });

  // Ghost pill (family feedback follow-up — mobile touch-drag had no visual of *what* was
  // being dragged, unlike desktop's native HTML5 drag image). Purely additive to the existing
  // draggingEntryId/dragPreview mechanics above.
  it('shows the drag ghost with the block icon/name once the long-press arms', () => {
    trip.addAttraction(trip.activeStop()!.stopId, 'paris_0', '09:00');
    fixture.detectChanges();
    const entryId = trip.activeStop()!.selectedAttractions[0].entryId!;
    const block = component['blocks']().find(b => b.entryId === entryId)!;

    component['onBlockTouchStart']({ touches: [fakeTouch(10, 20)] } as unknown as TouchEvent, entryId);
    expect(touchDragGhost.ghost()).toBeNull();

    jest.advanceTimersByTime(350);

    expect(touchDragGhost.ghost()).toEqual({ icon: block.icon, label: block.name, x: 10, y: 20 });
  });

  it('moves the drag ghost along with the finger once armed', () => {
    trip.addAttraction(trip.activeStop()!.stopId, 'paris_0', '09:00');
    fixture.detectChanges();
    const entryId = trip.activeStop()!.selectedAttractions[0].entryId!;

    component['onBlockTouchStart']({ touches: [fakeTouch(10, 20)] } as unknown as TouchEvent, entryId);
    jest.advanceTimersByTime(350);

    component['onBlockTouchMove']({ touches: [fakeTouch(10, 46 * 2)], preventDefault: jest.fn() } as unknown as TouchEvent);

    expect(touchDragGhost.ghost()).toEqual(expect.objectContaining({ x: 10, y: 46 * 2 }));
  });

  it('hides the drag ghost on touchend', () => {
    trip.addAttraction(trip.activeStop()!.stopId, 'paris_0', '09:00');
    fixture.detectChanges();
    const entryId = trip.activeStop()!.selectedAttractions[0].entryId!;

    component['onBlockTouchStart']({ touches: [fakeTouch(10, 20)] } as unknown as TouchEvent, entryId);
    jest.advanceTimersByTime(350);
    component['onBlockTouchEnd']({
      preventDefault: jest.fn(), changedTouches: [fakeTouch(10, 46 * 2)],
    } as unknown as TouchEvent);

    expect(touchDragGhost.ghost()).toBeNull();
  });

  it('hides the drag ghost on touchcancel', () => {
    trip.addAttraction(trip.activeStop()!.stopId, 'paris_0', '09:00');
    fixture.detectChanges();
    const entryId = trip.activeStop()!.selectedAttractions[0].entryId!;

    component['onBlockTouchStart']({ touches: [fakeTouch(10, 20)] } as unknown as TouchEvent, entryId);
    jest.advanceTimersByTime(350);
    component['onBlockTouchCancel']();

    expect(touchDragGhost.ghost()).toBeNull();
  });
});

describe('DayTimelineComponent — touch drag-in a new attraction (mobile, cross-component via TouchDragService)', () => {
  let trip: TripService;
  let touchDrag: TouchDragService;
  let component: DayTimelineComponent;
  let fixture: ComponentFixture<DayTimelineComponent>;

  const GRID_RECT = { top: 100, bottom: 1200, left: 0, right: 400, width: 400, height: 1100 } as DOMRect;

  beforeEach(() => {
    localStorage.clear();
    installMatchMediaMock(true);
    TestBed.configureTestingModule({
      imports: [DayTimelineComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    trip = TestBed.inject(TripService);
    touchDrag = TestBed.inject(TouchDragService);
    fixture = TestBed.createComponent(DayTimelineComponent);
    component = fixture.componentInstance;
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    fixture.detectChanges();

    const gridEl: HTMLElement = component['tlGridEl']!.nativeElement;
    jest.spyOn(gridEl, 'getBoundingClientRect').mockReturnValue(GRID_RECT);
  });

  it('shows a live preview while a touch drag from the attraction list hovers over the grid', () => {
    const payload = JSON.stringify({ attractionId: 'paris_0', category: 'poi', estimatedMinutes: 120 });

    touchDrag.start(NEW_ATTRACTION_MIME, payload, 50, 100 + 46 * 2); // 2h down the grid

    fixture.detectChanges();
    expect(component['dragPreview']()!.time).toBe('02:00');
  });

  it('does not show a preview while the touch point is outside the grid', () => {
    const payload = JSON.stringify({ attractionId: 'paris_0', category: 'poi', estimatedMinutes: 120 });

    touchDrag.start(NEW_ATTRACTION_MIME, payload, 50, 50); // above GRID_RECT.top (100)
    fixture.detectChanges();

    expect(component['dragPreview']()).toBeNull();
  });

  it('adds the attraction on window touchend when released over the grid', () => {
    jest.spyOn(trip, 'addAttraction');
    const payload = JSON.stringify({ attractionId: 'paris_0', category: 'poi', estimatedMinutes: 120 });
    touchDrag.start(NEW_ATTRACTION_MIME, payload, 50, 100 + 46 * 2);
    fixture.detectChanges();

    component['onWindowTouchEnd']();

    expect(trip.addAttraction).toHaveBeenCalledWith(
      trip.activeStop()!.stopId, 'paris_0', '02:00', expect.stringMatching(/^\d{2}\/\d{2}\/2026$/), 'poi', 120,
    );
    expect(touchDrag.state()).toBeNull();
    expect(component['dragPreview']()).toBeNull();
  });

  it('does not add the attraction when released outside the grid', () => {
    jest.spyOn(trip, 'addAttraction');
    const payload = JSON.stringify({ attractionId: 'paris_0', category: 'poi', estimatedMinutes: 120 });
    touchDrag.start(NEW_ATTRACTION_MIME, payload, 50, 50); // above the grid
    fixture.detectChanges();

    component['onWindowTouchEnd']();

    expect(trip.addAttraction).not.toHaveBeenCalled();
    expect(touchDrag.state()).toBeNull();
  });

  it('does not add the attraction when readOnly is true, even if released over the grid', () => {
    fixture.componentRef.setInput('readOnly', true);
    fixture.detectChanges();
    jest.spyOn(trip, 'addAttraction');
    const payload = JSON.stringify({ attractionId: 'paris_0', category: 'poi', estimatedMinutes: 120 });
    touchDrag.start(NEW_ATTRACTION_MIME, payload, 50, 100 + 46 * 2);
    fixture.detectChanges();

    component['onWindowTouchEnd']();

    expect(trip.addAttraction).not.toHaveBeenCalled();
  });

  it('onWindowTouchCancel clears the preview and the shared drag state', () => {
    const payload = JSON.stringify({ attractionId: 'paris_0', category: 'poi', estimatedMinutes: 120 });
    touchDrag.start(NEW_ATTRACTION_MIME, payload, 50, 100 + 46 * 2);
    fixture.detectChanges();
    expect(component['dragPreview']()).not.toBeNull();

    component['onWindowTouchCancel']();

    expect(touchDrag.state()).toBeNull();
    expect(component['dragPreview']()).toBeNull();
  });
});
