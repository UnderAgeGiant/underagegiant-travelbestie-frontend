import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DatePickerComponent } from '../../../shared/date-picker/date-picker.component';
import { TransitConnectorComponent } from './transit-connector.component';
import { TripService } from '../trip.service';

describe('TransitConnectorComponent — mode buttons add the segment (feedback F2/F3 2026-09-28)', () => {
  let fixture: ComponentFixture<TransitConnectorComponent>;
  let c: any;
  let trip: TripService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [TransitConnectorComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
      schemas: [NO_ERRORS_SCHEMA],
    });
    TestBed.overrideComponent(TransitConnectorComponent, {
      remove: { imports: [DatePickerComponent] },
    });
    trip = TestBed.inject(TripService);
    fixture = TestBed.createComponent(TransitConnectorComponent);
    fixture.componentRef.setInput('fromId', 'paris');
    fixture.componentRef.setInput('toId', 'london');
    c = fixture.componentInstance;
    c.openEdit();
    fixture.detectChanges();
  });

  const q = (sel: string) => fixture.nativeElement.querySelector(sel) as HTMLButtonElement | null;
  const modeBtn = (label: string) =>
    [...fixture.nativeElement.querySelectorAll('.transit-mode-btn')].find((b: any) => b.textContent.includes(label)) as HTMLButtonElement;
  const saveBtn = () => [...fixture.nativeElement.querySelectorAll('button')].find((b: any) => b.textContent.includes('Guardar')) as HTMLButtonElement;
  function fillTimes() {
    c.tDepDate.set('01/06/2026'); c.tDepTime.set('09:00');
    c.tArrDate.set('01/06/2026'); c.tArrTime.set('11:00');
    fixture.detectChanges();
  }

  it('has no "+ Tramo" button and puts the mode buttons after the fields, right before Guardar', () => {
    expect(fixture.nativeElement.textContent).not.toContain('+ Tramo');
    const form = q('.transit-form')!;
    const modes = form.querySelector('.transit-modes')!;
    const lastInput = [...form.querySelectorAll('input')].pop()!;
    expect(lastInput.compareDocumentPosition(modes) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(modes.compareDocumentPosition(saveBtn()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('disables mode buttons until the times are valid, and Guardar until a segment exists', () => {
    expect(modeBtn('Tren').disabled).toBe(true);
    expect(saveBtn().disabled).toBe(true);
    fillTimes();
    expect(modeBtn('Tren').disabled).toBe(false);
    expect(saveBtn().disabled).toBe(true);
  });

  it('clicking a mode adds a segment with that mode, keeps the form open and chains the next departure', () => {
    fillTimes();
    modeBtn('Tren').click();
    fixture.detectChanges();
    expect(c.segs()).toEqual([expect.objectContaining({ mode: 'train', departureTime: '09:00', arrivalTime: '11:00' })]);
    expect(c.editOpen()).toBe(true);
    expect(c.tDepTime()).toBe('11:00');
    expect(c.tArrTime()).toBe('');
    expect(saveBtn().disabled).toBe(false);
  });

  it('Guardar saves the added segments to the trip and closes', () => {
    fillTimes();
    modeBtn('Avión').click();
    fixture.detectChanges();
    saveBtn().click();
    fixture.detectChanges();
    expect(trip.transitMap().get('paris|london')?.segments.map(s => s.mode)).toEqual(['flight']);
    expect(c.editOpen()).toBe(false);
  });

  it('shows a red, larger 🗑 when editing an existing transit', () => {
    fillTimes();
    modeBtn('Bus').click();
    fixture.detectChanges();
    saveBtn().click();
    fixture.detectChanges();
    c.openEdit();
    fixture.detectChanges();
    expect(q('.transit-del-btn')).not.toBeNull();
    expect(saveBtn().disabled).toBe(false); // existing segments keep Guardar enabled
  });
});
