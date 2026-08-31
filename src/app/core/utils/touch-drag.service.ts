import { Injectable, signal } from '@angular/core';

export interface TouchDragState {
  mime: string;
  payload: string;
  x: number;
  y: number;
}

/**
 * Cross-component coordination for touch-based drag-and-drop scheduling on the day timeline
 * (family feedback: "the move/drag is not allowed on mobile"). Native HTML5 Drag and Drop
 * (draggable="true" + dragstart/dragover/drop) does not fire from touch input on any mobile
 * browser — there is no `DataTransfer` a touch gesture can populate — so `AttractionCardComponent`
 * (the drag SOURCE) and `DayTimelineComponent` (the drop TARGET) can't coordinate a touch drag
 * through the DOM event system the way they do for mouse-driven native drag. This service is
 * the channel between them instead: the source calls start()/move() as the finger moves, and
 * the target (which has no direct touch events of its own once a touch starts on the source
 * element — see DayTimelineComponent's window:touchend listener) reads state()/consume() to
 * resolve the drop.
 *
 * Mirrors DataTransfer's shape loosely (`mime`/`payload` string, read via consume() the way
 * DataTransfer.getData() is read) so the same drop-resolution logic in DayTimelineComponent can
 * be shared between the native-drag and touch-drag code paths.
 */
@Injectable({ providedIn: 'root' })
export class TouchDragService {
  private readonly _state = signal<TouchDragState | null>(null);
  readonly state = this._state.asReadonly();

  start(mime: string, payload: string, x: number, y: number): void {
    this._state.set({ mime, payload, x, y });
  }

  move(x: number, y: number): void {
    this._state.update(s => (s ? { ...s, x, y } : s));
  }

  /** Returns the final state (if any) and clears it — the drop target calls this once, on release. */
  consume(): TouchDragState | null {
    const s = this._state();
    this._state.set(null);
    return s;
  }

  /** Clears without returning a value — used by the source as a release-time safety net (see
   *  AttractionCardComponent) in case nothing ever consumed the drag (e.g. dropped outside any
   *  day-timeline instance). */
  cancel(): void {
    this._state.set(null);
  }
}
