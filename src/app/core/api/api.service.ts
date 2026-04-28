import { Injectable, inject, Inject, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Trip, TransitLeg } from '../models/trip.model';
import { Comment } from '../models/comment.model';

const MOCK_TRIPS: Trip[] = [
  {
    id: 'mock-1',
    title: 'Europa Verano 2026',
    stops: [
      {
        cityId: 'paris',
        checkIn: '01/06/2026',
        checkOut: '05/06/2026',
        selectedAttractions: [
          { attractionId: 'paris_0', startTime: '10:00', date: '02/06/2026' },
          { attractionId: 'paris_1', startTime: '14:30', date: '03/06/2026' },
        ],
        lodging: { name: 'Hôtel Le Marais', url: 'https://example.com/lemarais' },
      },
      {
        cityId: 'rome',
        checkIn: '06/06/2026',
        checkOut: '10/06/2026',
        selectedAttractions: [
          { attractionId: 'rome_0', startTime: '09:00', date: '07/06/2026' },
        ],
        lodging: { name: 'Hotel Pantheon', url: 'https://example.com/pantheon' },
      },
    ],
    transits: [
      {
        fromCityId: '__start__',
        toCityId: '__start__',
        segments: [
          {
            mode: 'flight',
            departureDate: '01/06/2026',
            departureTime: '07:00',
            arrivalDate: '01/06/2026',
            arrivalTime: '09:30',
            notes: 'LATAM LA 706',
          },
        ],
      },
      {
        fromCityId: 'paris',
        toCityId: 'rome',
        segments: [
          {
            mode: 'flight',
            departureDate: '06/06/2026',
            departureTime: '11:00',
            arrivalDate: '06/06/2026',
            arrivalTime: '13:15',
            notes: 'Air France AF 1234',
          },
        ],
      },
    ],
  },
  {
    id: 'mock-2',
    title: 'Japón Otoño 2026',
    stops: [
      {
        cityId: 'tokyo',
        checkIn: '10/10/2026',
        checkOut: '16/10/2026',
        selectedAttractions: [
          { attractionId: 'tokyo_0', startTime: '11:00', date: '11/10/2026' },
        ],
        lodging: { name: 'Shinjuku Granbell Hotel', url: 'https://example.com/granbell' },
      },
      {
        cityId: 'kyoto',
        checkIn: '16/10/2026',
        checkOut: '20/10/2026',
        selectedAttractions: [],
      },
    ],
    transits: [],
  },
];

const MOCK_COMMENTS: Record<string, Comment[]> = {
  paris_0: [
    { id: 'mc1', attractionId: 'paris_0', name: 'Sofia', text: 'Breathtaking at sunset! Worth every minute of the queue.', rating: 5, color: '#A78BFA', date: 'Apr 22' },
    { id: 'mc2', attractionId: 'paris_0', name: 'Carlos', text: 'Go early in the morning to avoid the crowds.', rating: 4, color: '#34D399', date: 'Mar 10' },
  ],
  paris_1: [
    { id: 'mc3', attractionId: 'paris_1', name: 'Léa', text: 'The glass pyramid is stunning from every angle.', rating: 5, color: '#F472B6', date: 'Feb 28' },
  ],
  rome_0: [
    { id: 'mc4', attractionId: 'rome_0', name: 'Mia', text: 'Absolutely unmissable — the scale still surprises you in person.', rating: 5, color: '#34D399', date: 'Mar 15' },
  ],
  tokyo_0: [
    { id: 'mc5', attractionId: 'tokyo_0', name: 'Yuki', text: 'Best view of the city. Sunset is magical.', rating: 5, color: '#FBBF24', date: 'Jan 5' },
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

  // Mock only — karma mutations happen server-side in real mode as a side effect
  // of POST /trips and POST /comments. No PATCH /karma endpoint exists.
  updateKarmaMock(email: string, delta: number): void {
    const key = `tb_karma_${email}`;
    const current = parseInt(localStorage.getItem(key) ?? '3', 10);
    localStorage.setItem(key, String(current + delta));
  }
}
