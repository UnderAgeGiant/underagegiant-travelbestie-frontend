import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CityMultiPickerComponent } from './city-multi-picker.component';

describe('CityMultiPickerComponent', () => {
  let fixture: ComponentFixture<CityMultiPickerComponent>;
  let el: HTMLElement;
  let emitted: string[][];

  function open(): void {
    (el.querySelector('.cmp-field') as HTMLElement).click();
    fixture.detectChanges();
  }
  function search(q: string): void {
    const input = el.querySelector('.combo-search') as HTMLInputElement;
    input.value = q;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }
  const optionTexts = () => Array.from(el.querySelectorAll('[role="option"]')).map(o => o.textContent!.trim());
  const continent = (key: string) => el.querySelector(`[data-continent="${key}"]`) as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CityMultiPickerComponent] }).compileComponents();
    fixture = TestBed.createComponent(CityMultiPickerComponent);
    fixture.componentRef.setInput('max', 3);
    fixture.componentRef.setInput('limitNote', 'Tres ciudades es el máximo');
    emitted = [];
    fixture.componentInstance.selected.subscribe(v => emitted.push(v));
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('renders Europe first and expanded, Asia collapsed', () => {
    open();
    const heads = Array.from(el.querySelectorAll('.cmp-continent'));
    expect(heads[0].getAttribute('data-continent')).toBe('europe');
    expect(continent('europe').getAttribute('aria-expanded')).toBe('true');
    expect(continent('asia').getAttribute('aria-expanded')).toBe('false');
    expect(optionTexts()).toContain('Paris');
    expect(optionTexts()).not.toContain('Tokyo');
  });

  it('search "rome" shows Rome under Italy and expands Europe only', () => {
    open();
    search('rome');
    expect(optionTexts()).toContain('Rome');
    expect(el.querySelector('.cmp-country')!.textContent).toContain('Italy');
    expect(continent('europe').getAttribute('aria-expanded')).toBe('true');
    expect(continent('asia')).toBeNull();
  });

  it('search "italy" lists every Italian city', () => {
    open();
    search('ITALY');
    expect(optionTexts().length).toBeGreaterThanOrEqual(10);
    expect(optionTexts()).toEqual(expect.arrayContaining(['Rome', 'Florence', 'Venice']));
  });

  it('ticking keeps the list open and emits; at max 3 the rest is disabled with the note', () => {
    fixture.componentRef.setInput('selected', ['paris', 'rome']);
    fixture.detectChanges();
    expect(el.querySelector('.cmp-limit')).toBeNull();
    open();
    search('madrid');
    (el.querySelector('[role="option"]') as HTMLElement).click();
    fixture.detectChanges();
    expect(emitted.at(-1)).toEqual(['paris', 'rome', 'madrid']);
    expect(el.querySelector('.combo-dropdown')).not.toBeNull();
    search('lisbon');
    const lisbon = el.querySelector('[role="option"]') as HTMLButtonElement;
    expect(lisbon.disabled).toBe(true);
    expect(lisbon.getAttribute('aria-disabled')).toBe('true');
    expect(el.querySelector('.cmp-limit')!.textContent).toContain('Tres ciudades');
  });

  it('✕ on a chip emits selectedChange without that id', () => {
    fixture.componentRef.setInput('selected', ['paris', 'rome']);
    fixture.detectChanges();
    const remove = el.querySelector('[aria-label="Quitar Paris"]') as HTMLElement;
    remove.click();
    expect(emitted.at(-1)).toEqual(['rome']);
  });

  it('cities with no attractions are not listed', () => {
    open();
    search('olympia');
    expect(optionTexts()).toEqual([]);
  });

  it('Escape and "Listo" close the list', () => {
    open();
    (el.querySelector('.cmp-done') as HTMLElement).click();
    fixture.detectChanges();
    expect(el.querySelector('.combo-dropdown')).toBeNull();
    open();
    el.querySelector('.cmp-field')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(el.querySelector('.combo-dropdown')).toBeNull();
  });
});
