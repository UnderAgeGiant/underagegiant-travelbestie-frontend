import { formatDuration, formatSegment, legMinutes, segmentMinutes } from './transit-format.util';
import { TransitSegment } from '../models/trip.model';

const seg = (o: Partial<TransitSegment>): TransitSegment => ({
  mode: 'flight', departureDate: '', departureTime: '', arrivalDate: '', arrivalTime: '', notes: '', ...o,
});

describe('transit-format util (pins the AI result step output)', () => {
  it('formatDuration', () => {
    expect(formatDuration(90)).toBe('1h 30m');
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(45)).toBe('45m');
  });

  it('same-day segment', () => {
    expect(formatSegment(seg({ departureDate: '01/06/2026', departureTime: '08:00', arrivalDate: '01/06/2026', arrivalTime: '10:30' })))
      .toBe('✈️ 01/06/2026 08:00 → 10:30 (2h 30m)');
  });

  it('a different arrival day shows the arrival date', () => {
    expect(formatSegment(seg({ mode: 'train', departureDate: '01/06/2026', departureTime: '23:00', arrivalDate: '02/06/2026', arrivalTime: '01:00' })))
      .toBe('🚂 01/06/2026 23:00 → 02/06/2026 01:00 (2h)');
  });

  it('notes are appended', () => {
    expect(formatSegment(seg({ mode: 'bus', durationMinutes: 45, notes: 'Flixbus' }))).toBe('🚌 45m · Flixbus');
  });

  it('no dates falls back to the stored duration', () => {
    expect(formatSegment(seg({ mode: 'car', durationMinutes: 120 }))).toBe('🚗 2h');
    expect(segmentMinutes(seg({ durationMinutes: 30 }))).toBe(30);
  });

  it('legMinutes sums the segments', () => {
    expect(legMinutes({ fromCityId: 'a', toCityId: 'b', segments: [seg({ durationMinutes: 30 }), seg({ durationMinutes: 45 })] } as any)).toBe(75);
  });
});
