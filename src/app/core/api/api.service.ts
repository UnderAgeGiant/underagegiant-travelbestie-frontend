import { Injectable, inject, Inject, Optional } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Trip, FavoritedTrip, Collaborator, PendingCollaboratorInvite } from '../models/trip.model';
import { Comment, StepComment, StepCommentAddResult } from '../models/comment.model';
import { PlanTripRequest, PlanTripResponse, SuggestTripsResponse, CityCatalog, CatalogEntry, SuggestCityAttractionsResponse, SuggestionScheduleEntry, SuggestionDeparture, CompanionSuggestion, CompanionStatusResponse } from '../models/ai.model';
import { KarmaPackage, CreateOrderResponse, CaptureOrderResponse } from '../models/karma-purchase.model';
import { SharedTrip, SharedTripsService } from '../shared-trips/shared-trips.service';
import { FeaturedTrip, AppStats } from '../models/featured-trip.model';
import { AppNotification, NotificationStatus } from '../models/notification.model';
import { HighlightType, HighlightStatus } from '../models/highlight.model';
import { MOCK_TRIPS } from '../../mock/trips.mock';
import { MOCK_COMMENTS } from '../../mock/comments.mock';
import { AttractionCatalogService } from '../ai/attraction-catalog.service';
import { AnonymousIdService } from '../anonymous-id/anonymous-id.service';

const MOCK_KARMA_PACKAGES: KarmaPackage[] = [
  { id: 'karma_10',  karma: 10,  price: '0.99', currency: 'USD', label: '10 Karma'  },
  { id: 'karma_25',  karma: 25,  price: '1.99', currency: 'USD', label: '25 Karma'  },
  { id: 'karma_50',  karma: 50,  price: '3.99', currency: 'USD', label: '50 Karma'  },
  { id: 'karma_100', karma: 100, price: '6.99', currency: 'USD', label: '100 Karma' },
];

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly sharedTripsService = inject(SharedTripsService);
  private readonly catalog = inject(AttractionCatalogService);
  private readonly anonymousId = inject(AnonymousIdService);

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

  getCommentsBatch(attractionIds: string[]): Observable<Record<string, Comment[]>> {
    if (this.useMocks) {
      const result: Record<string, Comment[]> = {};
      for (const id of attractionIds) result[id] = MOCK_COMMENTS[id] ?? [];
      return of(result);
    }
    return this.http.get<Record<string, Comment[]>>(
      `${this.base}/comments?ids=${attractionIds.join(',')}`,
    );
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
      const karma = stored !== null ? parseInt(stored, 10) : 10;
      if (stored === null) localStorage.setItem(key, '10');
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
    ticketRequiredIds: string[],
  ): Observable<Blob> {
    if (this.useMocks) return of(new Blob());
    return this.http.post(
      `${this.base}/trips/${id}/itinerary`,
      { cityNames, attractionNames, ticketRequiredIds },
      { responseType: 'blob' },
    );
  }

  // Mock only — karma mutations happen server-side in real mode as a side effect
  // of POST /trips and POST /comments. No PATCH /karma endpoint exists.
  updateKarmaMock(email: string, delta: number): void {
    const key = `tb_karma_${email}`;
    const current = parseInt(localStorage.getItem(key) ?? '10', 10);
    localStorage.setItem(key, String(current + delta));
  }

  suggestTrips(preferences: string, duration?: number, budget?: string): Observable<SuggestTripsResponse> {
    if (this.useMocks) {
      return of({
        options: [
          { id: 1, title: 'Clásicos de Europa', summary: 'París, Roma y Barcelona en un viaje lleno de arte, historia y gastronomía.', highlights: ['París, Francia', 'Roma, Italia', 'Barcelona, España'], cityIds: ['paris', 'rome', 'barcelona'] },
          { id: 2, title: 'Asia Oriental',       summary: 'Tokio, Kioto y Seúl: tradición y modernidad en perfecta armonía.',          highlights: ['Tokio, Japón',   'Kioto, Japón',   'Seúl, Corea del Sur'], cityIds: ['tokyo', 'kyoto', 'seoul'] },
        ],
      });
    }
    return from(this.catalog.getCityIndex()).pipe(
      switchMap(cityIndex => this.http.post<SuggestTripsResponse>(`${this.base}/ai/suggest`, { preferences, duration, budget, cityIndex })),
    );
  }

  shareTrip(tripId: string): Observable<{ shareId: string }> {
    if (this.useMocks) return of({ shareId: crypto.randomUUID() });
    return this.http.post<{ shareId: string }>(`${this.base}/trips/${tripId}/share`, {});
  }

  getSharedTrip(shareId: string): Observable<SharedTrip> {
    if (this.useMocks) {
      const trip = this.sharedTripsService.getTrip(shareId);
      return trip ? of(trip) : new Observable(s => s.error({ status: 404 }));
    }
    return this.http.get<SharedTrip>(`${this.base}/shared/${shareId}`);
  }

  getStepComments(shareId: string): Observable<Record<string, StepComment[]>> {
    if (this.useMocks) return of({});
    return this.http.get<Record<string, StepComment[]>>(
      `${this.base}/shared/${shareId}/comments`,
    );
  }

  addStepComment(shareId: string, stepKey: string, text: string): Observable<StepCommentAddResult> {
    if (this.useMocks) {
      const comment: StepComment = {
        id: `mock-${Date.now()}`, stepKey, authorName: 'Tú',
        text, createdAt: new Date().toISOString(),
      };
      return of({ comment, karmaAwarded: false });
    }
    return this.http.post<StepCommentAddResult>(
      `${this.base}/shared/${shareId}/comments/${encodeURIComponent(stepKey)}`,
      { text },
    );
  }

  searchSharedTrips(query: string): Observable<SharedTrip[]> {
    if (this.useMocks) return of(this.sharedTripsService.search(query));
    return this.http.get<SharedTrip[]>(`${this.base}/shared?q=${encodeURIComponent(query)}`);
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
    // Only the selected option's own cities are sent — not the whole WORLD_CITIES
    // catalog. Missing cityIds (older session, or the model omitted them) degrade
    // to no catalog at all; the backend's own "unlisted city" fallback covers it.
    const cityIds = req.selectedOption.cityIds;
    const catalog$: Observable<CityCatalog | undefined> = cityIds && cityIds.length > 0
      ? from(this.catalog.getCityCatalog(cityIds))
      : of(undefined);

    return catalog$.pipe(
      switchMap(cityCatalog => this.http.post<PlanTripResponse>(
        `${this.base}/ai/plan`,
        { ...req, cityCatalog },
      )),
    );
  }

  suggestCityAttractions(
    cityId: string,
    checkIn: string,
    checkOut: string,
    existingAttractionIds: string[],
    cityCatalog: CatalogEntry[],
    isFollowUp = false,
    existingSchedule: SuggestionScheduleEntry[] = [],
    departureTimes: SuggestionDeparture[] = [],
  ): Observable<SuggestCityAttractionsResponse> {
    if (this.useMocks) {
      const candidates = cityCatalog.filter(c => !existingAttractionIds.includes(c.id)).slice(0, 3);
      const reasons = [
        'Ideal para complementar tu día en la ciudad.',
        'Una parada corta que no te sacará mucho de tu ruta.',
        'Muy bien evaluada por otros viajeros.',
      ];
      return of({
        suggestions: candidates.map((c, i) => ({
          attractionId: c.id,
          date: checkIn,
          startTime: `${String(10 + i * 2).padStart(2, '0')}:00`,
          endTime:   `${String(11 + i * 2).padStart(2, '0')}:00`,
          reason: reasons[i] ?? 'Una gran opción para tu itinerario.',
        })),
      });
    }
    return this.http.post<SuggestCityAttractionsResponse>(`${this.base}/ai/suggest-attractions`, {
      cityId, checkIn, checkOut, existingAttractionIds, cityCatalog, isFollowUp, existingSchedule, departureTimes,
    });
  }

  suggestCompanion(
    cityId: string,
    addedAttractionId: string,
    checkIn: string,
    checkOut: string,
    existingAttractionIds: string[],
    cityCatalog: CatalogEntry[],
    existingSchedule: SuggestionScheduleEntry[] = [],
    departureTimes: SuggestionDeparture[] = [],
  ): Observable<CompanionSuggestion | null> {
    if (this.useMocks) {
      const candidates = cityCatalog.filter(c => c.id !== addedAttractionId && !existingAttractionIds.includes(c.id));
      if (candidates.length === 0 || Math.random() > 0.3) return of(null);
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      return of({
        attractionId: pick.id,
        date: checkIn,
        startTime: '11:00',
        endTime: '12:00',
        reason: 'Muchos viajeros visitan esto justo después.',
      });
    }
    return this.http.post<CompanionSuggestion | null>(`${this.base}/ai/suggest-companion`, {
      cityId, addedAttractionId, checkIn, checkOut, existingAttractionIds, cityCatalog, existingSchedule, departureTimes,
    });
  }

  boostCompanion(): Observable<CompanionStatusResponse> {
    if (this.useMocks) return of({ boosted: true, secondsRemaining: 86400 });
    return this.http.post<CompanionStatusResponse>(`${this.base}/companion/boost`, {});
  }

  getCompanionStatus(): Observable<CompanionStatusResponse> {
    if (this.useMocks) return of({ boosted: false, secondsRemaining: 0 });
    return this.http.get<CompanionStatusResponse>(`${this.base}/companion/status`);
  }

  getKarmaPackages(): Observable<{ packages: KarmaPackage[] }> {
    if (this.useMocks) return of({ packages: MOCK_KARMA_PACKAGES });
    return this.http.get<{ packages: KarmaPackage[] }>(`${this.base}/karma/packages`);
  }

  createKarmaOrder(packageId: string): Observable<CreateOrderResponse> {
    if (this.useMocks) return of({ orderID: `mock-${packageId}-${Date.now()}` });
    return this.http.post<CreateOrderResponse>(`${this.base}/karma/purchase/create-order`, { packageId });
  }

  cloneSharedTrip(shareId: string): Observable<Trip> {
    if (this.useMocks) {
      return of({
        id: crypto.randomUUID(), title: 'Copy of Mock Trip',
        stops: [], transits: [], ownerId: 'mock',
        createdAt: new Date().toISOString(),
      } as Trip);
    }
    return this.http.post<Trip>(`${this.base}/shared/${shareId}/clone`, {});
  }

  cloneOwnTrip(tripId: string): Observable<Trip> {
    if (this.useMocks) {
      return of({
        id: crypto.randomUUID(), title: 'Copy of Mock Trip',
        stops: [], transits: [], ownerId: 'mock',
        createdAt: new Date().toISOString(),
      } as Trip);
    }
    return this.http.post<Trip>(`${this.base}/trips/${tripId}/clone`, {});
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

  private readonly FEATURED_CACHE_KEY = 'tb:featured:cache';
  private readonly FEATURED_CACHE_TTL = 86_400_000; // 24 h in ms

  getFeatured(): Observable<FeaturedTrip[]> {
    if (this.useMocks) return of([]);

    try {
      const raw = localStorage.getItem(this.FEATURED_CACHE_KEY);
      if (raw) {
        const { data, ts } = JSON.parse(raw) as { data: FeaturedTrip[]; ts: number };
        if (Date.now() - ts < this.FEATURED_CACHE_TTL) return of(data);
      }
    } catch { /* non-fatal — fall through to network */ }

    return this.http.get<FeaturedTrip[]>(`${this.base}/featured`).pipe(
      tap(data => {
        try {
          localStorage.setItem(
            this.FEATURED_CACHE_KEY,
            JSON.stringify({ data, ts: Date.now() }),
          );
        } catch { /* non-fatal — storage may be full or blocked */ }
      }),
    );
  }

  private readonly STATS_CACHE_KEY = 'tb:stats:cache';
  private readonly STATS_CACHE_TTL = 86_400_000; // 24 h in ms

  getStats(): Observable<AppStats> {
    if (this.useMocks) return of({ cities: 120, users: 1200, plans: 4800 });
    try {
      const raw = localStorage.getItem(this.STATS_CACHE_KEY);
      if (raw) {
        const { data, ts } = JSON.parse(raw) as { data: AppStats; ts: number };
        if (Date.now() - ts < this.STATS_CACHE_TTL) return of(data);
      }
    } catch { /* non-fatal — fall through to network */ }
    return this.http.get<AppStats>(`${this.base}/stats`).pipe(
      tap(data => {
        try {
          localStorage.setItem(this.STATS_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
        } catch { /* non-fatal */ }
      }),
    );
  }

  toggleFavorite(shareId: string): Observable<{ favorited: boolean; favoriteCount: number }> {
    if (this.useMocks) return of({ favorited: true, favoriteCount: 1 });
    return this.http.post<{ favorited: boolean; favoriteCount: number }>(
      `${this.base}/shared/${shareId}/favorite`,
      {},
    );
  }

  getFavorites(): Observable<FavoritedTrip[]> {
    if (this.useMocks) return of([]);
    return this.http.get<FavoritedTrip[]>(`${this.base}/favorites`);
  }

  getHighlightStatus(type: HighlightType): Observable<HighlightStatus> {
    if (this.useMocks) return of({ seen: false });
    return this.http.get<HighlightStatus>(`${this.base}/highlights/${type}/status`, {
      headers: this.anonymousIdHeaders(),
    });
  }

  markHighlightSeen(type: HighlightType): Observable<void> {
    if (this.useMocks) return of(undefined);
    return this.http.post<void>(`${this.base}/highlights/${type}/seen`, {}, {
      headers: this.anonymousIdHeaders(),
    });
  }

  markHighlightDismissed(type: HighlightType): Observable<void> {
    if (this.useMocks) return of(undefined);
    return this.http.post<void>(`${this.base}/highlights/${type}/dismiss`, {}, {
      headers: this.anonymousIdHeaders(),
    });
  }

  // Lets the backend recognize a returning anonymous (not-yet-logged-in) visitor
  // individually instead of lumping everyone behind the same IP/NAT together. Harmless to
  // send while logged in too — the backend prioritizes the authenticated user id over this.
  private anonymousIdHeaders(): HttpHeaders {
    return new HttpHeaders({ 'X-Anonymous-Id': this.anonymousId.get() });
  }

  getNotifications(): Observable<{ notifications: AppNotification[] }> {
    if (this.useMocks) return of({ notifications: [] });
    return this.http.get<{ notifications: AppNotification[] }>(`${this.base}/notifications`);
  }

  getNotificationStatus(): Observable<NotificationStatus> {
    if (this.useMocks) return of({ count: 0, muted: false });
    return this.http.get<NotificationStatus>(`${this.base}/notifications/status`);
  }

  markNotificationsRead(): Observable<void> {
    if (this.useMocks) return of(undefined);
    return this.http.post<void>(`${this.base}/notifications/read`, {});
  }

  setNotificationsMuted(muted: boolean): Observable<{ muted: boolean }> {
    if (this.useMocks) return of({ muted });
    return this.http.put<{ muted: boolean }>(`${this.base}/notifications/mute`, { muted });
  }

  inviteCollaborator(tripId: string, email: string): Observable<Collaborator> {
    if (this.useMocks) {
      return of({ userId: `mock-user-${Date.now()}`, name: 'Mock Collaborator', email, invitedAt: new Date().toISOString(), acceptedAt: null });
    }
    return this.http.post<Collaborator>(`${this.base}/trips/${tripId}/collaborators`, { email });
  }

  acceptCollaboratorInvite(tripId: string): Observable<void> {
    if (this.useMocks) return of(undefined);
    return this.http.post<void>(`${this.base}/trips/${tripId}/collaborators/accept`, {});
  }

  removeCollaborator(tripId: string, userId: string): Observable<void> {
    if (this.useMocks) return of(undefined);
    return this.http.delete<void>(`${this.base}/trips/${tripId}/collaborators/${userId}`);
  }

  getCollaborators(tripId: string): Observable<Collaborator[]> {
    if (this.useMocks) return of([]);
    return this.http.get<Collaborator[]>(`${this.base}/trips/${tripId}/collaborators`);
  }

  getPendingInvites(): Observable<PendingCollaboratorInvite[]> {
    if (this.useMocks) return of([]);
    return this.http.get<PendingCollaboratorInvite[]>(`${this.base}/trips/invites`);
  }
}
