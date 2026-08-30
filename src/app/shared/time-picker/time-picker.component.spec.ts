import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimePickerComponent } from './time-picker.component';

describe('TimePickerComponent', () => {
  let fixture: ComponentFixture<TimePickerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TimePickerComponent] });
    fixture = TestBed.createComponent(TimePickerComponent);
  });

  afterEach(() => fixture.destroy());

  it('renders the initial time into the input, in 24-hour format', () => {
    fixture.componentRef.setInput('initialTime', '09:30');
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('09:30');
  });

  it('renders an afternoon time as 24-hour (e.g. 15:00), never with AM/PM', () => {
    fixture.componentRef.setInput('initialTime', '15:00');
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('15:00');
    expect(input.value).not.toMatch(/[ap]\.?m\.?/i);
  });

  // Regression coverage for StopListComponent's inline attraction-time row: the end-time
  // input's initialTime is a DERIVED value (planned.endTime || startTime + estimatedMinutes)
  // that legitimately changes after this component is first created — e.g. editing the
  // sibling start-time input recomputes it — while this same TimePickerComponent instance
  // stays mounted (same @for entryId, so Angular does not recreate it). Before this fix,
  // initialTime was read only once in ngAfterViewInit, so the displayed end time went stale.
  it('updates the displayed time when initialTime changes externally after creation', () => {
    fixture.componentRef.setInput('initialTime', '09:00');
    fixture.detectChanges();

    fixture.componentRef.setInput('initialTime', '11:00');
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('11:00');
  });

  it('does not emit timeChange when initialTime is updated externally (only on genuine user edits)', () => {
    fixture.componentRef.setInput('initialTime', '09:00');
    fixture.detectChanges();
    const spy = jest.fn();
    fixture.componentInstance.timeChange.subscribe(spy);

    fixture.componentRef.setInput('initialTime', '11:00');
    fixture.detectChanges();

    expect(spy).not.toHaveBeenCalled();
  });

  it('leaves the input blank when initialTime is empty', () => {
    fixture.componentRef.setInput('initialTime', '');
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('');
  });
});
