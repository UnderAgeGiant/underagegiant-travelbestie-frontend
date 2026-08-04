import { Injectable } from '@angular/core';
import { TripStop, TransitLeg } from '../models/trip.model';
import { normalizeSearch } from '../utils/normalize-search.util';

export interface SharedTrip {
  id:              string;
  ownerEmail:      string;
  ownerName:       string;
  tripName:        string;
  createdAt:       string;
  stops:           TripStop[];
  transits:        TransitLeg[];
  planId?:         string;
  tripId?:         string;
  favoriteCount?:  number;
  isFavoritedByMe?: boolean;
}

const TRIPS_KEY = 'tb_shared_trips';

@Injectable({ providedIn: 'root' })
export class SharedTripsService {

  createShare(trip: Omit<SharedTrip, 'id' | 'createdAt'>): string {
    const id: string = crypto.randomUUID();
    const entry: SharedTrip = { ...trip, id, createdAt: new Date().toISOString() };
    localStorage.setItem(TRIPS_KEY, JSON.stringify([...this.allTrips(), entry]));
    return id;
  }

  /** Returns the shared trip, always merging the latest plan data if a planId is stored. */
  getTrip(id: string): SharedTrip | null {
    const trip = this.allTrips().find(t => t.id === id) ?? null;
    if (!trip?.planId) return trip;
    try {
      const raw = localStorage.getItem(`tb_saved_plans_${trip.ownerEmail}`);
      if (raw) {
        const plans: Array<{ id: string; name: string; stops: TripStop[]; transits?: TransitLeg[] }> = JSON.parse(raw);
        const live = plans.find(p => p.id === trip.planId);
        if (live) {
          return { ...trip, tripName: live.name, stops: live.stops, transits: live.transits ?? [] };
        }
      }
    } catch { /* fall back to snapshot */ }
    return trip;
  }

  getMyTrips(email: string): SharedTrip[] {
    return this.allTrips().filter(t => t.ownerEmail === email);
  }

  // TODO: replace with API count
  getCommentCount(_tripId: string): number {
    return 0;
  }

  search(query: string): SharedTrip[] {
    if (!query.trim()) return [];
    const q = normalizeSearch(query);
    return this.allTrips()
      .filter(t => normalizeSearch(t.tripName).includes(q) || normalizeSearch(t.ownerName).includes(q))
      .slice(0, 5);
  }

  private allTrips(): SharedTrip[] {
    try { return JSON.parse(localStorage.getItem(TRIPS_KEY) ?? '[]'); } catch { return []; }
  }
}
