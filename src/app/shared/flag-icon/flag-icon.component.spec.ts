import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FlagIconComponent } from './flag-icon.component';

describe('FlagIconComponent', () => {
  let fixture: ComponentFixture<FlagIconComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [FlagIconComponent] });
    fixture = TestBed.createComponent(FlagIconComponent);
  });

  it('renders a flagcdn image sized and labeled from the inputs', () => {
    fixture.componentRef.setInput('flag', '🇫🇷');
    fixture.componentRef.setInput('alt', 'France');
    fixture.componentRef.setInput('size', 20);
    fixture.detectChanges();

    const img: HTMLImageElement = fixture.nativeElement.querySelector('img.flag-icon');
    expect(img.src).toBe('https://flagcdn.com/w40/fr.jpg');
    expect(img.alt).toBe('France');
    expect(img.style.width).toBe('20px');
  });

  it('falls back to the raw glyph when the flag cannot be converted to a country code', () => {
    fixture.componentRef.setInput('flag', '📍');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('img.flag-icon')).toBeNull();
    expect(fixture.nativeElement.querySelector('.flag-icon-fallback')?.textContent?.trim()).toBe('📍');
  });
});
