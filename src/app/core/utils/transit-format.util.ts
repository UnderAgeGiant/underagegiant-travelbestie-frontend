import { TransitLeg, TransitMode, TransitSegment } from '../models/trip.model';

// ponytail: third copy (AI result + shared-trip keep theirs, owner rule 2026-10-25); dedupe when those screens are next touched
// Same output as AiPlanningComponent.computeMins/fmtDur/fmtSeg/totalMins.

const ICONS: Record<TransitMode, string> = { flight: '✈️', train: '🚂', boat: '🚢', bus: '🚌', car: '🚗' };

const hasTimes = (s: TransitSegment) => !!(s.departureDate && s.departureTime && s.arrivalDate && s.arrivalTime);

export function segmentMinutes(seg: TransitSegment): number {
  if (hasTimes(seg)) {
    const parse = (d: string, t: string) => {
      const [dd, mm, yyyy] = d.split('/').map(Number);
      const [hh, mi]       = t.split(':').map(Number);
      return new Date(yyyy, mm - 1, dd, hh ?? 0, mi ?? 0).getTime();
    };
    return Math.max(0, Math.round((parse(seg.arrivalDate, seg.arrivalTime) - parse(seg.departureDate, seg.departureTime)) / 60000));
  }
  return seg.durationMinutes ?? 0;
}

export function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60), m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  return h > 0 ? `${h}h` : `${m}m`;
}

export function formatSegment(seg: TransitSegment): string {
  const icon = ICONS[seg.mode] ?? '🚀';
  let display: string;
  if (hasTimes(seg)) {
    const arr = seg.departureDate === seg.arrivalDate ? seg.arrivalTime : `${seg.arrivalDate} ${seg.arrivalTime}`;
    display = `${icon} ${seg.departureDate} ${seg.departureTime} → ${arr} (${formatDuration(segmentMinutes(seg))})`;
  } else {
    display = `${icon} ${formatDuration(seg.durationMinutes ?? 0)}`;
  }
  return seg.notes ? `${display} · ${seg.notes}` : display;
}

export function legMinutes(leg: TransitLeg): number {
  return leg.segments.reduce((sum, s) => sum + segmentMinutes(s), 0);
}
