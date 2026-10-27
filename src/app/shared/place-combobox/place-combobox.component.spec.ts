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

  it('ArrowDown then Enter picks the highlighted option (keyboard)', () => {
    let emitted: unknown = 'unset';
    component.placeChange.subscribe((p: unknown) => (emitted = p));
    openAndType('ranc');
    http.expectOne('/data/places.json').flush(ROWS);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('.combo-search') as HTMLInputElement;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();
    expect(input.getAttribute('aria-activedescendant')).toBe(
      fixture.nativeElement.querySelector('[role="option"]').id,
    );
    expect(fixture.nativeElement.querySelector('[role="option"]').getAttribute('aria-selected')).toBe('true');

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(emitted).toEqual({ geonameId: 3897, name: 'Rancagua', countryCode: 'CL', iata: 'SCL' });
    expect(component.open()).toBe(false);
  });

  it('Escape closes the dropdown without emitting', () => {
    let emitted: unknown = 'unset';
    component.placeChange.subscribe((p: unknown) => (emitted = p));
    openAndType('ranc');
    http.expectOne('/data/places.json').flush(ROWS);

    const input = fixture.nativeElement.querySelector('.combo-search') as HTMLInputElement;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(component.open()).toBe(false);
    expect(fixture.nativeElement.querySelector('.combo-search')).toBeNull();
    expect(emitted).toBe('unset');
  });

  it('the trigger is a real button exposing combobox ARIA state', () => {
    const trigger = fixture.nativeElement.querySelector('.combo-input') as HTMLElement;
    expect(trigger.tagName).toBe('BUTTON');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    trigger.click();
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('[role="listbox"]')).toBeTruthy();
    http.expectOne('/data/places.json').flush(ROWS);
  });

  it('clear() moves focus to the trigger instead of dropping it to the body', () => {
    fixture.componentRef.setInput('value', { geonameId: 3869, name: 'Santiago', countryCode: 'CL', iata: 'SCL' });
    fixture.detectChanges();
    const clearBtn = fixture.nativeElement.querySelector('[aria-label="Quitar ciudad"]') as HTMLButtonElement;
    clearBtn.click();
    fixture.detectChanges();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.combo-input'));
  });

  it('shows the value label, a pick overrides it, and a new value input resets it', () => {
    const santiago = { geonameId: 3869, name: 'Santiago', countryCode: 'CL', iata: 'SCL' };
    const rancagua = { geonameId: 3897, name: 'Rancagua', countryCode: 'CL', iata: 'SCL' };
    const bogota = { geonameId: 3700, name: 'Bogotá', countryCode: 'CO', iata: 'BOG' };
    fixture.componentRef.setInput('value', santiago);
    fixture.detectChanges();
    expect(component.selected()).toEqual(santiago);

    component.select(rancagua);
    fixture.componentRef.setInput('value', santiago); // same value: the pick stands
    fixture.detectChanges();
    expect(component.selected()).toEqual(rancagua);

    fixture.componentRef.setInput('value', bogota); // parent changed it: label follows
    fixture.detectChanges();
    expect(component.selected()).toEqual(bogota);
  });

  it('exposes exactly one combobox role while the list is open (the search input)', () => {
    openAndType('ranc');
    http.expectOne('/data/places.json').flush(ROWS);
    fixture.detectChanges();
    const roles = Array.from(fixture.nativeElement.querySelectorAll('[role="combobox"]')) as HTMLElement[];
    expect(roles.map(el => el.tagName)).toEqual(['INPUT']);
  });

  it('emits null when the user clears the selection', () => {
    let emitted: unknown = 'unset';
    component.placeChange.subscribe((p: unknown) => (emitted = p));
    component.clear();
    expect(emitted).toBeNull();
  });
});
