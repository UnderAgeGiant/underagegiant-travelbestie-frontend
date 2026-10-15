import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CityComboboxComponent } from './city-combobox.component';
import { WORLD_CITIES } from '../../data/cities.data';

describe('CityComboboxComponent', () => {
  let fixture: ComponentFixture<CityComboboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CityComboboxComponent] }).compileComponents();
    fixture = TestBed.createComponent(CityComboboxComponent);
    fixture.detectChanges();
  });

  it('shows placeholder by default', () => {
    expect(fixture.nativeElement.textContent).toContain('Buscar ciudad o país');
  });

  it('opens dropdown on click', () => {
    fixture.nativeElement.querySelector('.combo-input').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.combo-dropdown')).not.toBeNull();
  });

  it('filters cities by query', async () => {
    fixture.nativeElement.querySelector('.combo-input').click();
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('.combo-search') as HTMLInputElement;
    input.value = 'paris';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.combo-item');
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].textContent).toContain('Paris');
  });

  it('shows the city passed via initialCity instead of the placeholder', () => {
    const madrid = WORLD_CITIES.find(c => c.id === 'madrid')!;
    fixture.componentRef.setInput('initialCity', madrid);
    fixture.detectChanges();
    const box = fixture.nativeElement.querySelector('.combo-input') as HTMLElement;
    expect(box.textContent).toContain(madrid.name);
    expect(box.textContent).not.toContain('Buscar ciudad o país');
  });

  it('a user pick overrides initialCity', () => {
    const madrid = WORLD_CITIES.find(c => c.id === 'madrid')!;
    const paris = WORLD_CITIES.find(c => c.id === 'paris')!;
    fixture.componentRef.setInput('initialCity', madrid);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.combo-input').click();
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('.combo-search') as HTMLInputElement;
    input.value = 'paris';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.combo-item') as HTMLElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.combo-input').textContent).toContain(paris.name);
  });
});
