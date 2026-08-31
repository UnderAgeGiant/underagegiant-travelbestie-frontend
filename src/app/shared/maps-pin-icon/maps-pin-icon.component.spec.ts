import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapsPinIconComponent } from './maps-pin-icon.component';

describe('MapsPinIconComponent', () => {
  let fixture: ComponentFixture<MapsPinIconComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [MapsPinIconComponent] });
    fixture = TestBed.createComponent(MapsPinIconComponent);
    fixture.detectChanges();
  });

  it('renders a single inline SVG pin glyph', () => {
    const svg = fixture.nativeElement.querySelector('svg.maps-pin-icon');
    expect(svg).not.toBeNull();
    expect(svg.getAttribute('fill')).toBe('currentColor');
  });
});
