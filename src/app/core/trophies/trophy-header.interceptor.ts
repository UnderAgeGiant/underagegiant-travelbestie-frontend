import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { EarnedTrophy } from '../models/trophy.model';
import { TrophyCelebrationService } from './trophy-celebration.service';

export function parseNewTrophies(raw: string | null): EarnedTrophy[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((t): t is EarnedTrophy => !!t && typeof t.type === 'string' && typeof t.tier === 'string')
      : [];
  } catch { return []; }
}

/** Fires the instant celebration for trophies the backend reports on X-New-Trophies. */
export const trophyHeaderInterceptor: HttpInterceptorFn = (req, next) => {
  const celebration = inject(TrophyCelebrationService);
  return next(req).pipe(tap(event => {
    if (!(event instanceof HttpResponse)) return;
    const list = parseNewTrophies(event.headers.get('X-New-Trophies'));
    if (list.length) celebration.celebrate(list);
  }));
};
