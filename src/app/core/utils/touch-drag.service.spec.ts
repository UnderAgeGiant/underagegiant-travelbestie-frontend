import { TestBed } from '@angular/core/testing';
import { TouchDragService } from './touch-drag.service';
import { NEW_ATTRACTION_MIME } from './day-timeline-drag.util';

describe('TouchDragService', () => {
  let service: TouchDragService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TouchDragService);
  });

  it('starts with no active drag', () => {
    expect(service.state()).toBeNull();
  });

  it('start() sets the active drag payload and position', () => {
    service.start(NEW_ATTRACTION_MIME, '{"attractionId":"paris_0"}', 10, 20);

    expect(service.state()).toEqual({
      mime: NEW_ATTRACTION_MIME, payload: '{"attractionId":"paris_0"}', x: 10, y: 20,
    });
  });

  it('move() updates only the position, keeping mime/payload', () => {
    service.start(NEW_ATTRACTION_MIME, '{"a":1}', 10, 20);

    service.move(30, 40);

    expect(service.state()).toEqual({ mime: NEW_ATTRACTION_MIME, payload: '{"a":1}', x: 30, y: 40 });
  });

  it('move() is a no-op when no drag is active', () => {
    service.move(30, 40);
    expect(service.state()).toBeNull();
  });

  it('consume() returns the final state and clears it', () => {
    service.start(NEW_ATTRACTION_MIME, '{"a":1}', 10, 20);
    service.move(30, 40);

    const result = service.consume();

    expect(result).toEqual({ mime: NEW_ATTRACTION_MIME, payload: '{"a":1}', x: 30, y: 40 });
    expect(service.state()).toBeNull();
  });

  it('consume() returns null and is a no-op when nothing is active', () => {
    expect(service.consume()).toBeNull();
    expect(service.state()).toBeNull();
  });

  it('cancel() clears the state without returning it', () => {
    service.start(NEW_ATTRACTION_MIME, '{"a":1}', 10, 20);

    service.cancel();

    expect(service.state()).toBeNull();
  });

  it('a second consume() after the first returns null (already cleared)', () => {
    service.start(NEW_ATTRACTION_MIME, '{"a":1}', 10, 20);
    service.consume();

    expect(service.consume()).toBeNull();
  });
});
