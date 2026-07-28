import { TestBed } from '@angular/core/testing';
import { CitySuggestCloudComponent } from './city-suggest-cloud.component';

describe('CitySuggestCloudComponent', () => {
  it('shows a fullscreen loading state with the dog mascot and a thinking message before suggestions arrive', () => {
    TestBed.configureTestingModule({ imports: [CitySuggestCloudComponent] });
    const fixture = TestBed.createComponent(CitySuggestCloudComponent);
    fixture.componentRef.setInput('cityId', 'paris');
    fixture.componentRef.setInput('suggestions', []);
    fixture.componentRef.setInput('loading', true);
    fixture.componentRef.setInput('error', null);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.csc-overlay')).not.toBeNull();
    expect(el.querySelector('.csc-dog')).not.toBeNull();
    expect(el.textContent).toContain('Pensando');
  });

  it('renders suggestion messages with icon, name, time and reason, falling back gracefully when the attraction id is not curated', () => {
    TestBed.configureTestingModule({ imports: [CitySuggestCloudComponent] });
    const fixture = TestBed.createComponent(CitySuggestCloudComponent);
    fixture.componentRef.setInput('cityId', 'paris');
    fixture.componentRef.setInput('suggestions', [
      { attractionId: 'paris_unknown_test_id', date: '02/07/2026', startTime: '10:00', endTime: '11:00', reason: 'Cerca de tu hotel' },
    ]);
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('error', null);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Cerca de tu hotel');
    expect(text).toContain('10:00');
    expect(text).toContain('📍'); // fallback icon when attractionId isn't in the curated catalog
  });

  it('shows the error message when error is set', () => {
    TestBed.configureTestingModule({ imports: [CitySuggestCloudComponent] });
    const fixture = TestBed.createComponent(CitySuggestCloudComponent);
    fixture.componentRef.setInput('cityId', 'paris');
    fixture.componentRef.setInput('suggestions', []);
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('error', 'No pudimos generar sugerencias. Intenta de nuevo.');
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No pudimos generar sugerencias');
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
    fixture.detectChanges();

    let emitted = false;
    fixture.componentInstance.addAll.subscribe(() => { emitted = true; });
    (fixture.nativeElement.querySelector('.city-suggest-add-all') as HTMLButtonElement).click();

    expect(emitted).toBe(true);
  });

  it('emits dismiss when the close button is clicked', () => {
    TestBed.configureTestingModule({ imports: [CitySuggestCloudComponent] });
    const fixture = TestBed.createComponent(CitySuggestCloudComponent);
    fixture.componentRef.setInput('cityId', 'paris');
    fixture.componentRef.setInput('suggestions', []);
    fixture.componentRef.setInput('loading', true);
    fixture.componentRef.setInput('error', null);
    fixture.detectChanges();

    let emitted = false;
    fixture.componentInstance.dismiss.subscribe(() => { emitted = true; });
    (fixture.nativeElement.querySelector('.csc-close') as HTMLButtonElement).click();

    expect(emitted).toBe(true);
  });

  it('emits dismiss when the backdrop is clicked but not when the dog/bubble scene is clicked', () => {
    TestBed.configureTestingModule({ imports: [CitySuggestCloudComponent] });
    const fixture = TestBed.createComponent(CitySuggestCloudComponent);
    fixture.componentRef.setInput('cityId', 'paris');
    fixture.componentRef.setInput('suggestions', []);
    fixture.componentRef.setInput('loading', true);
    fixture.componentRef.setInput('error', null);
    fixture.detectChanges();

    let emitted = false;
    fixture.componentInstance.dismiss.subscribe(() => { emitted = true; });
    (fixture.nativeElement.querySelector('.csc-scene') as HTMLElement).click();
    expect(emitted).toBe(false);

    (fixture.nativeElement.querySelector('.csc-overlay') as HTMLElement).click();
    expect(emitted).toBe(true);
  });
});
