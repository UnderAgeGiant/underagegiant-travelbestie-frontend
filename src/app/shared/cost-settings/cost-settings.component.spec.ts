import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CostSettingsComponent } from './cost-settings.component';
import { CostSettings, DEFAULT_COST_SETTINGS } from '../../core/models/trip.model';

describe('CostSettingsComponent', () => {
  let fixture: ComponentFixture<CostSettingsComponent>;
  let http: HttpTestingController;
  let emitted: CostSettings[];

  function setup(settings: CostSettings = DEFAULT_COST_SETTINGS): void {
    TestBed.configureTestingModule({
      imports: [CostSettingsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(CostSettingsComponent);
    fixture.componentRef.setInput('settings', settings);
    emitted = [];
    fixture.componentInstance.settingsChange.subscribe(v => emitted.push(v));
    fixture.detectChanges();
    http = TestBed.inject(HttpTestingController);
  }

  afterEach(() => http?.verify());

  function button(selector: string): HTMLButtonElement {
    return fixture.nativeElement.querySelector(selector) as HTMLButtonElement;
  }

  it('adults stepper cannot go below 1', () => {
    setup({ ...DEFAULT_COST_SETTINGS, adults: 1 });

    expect(button('button[aria-label="Quitar adulto"]').disabled).toBe(true);
    button('button[aria-label="Quitar adulto"]').click();
    expect(emitted.length).toBe(0);
  });

  it('adults stepper decrements and emits a new object', () => {
    const input = { ...DEFAULT_COST_SETTINGS, adults: 3 };
    setup(input);

    button('button[aria-label="Quitar adulto"]').click();

    expect(emitted[0].adults).toBe(2);
    expect(emitted[0]).not.toBe(input);
    expect(input.adults).toBe(3);
  });

  it('children stepper cannot go below 0', () => {
    setup({ ...DEFAULT_COST_SETTINGS, children: 0 });

    expect(button('button[aria-label="Quitar niño"]').disabled).toBe(true);
  });

  it('children stepper cannot go above 20', () => {
    setup({ ...DEFAULT_COST_SETTINGS, children: 20 });

    expect(button('button[aria-label="Agregar niño"]').disabled).toBe(true);
  });

  it('choosing Lujo emits comfort luxury', () => {
    setup();

    button('button[data-comfort="luxury"]').click();

    expect(emitted[0].comfort).toBe('luxury');
  });

  it('shows only the selected level description, containing 5★ for Lujo', () => {
    setup({ ...DEFAULT_COST_SETTINGS, comfort: 'luxury' });

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('5★');
    expect(text).not.toContain('Cama en hostal');
  });

  it('wraps the settings in a group titled "Información de los viajeros"', () => {
    setup();

    const group = fixture.nativeElement.querySelector('fieldset.cs');
    expect(group?.querySelector('legend')?.textContent).toContain('Información de los viajeros');
  });

  it('babies stepper cannot go below 0 and starts at 0 when infants is missing', () => {
    const { infants: _omit, ...legacy } = { ...DEFAULT_COST_SETTINGS, infants: 0 };
    setup(legacy as CostSettings);

    expect(button('button[aria-label="Quitar bebé"]').disabled).toBe(true);
    button('button[aria-label="Agregar bebé"]').click();
    expect(emitted[0].infants).toBe(1);
  });

  it('babies stepper cannot go above 20', () => {
    setup({ ...DEFAULT_COST_SETTINGS, infants: 20 });

    expect(button('button[aria-label="Agregar bebé"]').disabled).toBe(true);
  });
});
