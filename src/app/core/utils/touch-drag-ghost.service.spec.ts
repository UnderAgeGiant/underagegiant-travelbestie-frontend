import { TestBed } from '@angular/core/testing';
import { TouchDragGhostService } from './touch-drag-ghost.service';

describe('TouchDragGhostService', () => {
  let service: TouchDragGhostService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TouchDragGhostService);
  });

  it('starts with no ghost visible', () => {
    expect(service.ghost()).toBeNull();
  });

  it('show() sets the ghost icon, label and position', () => {
    service.show('🏛️', 'Torre Eiffel', 10, 20);

    expect(service.ghost()).toEqual({ icon: '🏛️', label: 'Torre Eiffel', x: 10, y: 20 });
  });

  it('move() updates only the position, keeping icon/label', () => {
    service.show('🏛️', 'Torre Eiffel', 10, 20);

    service.move(30, 40);

    expect(service.ghost()).toEqual({ icon: '🏛️', label: 'Torre Eiffel', x: 30, y: 40 });
  });

  it('move() is a no-op when no ghost is showing', () => {
    service.move(30, 40);
    expect(service.ghost()).toBeNull();
  });

  it('hide() clears the ghost', () => {
    service.show('🏛️', 'Torre Eiffel', 10, 20);

    service.hide();

    expect(service.ghost()).toBeNull();
  });
});
