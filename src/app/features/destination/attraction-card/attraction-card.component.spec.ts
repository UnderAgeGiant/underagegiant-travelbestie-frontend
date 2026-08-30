import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AttractionCardComponent } from './attraction-card.component';
import { Attraction } from '../../../core/models/comment.model';
import { NEW_ATTRACTION_MIME, NewAttractionDragPayload } from '../../../core/utils/day-timeline-drag.util';

const ATTRACTION: Attraction = {
  id: 'paris_louvre', name: 'Louvre', type: 'Histórico', category: 'poi',
  active: true, icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 150,
};

describe('AttractionCardComponent — drag to schedule', () => {
  let fixture: ComponentFixture<AttractionCardComponent>;

  beforeEach(() => {
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
