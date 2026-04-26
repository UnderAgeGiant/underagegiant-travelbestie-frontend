import { Injectable, inject, Inject, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Trip } from '../models/trip.model';
import { Comment } from '../models/comment.model';

const MOCK_TRIPS: Trip[] = [
  {
    id: 'mock-1',
    title: 'Europe 2026',
    stops: [
      { cityId: 'paris', checkIn: '2026-06-01', checkOut: '2026-06-05', selectedAttractions: [] },
      { cityId: 'rome', checkIn: '2026-06-06', checkOut: '2026-06-10', selectedAttractions: [] },
    ],
  },
];

const MOCK_COMMENTS: Record<string, Comment[]> = {
  paris_0: [
    { id: 'mc1', attractionId: 'paris_0', name: 'Sofia', text: 'Breathtaking at sunset!', rating: 5, color: '#A78BFA', date: 'Apr 22' },
  ],
  rome_0: [
    { id: 'mc2', attractionId: 'rome_0', name: 'Mia', text: 'Absolutely unmissable!', rating: 5, color: '#34D399', date: 'Mar 15' },
  ],
};

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  constructor(@Optional() @Inject('ENV') private injectedEnv: typeof environment | null) {}

  private get env(): typeof environment { return (this.injectedEnv ?? environment) as typeof environment; }

  private get useMocks(): boolean { return this.env.useMocks; }
  private get base(): string { return this.env.apiUrl; }

  getTrips(): Observable<Trip[]> {
    if (this.useMocks) return of([...MOCK_TRIPS]);
    return this.http.get<Trip[]>(`${this.base}/trips`);
  }

  saveTrip(trip: Omit<Trip, 'id'>): Observable<Trip> {
    if (this.useMocks) return of({ id: `mock-${Date.now()}`, ...trip });
    return this.http.post<Trip>(`${this.base}/trips`, trip);
  }

  updateTrip(id: string, trip: Partial<Trip>): Observable<Trip> {
    if (this.useMocks) return of({ id, title: '', stops: [], ...trip });
    return this.http.put<Trip>(`${this.base}/trips/${id}`, trip);
  }

  getComments(attractionId: string): Observable<Comment[]> {
    if (this.useMocks) return of(MOCK_COMMENTS[attractionId] ?? []);
    return this.http.get<Comment[]>(`${this.base}/comments/${attractionId}`);
  }

  addComment(comment: Omit<Comment, 'id'>): Observable<Comment> {
    if (this.useMocks) return of({ id: `mock-c-${Date.now()}`, ...comment });
    return this.http.post<Comment>(`${this.base}/comments/${comment.attractionId}`, comment);
  }

  getKarma(email: string): Observable<{ karma: number }> {
    if (this.useMocks) {
      const key = `tb_karma_${email}`;
      const stored = localStorage.getItem(key);
      const karma = stored !== null ? parseInt(stored, 10) : 3;
      if (stored === null) localStorage.setItem(key, '3');
      return of({ karma });
    }
    return this.http.get<{ karma: number }>(`${this.base}/karma`);
  }

  updateKarma(email: string, delta: number): Observable<{ karma: number }> {
    if (this.useMocks) {
      const key = `tb_karma_${email}`;
      const current = parseInt(localStorage.getItem(key) ?? '3', 10);
      const next = current + delta;
      localStorage.setItem(key, String(next));
      return of({ karma: next });
    }
    return this.http.patch<{ karma: number }>(`${this.base}/karma`, { delta });
  }
}
