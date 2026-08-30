import { AttractionCategory } from '../models/attraction-category';

/**
 * Drag-and-drop scheduling on tb-day-timeline — family feedback ideas #1/#2
 * (docs/superpowers/plans/2026-08-29-family-feedback-round.md Tasks 8/9).
 * Custom MIME types distinguish "drop a brand-new attraction from the list"
 * from "reschedule a block already on the grid" in one shared drop handler.
 */
export const NEW_ATTRACTION_MIME = 'application/x-tb-new-attraction';
export const RESCHEDULE_MIME = 'application/x-tb-reschedule';

export interface NewAttractionDragPayload {
  attractionId: string;
  category?: AttractionCategory;
  estimatedMinutes?: number;
}

export interface RescheduleDragPayload {
  stopId: string;
  entryId: string;
}

export const DRAG_SNAP_MINUTES = 15;

/**
 * Converts a Y offset (px, from the top of the day-timeline grid) into a
 * minute-of-day snapped to the nearest 15 minutes, clamped to the grid's
 * displayed [firstHour, lastHour] range (inclusive of the last hour's final
 * quarter-hour slot, e.g. 23:45 when lastHour is 23).
 */
export function snapMinutesFromOffset(offsetY: number, firstHour: number, lastHour: number, pxPerHour: number): number {
  const rawMinutes = firstHour * 60 + (offsetY / pxPerHour) * 60;
  const snapped = Math.round(rawMinutes / DRAG_SNAP_MINUTES) * DRAG_SNAP_MINUTES;
  const min = firstHour * 60;
  const max = lastHour * 60 + (60 - DRAG_SNAP_MINUTES);
  return Math.max(min, Math.min(max, snapped));
}

export function minutesToHm(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
