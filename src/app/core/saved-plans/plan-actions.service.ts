import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ApiService } from '../api/api.service';
import { KarmaService } from '../karma/karma.service';
import { KarmaModalService } from '../karma/karma-modal.service';
import { SharedTripsService } from '../shared-trips/shared-trips.service';
import { ToastService } from '../ui/toast.service';
import { VisaRequirementService } from '../visa/visa-requirement.service';
import { TravelInfoService } from '../travel-info/travel-info.service';
import { LocaleService } from '../i18n/locale.service';
import { buildItineraryExportBody } from '../utils/itinerary-export.util';
import { ItineraryExportBody } from '../models/itinerary-export.model';
import { TripStop } from '../models/trip.model';
import { attractionsStatus, loadCityAttractions } from '../../data/attractions.data';
import { environment } from '../../../environments/environment';
import { SavedPlansService, SavedPlan } from './saved-plans.service';

/** Export and unpublish for a saved trip — shared by Mis viajes and the user panel's actions menu. */
@Injectable({ providedIn: 'root' })
export class PlanActionsService {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly karma = inject(KarmaService);
  private readonly karmaModal = inject(KarmaModalService);
  private readonly savedPlans = inject(SavedPlansService);
  private readonly sharedTrips = inject(SharedTripsService);
  private readonly toast = inject(ToastService);
  private readonly locale = inject(LocaleService);
  private readonly visaRequirement = inject(VisaRequirementService);
  private readonly travelInfo = inject(TravelInfoService);

  readonly exportingPlanId = signal<string | null>(null);
  readonly unpublishingPlanId = signal<string | null>(null);

  shareIdOf(plan: SavedPlan): string | undefined {
    if (plan.shareId) return plan.shareId;
    const email = this.auth.currentUser()?.email;
    if (!email) return undefined;
    return this.sharedTrips.getMyTrips(email).find(t => t.planId === plan.id)?.id;
  }

  private exportBody(stops: TripStop[]): ItineraryExportBody {
    return buildItineraryExportBody(stops, this.locale.current(), {
      homeIso2: this.auth.currentUser()?.countryOfResidence ?? null,
      siteUrl: environment.siteUrl,
      visa: this.visaRequirement,
      info: this.travelInfo,
    });
  }

  async exportItinerary(plan: SavedPlan): Promise<void> {
    if (environment.useMocks) {
      if (!plan.exportedAt && (this.karma.karma() ?? 0) < 1) {
        this.karmaModal.openInsufficient(1, this.karma.karma() ?? 0);
        return;
      }
      const user = this.auth.currentUser();
      if (!plan.exportedAt && user) {
        this.karma.spend('itinerary_exported', plan.id);
        this.savedPlans.markExported(user.email, plan.id);
      }
      this.toast.show($localize`:@@myTrips.excelNeedsBackend:La exportación Excel requiere el backend activo`);
      return;
    }

    this.exportingPlanId.set(plan.id);
    await loadCityAttractions(plan.stops.map(s => s.cityId));
    await this.visaRequirement.load();
    // Body needs the curated details of every stop; if a city failed to load, stop before the call so no Token is spent.
    if (plan.stops.some(s => attractionsStatus(s.cityId) === 'error')) {
      this.exportingPlanId.set(null);
      this.toast.show($localize`:@@myTrips.itineraryDownloadError:Error al descargar el itinerario`);
      return;
    }
    this.api.exportItinerary(plan.id, this.exportBody(plan.stops)).subscribe({
      next: (blob) => {
        const slug = plan.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `itinerario-${slug}.xlsx`; a.click();
        URL.revokeObjectURL(url);
        this.exportingPlanId.set(null);
        this.toast.show($localize`:@@myTrips.itineraryDownloaded:Itinerario descargado`);
        if (!plan.exportedAt) {
          const user = this.auth.currentUser();
          if (user) { this.karma.spend('itinerary_exported', plan.id); this.savedPlans.markExported(user.email, plan.id); }
        }
      },
      error: (err) => {
        this.exportingPlanId.set(null);
        if (!this.karmaModal.handleKarmaError(err)) this.toast.show($localize`:@@myTrips.itineraryDownloadError:Error al descargar el itinerario`);
      },
    });
  }

  /** Emits true when the trip is unpublished (shareId cleared), false on error. Never errors. */
  unpublish(plan: SavedPlan): Observable<boolean> {
    const email = this.auth.currentUser()?.email;
    if (!email || this.unpublishingPlanId()) return of(false);
    const sid = this.shareIdOf(plan);
    this.unpublishingPlanId.set(plan.id);
    return this.api.unshareTrip(plan.id).pipe(
      map(() => {
        if (environment.useMocks && sid) this.sharedTrips.removeShare(sid);
        this.savedPlans.clearShareId(email, plan.id);
        return true;
      }),
      catchError(() => {
        this.toast.show($localize`:@@myTrips.unpublishError:No se pudo despublicar el viaje`);
        return of(false);
      }),
      finalize(() => this.unpublishingPlanId.set(null)),
    );
  }
}
