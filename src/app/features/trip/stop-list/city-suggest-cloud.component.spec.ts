import { TestBed } from '@angular/core/testing';
import { CitySuggestCloudComponent } from './city-suggest-cloud.component';

describe('CitySuggestCloudComponent', () => {
  it('renders suggestion time and reason, falling back gracefully when the attraction id is not curated', () => {
    TestBed.configureTestingModule({ imports: [CitySuggestCloudComponent] });
    const fixture = TestBed.createComponent(CitySuggestCloudComponent);
    fixture.componentRef.setInput('cityId', 'paris');
    fixture.componentRef.setInput('suggestions', [
      { attractionId: 'paris_unknown_test_id', date: '02/07/2026', startTime: '10:00', endTime: '11:00', reason: 'Cerca de tu hotel' },
    ]);
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('error', null);
    fixture.componentRef.setInput('x', 100);
    fixture.componentRef.setInput('y', 100);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Cerca de tu hotel');
    expect(text).toContain('10:00');
    expect(text).toContain('📍'); // fallback icon when attractionId isn't in the curated catalog
  });

  it('shows the loading state before suggestions arrive', () => {
    TestBed.configureTestingModule({ imports: [CitySuggestCloudComponent] });
    const fixture = TestBed.createComponent(CitySuggestCloudComponent);
    fixture.componentRef.setInput('cityId', 'paris');
    fixture.componentRef.setInput('suggestions', []);
    fixture.componentRef.setInput('loading', true);
    fixture.componentRef.setInput('error', null);
    fixture.componentRef.setInput('x', 0);
    fixture.componentRef.setInput('y', 0);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Pensando');
  });

  it('emits addAll when the "Agregar todo al plan" button is clicked', () => {
    TestBed.configureTestingModule({ imports: [CitySuggestCloudComponent] });
    const fixture = TestBed.createComponent(CitySuggestCloudComponent);
    fixture.componentRef.setInput('cityId', 'paris');
    fixture.componentRef.setInput('suggestions', [
      { attractionId: 'paris_unknown_test_id', date: '02/07/2026', startTime: '10:00', endTime: '11:00', reason: 'x' },
    ]);
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('error', null);
    fixture.componentRef.setInput('x', 0);
    fixture.componentRef.setInput('y', 0);
    fixture.detectChanges();

    let emitted = false;
    fixture.componentInstance.addAll.subscribe(() => { emitted = true; });
    (fixture.nativeElement.querySelector('.city-suggest-add-all') as HTMLButtonElement).click();

    expect(emitted).toBe(true);
  });
});
