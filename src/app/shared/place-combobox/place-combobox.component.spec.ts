import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PlaceComboboxComponent } from './place-combobox.component';

const ROWS = [
  { g: 3897, n: 'Rancagua', a: 'rancagua', c: 'CL', i: 'SCL' },
  { g: 3869, n: 'Santiago', a: 'santiago', c: 'CL', i: 'SCL' },
  { g: 3700, n: 'Bogotá', a: 'bogota', c: 'CO', i: 'BOG' },
];

describe('PlaceComboboxComponent', () => {
  let fixture: ComponentFixture<PlaceComboboxComponent>;
  let component: PlaceComboboxComponent;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PlaceComboboxComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(PlaceComboboxComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function openAndType(q: string): void {
    (fixture.nativeElement.querySelector('.combo-input') as HTMLElement).click();
    fixture.detectChanges();
    component.query.set(q);
    fixture.detectChanges();
  }

  it('does not request places.json before the user focuses the field', () => {
    http.expectNone('/data/places.json');
  });

  it('after focus and typing "ranc" requests /data/places.json and shows Rancagua', () => {
    openAndType('ranc');
    http.expectOne('/data/places.json').flush(ROWS);
    fixture.detectChanges();

    const options = Array.from(fixture.nativeElement.querySelectorAll('.combo-item')) as HTMLElement[];
    expect(options.map(o => o.textContent?.trim())).toEqual(['Rancagua, CL · SCL']);
  });

  it('matches accent-folded names and caps results at 8', () => {
    const many = Array.from({ length: 12 }, (_, k) => ({ g: k, n: `Villa ${k}`, a: `villa ${k}`, c: 'CL', i: 'SCL' }));
    openAndType('bogota');
    http.expectOne('/data/places.json').flush([...ROWS, ...many]);
    fixture.detectChanges();
    expect(component.filtered().map(p => p.name)).toEqual(['Bogotá']);

    component.query.set('villa');
    fixture.detectChanges();
    expect(component.filtered().length).toBe(8);
  });

  it('emits a mapped Place when an option is picked', () => {
    let emitted: unknown = 'unset';
    component.placeChange.subscribe((p: unknown) => (emitted = p));
    openAndType('ranc');
    http.expectOne('/data/places.json').flush(ROWS);

    component.select(component.filtered()[0]);

    expect(emitted).toEqual({ geonameId: 3897, name: 'Rancagua', countryCode: 'CL', iata: 'SCL' });
  });

  it('emits null when the user clears the selection', () => {
    let emitted: unknown = 'unset';
    component.placeChange.subscribe((p: unknown) => (emitted = p));
    component.clear();
    expect(emitted).toBeNull();
  });
});
