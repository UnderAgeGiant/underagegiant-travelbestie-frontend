import { TestBed } from '@angular/core/testing';
import { TouchDragGhostComponent } from './touch-drag-ghost.component';
import { TouchDragGhostService } from '../../core/utils/touch-drag-ghost.service';

describe('TouchDragGhostComponent', () => {
  let ghostService: TouchDragGhostService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TouchDragGhostComponent] });
    ghostService = TestBed.inject(TouchDragGhostService);
  });

  it('renders nothing when no ghost is showing', () => {
    const fixture = TestBed.createComponent(TouchDragGhostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.touch-drag-ghost')).toBeNull();
  });

  it('renders the icon and label when a ghost is showing', () => {
    ghostService.show('🏛️', 'Torre Eiffel', 10, 20);

    const fixture = TestBed.createComponent(TouchDragGhostComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement.querySelector('.touch-drag-ghost') as HTMLElement;
    expect(el).not.toBeNull();
    expect(el.textContent).toContain('🏛️');
    expect(el.textContent).toContain('Torre Eiffel');
  });

  it('positions the ghost at the service-provided coordinates', () => {
    ghostService.show('🏛️', 'Torre Eiffel', 123, 45);

    const fixture = TestBed.createComponent(TouchDragGhostComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement.querySelector('.touch-drag-ghost') as HTMLElement;
    expect(el.style.left).toBe('123px');
    expect(el.style.top).toBe('45px');
  });
});
