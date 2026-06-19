import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CityComboboxComponent } from './city-combobox.component';

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
});
