import { Injectable } from '@angular/core';
import { TripStop, TransitLeg } from '../models/trip.model';

export interface SharedTrip {
  id:         string;
  ownerEmail: string;
  ownerName:  string;
  tripName:   string;
  createdAt:  string;
  stops:      TripStop[];
  transits:   TransitLeg[];
  planId?:    string; // reference to the SavedPlan — used to load live data
}

export interface StepComment {
  id:          string;
  tripId:      string;
  stepKey:     string;
  authorEmail: string;
  authorName:  string;
  text:        string;
  createdAt:   string;
}

const TRIPS_KEY       = 'tb_shared_trips';
const commentsKey     = (tripId: string) => `tb_step_comments_${tripId}`;
const seenStepsKey    = (email: string, tripId: string) => `tb_seen_steps_${email}_${tripId}`;

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

  getCommentCount(tripId: string): number {
    return this.allComments(tripId).length;
  }

  search(query: string): SharedTrip[] {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return this.allTrips()
      .filter(t => t.tripName.toLowerCase().includes(q) || t.ownerName.toLowerCase().includes(q))
      .slice(0, 5);
  }

  getComments(tripId: string, stepKey: string): StepComment[] {
    return this.allComments(tripId).filter(c => c.stepKey === stepKey);
  }

  addComment(comment: Omit<StepComment, 'id' | 'createdAt'>): void {
    const entry: StepComment = { ...comment, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    localStorage.setItem(commentsKey(comment.tripId), JSON.stringify([...this.allComments(comment.tripId), entry]));
  }

  hasCommentedOnStep(email: string, tripId: string, stepKey: string): boolean {
    return this.seenSteps(email, tripId).includes(stepKey);
  }

  markStepCommented(email: string, tripId: string, stepKey: string): void {
    const seen = this.seenSteps(email, tripId);
    if (!seen.includes(stepKey)) {
      localStorage.setItem(seenStepsKey(email, tripId), JSON.stringify([...seen, stepKey]));
    }
  }

  private allTrips(): SharedTrip[] {
    try { return JSON.parse(localStorage.getItem(TRIPS_KEY) ?? '[]'); } catch { return []; }
  }

  private allComments(tripId: string): StepComment[] {
    try { return JSON.parse(localStorage.getItem(commentsKey(tripId)) ?? '[]'); } catch { return []; }
  }

  private seenSteps(email: string, tripId: string): string[] {
    try { return JSON.parse(localStorage.getItem(seenStepsKey(email, tripId)) ?? '[]'); } catch { return []; }
  }
}
