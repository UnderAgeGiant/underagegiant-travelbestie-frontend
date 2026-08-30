import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AttractionCardComponent } from './attraction-card.component';
import { Attraction } from '../../../core/models/comment.model';
import { NEW_ATTRACTION_MIME, NewAttractionDragPayload } from '../../../core/utils/day-timeline-drag.util';
import { TouchDragService } from '../../../core/utils/touch-drag.service';

const ATTRACTION: Attraction = {
  id: 'paris_louvre', name: 'Louvre', type: 'Histórico', category: 'poi',
  active: true, icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 150,
};

function mockMatchMedia(matches: boolean): void {
  (window as any).matchMedia = () => ({
    matches, media: '', addEventListener: () => {}, removeEventListener: () => {},
  });
}

function fakeTouch(x: number, y: number): Touch {
  return { clientX: x, clientY: y } as Touch;
}

describe('AttractionCardComponent — drag to schedule', () => {
  let fixture: ComponentFixture<AttractionCardComponent>;

  beforeEach(() => {
    mockMatchMedia(false);
    TestBed.configureTestingModule({
      imports: [AttractionCardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(AttractionCardComponent);
    fixture.componentRef.setInput('attraction', ATTRACTION);
    fixture.componentRef.setInput('cityName', 'Paris');
    fixture.componentRef.setInput('cityId', 'paris');
    fixture.componentRef.setInput('stopId', 'stop-1');
    fixture.detectChanges();
  });

  it('sets the new-attraction drag payload on dragstart', () => {
    const setData = jest.fn();
    const fakeEvent = { dataTransfer: { setData, effectAllowed: '' } } as unknown as DragEvent;

    fixture.componentInstance['onDragStart'](fakeEvent);

    expect(setData).toHaveBeenCalledTimes(1);
    const [mime, json] = setData.mock.calls[0];
    expect(mime).toBe(NEW_ATTRACTION_MIME);
    const payload: NewAttractionDragPayload = JSON.parse(json);
    expect(payload).toEqual({ attractionId: 'paris_louvre', category: 'poi', estimatedMinutes: 150 });
  });

  it('marks the card element as draggable', () => {
    const card = fixture.nativeElement.querySelector('.att-card');
    expect(card.getAttribute('draggable')).toBe('true');
  });
});

describe('AttractionCardComponent — touch drag to schedule (mobile only)', () => {
  let fixture: ComponentFixture<AttractionCardComponent>;
  let touchDrag: TouchDragService;

  beforeEach(() => {
    jest.useFakeTimers();
    mockMatchMedia(true);
    TestBed.configureTestingModule({
      imports: [AttractionCardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    touchDrag = TestBed.inject(TouchDragService);
    fixture = TestBed.createComponent(AttractionCardComponent);
    fixture.componentRef.setInput('attraction', ATTRACTION);
    fixture.componentRef.setInput('cityName', 'Paris');
    fixture.componentRef.setInput('cityId', 'paris');
    fixture.componentRef.setInput('stopId', 'stop-1');
    fixture.detectChanges();
  });

  afterEach(() => jest.useRealTimers());

  it('does nothing on touchstart until the long-press delay elapses', () => {
    fixture.componentInstance['onTouchStart']({ touches: [fakeTouch(10, 20)] } as unknown as TouchEvent);

    expect(touchDrag.state()).toBeNull();
  });

  it('arms the drag and calls TouchDragService.start after the long-press delay', () => {
    fixture.componentInstance['onTouchStart']({ touches: [fakeTouch(10, 20)] } as unknown as TouchEvent);

    jest.advanceTimersByTime(350);

    expect(touchDrag.state()).toEqual({
      mime: NEW_ATTRACTION_MIME,
      payload: JSON.stringify({ attractionId: 'paris_louvre', category: 'poi', estimatedMinutes: 150 }),
      x: 10, y: 20,
    });
  });

  it('cancels the pending long-press if the finger moves before it fires (treated as a scroll)', () => {
    fixture.componentInstance['onTouchStart']({ touches: [fakeTouch(10, 20)] } as unknown as TouchEvent);
    fixture.componentInstance['onTouchMove']({
      touches: [fakeTouch(30, 20)], preventDefault: jest.fn(),
    } as unknown as TouchEvent);

    jest.advanceTimersByTime(350);

    expect(touchDrag.state()).toBeNull();
  });

  it('updates TouchDragService position and prevents page scroll once armed', () => {
    fixture.componentInstance['onTouchStart']({ touches: [fakeTouch(10, 20)] } as unknown as TouchEvent);
    jest.advanceTimersByTime(350);
    const preventDefault = jest.fn();

    fixture.componentInstance['onTouchMove']({ touches: [fakeTouch(15, 60)], preventDefault } as unknown as TouchEvent);

    expect(preventDefault).toHaveBeenCalled();
    expect(touchDrag.state()).toEqual(expect.objectContaining({ x: 15, y: 60 }));
  });

  it('suppresses the synthetic click on touchend once armed, leaving TouchDragService for the timeline to consume', () => {
    fixture.componentInstance['onTouchStart']({ touches: [fakeTouch(10, 20)] } as unknown as TouchEvent);
    jest.advanceTimersByTime(350);
    const preventDefault = jest.fn();

    fixture.componentInstance['onTouchEnd']({ preventDefault } as unknown as TouchEvent);

    expect(preventDefault).toHaveBeenCalled();
    // Not cleared synchronously — DayTimelineComponent's window:touchend listener must get a
    // chance to consume() it first; only the deferred safety-net setTimeout would clear it.
    expect(touchDrag.state()).not.toBeNull();
    jest.runAllTimers();
    expect(touchDrag.state()).toBeNull();
  });

  it('does not suppress the click for a plain tap (never armed)', () => {
    fixture.componentInstance['onTouchStart']({ touches: [fakeTouch(10, 20)] } as unknown as TouchEvent);
    const preventDefault = jest.fn();

    fixture.componentInstance['onTouchEnd']({ preventDefault } as unknown as TouchEvent);

    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('onTouchCancel clears any pending or active drag', () => {
    fixture.componentInstance['onTouchStart']({ touches: [fakeTouch(10, 20)] } as unknown as TouchEvent);
    jest.advanceTimersByTime(350);
    expect(touchDrag.state()).not.toBeNull();

    fixture.componentInstance['onTouchCancel']();

    expect(touchDrag.state()).toBeNull();
  });
});

describe('AttractionCardComponent — touch handlers are inert on desktop', () => {
  let fixture: ComponentFixture<AttractionCardComponent>;
  let touchDrag: TouchDragService;

  beforeEach(() => {
    jest.useFakeTimers();
    mockMatchMedia(false);
    TestBed.configureTestingModule({
      imports: [AttractionCardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    touchDrag = TestBed.inject(TouchDragService);
    fixture = TestBed.createComponent(AttractionCardComponent);
    fixture.componentRef.setInput('attraction', ATTRACTION);
    fixture.componentRef.setInput('cityName', 'Paris');
    fixture.componentRef.setInput('cityId', 'paris');
    fixture.componentRef.setInput('stopId', 'stop-1');
    fixture.detectChanges();
  });

  afterEach(() => jest.useRealTimers());

  it('never arms a touch drag when device.isMobile() is false', () => {
    fixture.componentInstance['onTouchStart']({ touches: [fakeTouch(10, 20)] } as unknown as TouchEvent);
    jest.advanceTimersByTime(1000);

    expect(touchDrag.state()).toBeNull();
  });
});
