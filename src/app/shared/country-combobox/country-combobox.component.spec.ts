import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CountryComboboxComponent } from './country-combobox.component';

describe('CountryComboboxComponent', () => {
  let fixture: ComponentFixture<CountryComboboxComponent>;
  let component: CountryComboboxComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [CountryComboboxComponent] });
    fixture = TestBed.createComponent(CountryComboboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows the placeholder when nothing is selected', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Buscar país');
  });

  it('preselects the country matching initialCode', () => {
    fixture.componentRef.setInput('initialCode', 'CL');
    fixture.detectChanges();
    expect(component.selected()?.code).toBe('CL');
  });

  it('filters the dropdown list by search query', () => {
    component.toggleOpen();
    component.query.set('chile');
    fixture.detectChanges();
    expect(component.filtered().length).toBe(1);
    expect(component.filtered()[0].code).toBe('CL');
  });

  it('emits countryChange and closes the dropdown on selection', () => {
    let emitted: string | undefined;
    component.countryChange.subscribe((c) => (emitted = c.code));
    component.toggleOpen();
    const chile = component.filtered().find((c) => c.code === 'CL')!;

    component.select(chile);

    expect(emitted).toBe('CL');
    expect(component.open()).toBe(false);
  });
});
