import { Injectable, signal } from '@angular/core';

export interface TouchDragGhostState {
  icon: string;
  label: string;
  x: number;
  y: number;
}

/**
 * Purely-visual companion to TouchDragService (day-timeline drag/reschedule) and
 * AttractionCardComponent's own touch-drag handlers — a small floating "what am I
 * dragging" pill that follows the finger on mobile.
 *
 * Desktop's native HTML5 Drag and Drop gets this for free (the browser auto-generates a
 * drag image from the dragged element). Touch input has no such thing — TouchDragService's
 * time bubble tells you *when* a drop will land, but nothing showed *what* was being
 * dragged (family feedback follow-up, see project memory "mobile drag ghost-clone feature").
 *
 * Deliberately a separate service from TouchDragService rather than extending it: this one
 * is pure display state read by TouchDragGhostComponent, with no bearing on drop
 * resolution. Both the new-attraction (AttractionCardComponent) and reschedule
 * (DayTimelineComponent's own .tl-block handlers) touch-drag sources call show()/move()/hide()
 * directly — they don't route the ghost through TouchDragService's mime/payload/consume()
 * channel at all.
 */
@Injectable({ providedIn: 'root' })
export class TouchDragGhostService {
  private readonly _ghost = signal<TouchDragGhostState | null>(null);
  readonly ghost = this._ghost.asReadonly();

  show(icon: string, label: string, x: number, y: number): void {
    this._ghost.set({ icon, label, x, y });
  }

  move(x: number, y: number): void {
    this._ghost.update(g => (g ? { ...g, x, y } : g));
  }

  hide(): void {
    this._ghost.set(null);
  }
}
