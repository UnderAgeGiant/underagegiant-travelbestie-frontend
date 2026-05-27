import { Injectable, inject, Inject, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Trip } from '../models/trip.model';
import { Comment } from '../models/comment.model';
import { CityCatalog, PlanTripRequest, PlanTripResponse, SuggestTripsResponse } from '../models/ai.model';
import { KarmaPackage, CreateOrderResponse, CaptureOrderResponse } from '../models/karma-purchase.model';
import { SharedTrip } from '../shared-trips/shared-trips.service';
import { MOCK_TRIPS } from '../../mock/trips.mock';
import { MOCK_COMMENTS } from '../../mock/comments.mock';
import { WORLD_CITIES } from '../../data/cities.data';
import { getAttractions } from '../../data/attractions.data';

const MOCK_KARMA_PACKAGES: KarmaPackage[] = [
  { id: 'karma_10',  karma: 10,  price: '0.99', currency: 'USD', label: '10 Karma'  },
  { id: 'karma_25',  karma: 25,  price: '1.99', currency: 'USD', label: '25 Karma'  },
  { id: 'karma_50',  karma: 50,  price: '3.99', currency: 'USD', label: '50 Karma'  },
  { id: 'karma_100', karma: 100, price: '6.99', currency: 'USD', label: '100 Karma' },
];

const CITY_CATALOG: CityCatalog = Object.fromEntries(
  WORLD_CITIES.map(city => [city.id, getAttractions(city).map(a => ({ id: a.id, name: a.name }))])
);

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

  exportItinerary(
    id: string,
    cityNames: Record<string, string>,
    attractionNames: Record<string, string>,
  ): Observable<Blob> {
    if (this.useMocks) return of(new Blob());
    return this.http.post(
      `${this.base}/trips/${id}/itinerary`,
      { cityNames, attractionNames },
      { responseType: 'blob' },
    );
  }

  // Mock only — karma mutations happen server-side in real mode as a side effect
  // of POST /trips and POST /comments. No PATCH /karma endpoint exists.
  updateKarmaMock(email: string, delta: number): void {
    const key = `tb_karma_${email}`;
    const current = parseInt(localStorage.getItem(key) ?? '3', 10);
    localStorage.setItem(key, String(current + delta));
  }

  suggestTrips(preferences: string, duration?: number, budget?: string): Observable<SuggestTripsResponse> {
    if (this.useMocks) {
      return of({
        options: [
          { id: 1, title: 'Clásicos de Europa', summary: 'París, Roma y Barcelona en un viaje lleno de arte, historia y gastronomía.', highlights: ['París, Francia', 'Roma, Italia', 'Barcelona, España'] },
          { id: 2, title: 'Asia Oriental',       summary: 'Tokio, Kioto y Seúl: tradición y modernidad en perfecta armonía.',          highlights: ['Tokio, Japón',   'Kioto, Japón',   'Seúl, Corea del Sur'] },
        ],
      });
    }
    return this.http.post<SuggestTripsResponse>(`${this.base}/ai/suggest`, { preferences, duration, budget });
  }

  shareTrip(tripId: string): Observable<{ shareId: string }> {
    if (this.useMocks) return of({ shareId: crypto.randomUUID() });
    return this.http.post<{ shareId: string }>(`${this.base}/trips/${tripId}/share`, {});
  }

  getSharedTrip(shareId: string): Observable<SharedTrip> {
    if (this.useMocks) return of(null as unknown as SharedTrip);
    return this.http.get<SharedTrip>(`${this.base}/shared/${shareId}`);
  }

  planTrip(req: PlanTripRequest): Observable<PlanTripResponse> {
    if (this.useMocks) {
      return of({
        title:    req.selectedOption.title,
        stops:    [{ stopId: 'mock-ai-stop-paris', cityId: 'paris', checkIn: '01/07/2026', checkOut: '05/07/2026', selectedAttractions: [{ entryId: 'mock-ai-paris-att-0', attractionId: 'paris_0', startTime: '09:00' }] }],
        transits: [],
        // No changeInfo in mock mode — component handles undefined gracefully
      });
    }
    return this.http.post<PlanTripResponse>(
      `${this.base}/ai/plan`,
      { ...req, cityCatalog: CITY_CATALOG },
    );
  }

  getKarmaPackages(): Observable<{ packages: KarmaPackage[] }> {
    if (this.useMocks) return of({ packages: MOCK_KARMA_PACKAGES });
    return this.http.get<{ packages: KarmaPackage[] }>(`${this.base}/karma/packages`);
  }

  createKarmaOrder(packageId: string): Observable<CreateOrderResponse> {
    if (this.useMocks) return of({ orderID: `mock-${packageId}-${Date.now()}` });
    return this.http.post<CreateOrderResponse>(`${this.base}/karma/purchase/create-order`, { packageId });
  }

  captureKarmaOrder(orderID: string): Observable<CaptureOrderResponse> {
    if (this.useMocks) {
      // orderID format in mock mode: "mock-<packageId>-<timestamp>"
      const packageId = orderID.replace(/^mock-/, '').replace(/-\d+$/, '');
      const pkg = MOCK_KARMA_PACKAGES.find(p => p.id === packageId) ?? MOCK_KARMA_PACKAGES[0];
      return of({ karma: 0, karmaAdded: pkg.karma });
    }
    return this.http.post<CaptureOrderResponse>(
      `${this.base}/karma/purchase/capture-order`,
      { orderID },
    );
  }
}
