import { Injectable, inject, Inject, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Trip } from '../models/trip.model';
import { Comment } from '../models/comment.model';
import { MOCK_TRIPS } from '../../mock/trips.mock';
import { MOCK_COMMENTS } from '../../mock/comments.mock';

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

  // Auth interceptor automatically attaches the Bearer token for logged-in users.
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

  deleteTrip(id: string): Observable<void> {
    if (this.useMocks) return of(undefined);
    return this.http.delete<void>(`${this.base}/trips/${id}`);
  }

  // Mock only — karma mutations happen server-side in real mode as a side effect
  // of POST /trips and POST /comments. No PATCH /karma endpoint exists.
  updateKarmaMock(email: string, delta: number): void {
    const key = `tb_karma_${email}`;
    const current = parseInt(localStorage.getItem(key) ?? '3', 10);
    localStorage.setItem(key, String(current + delta));
  }
}
