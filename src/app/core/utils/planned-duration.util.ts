import { PlannedAttraction } from '../models/trip.model';

const hmToMin = (hm: string): number => {
  const [h, m] = hm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

/** Single source of truth: block height in timeline AND drag-reschedule duration. Minutes a planned entry takes: end − start when both are set and end is after start; else the catalog estimate (60 if unknown). */
export function plannedDurationMinutes(
  planned: Pick<PlannedAttraction, 'startTime' | 'endTime'>,
  att?: { estimatedMinutes?: number } | null,
): number {
  if (planned.startTime && planned.endTime) {
    const diff = hmToMin(planned.endTime) - hmToMin(planned.startTime);
    if (diff > 0) return diff;
  }
  return att?.estimatedMinutes ?? 60;
}
