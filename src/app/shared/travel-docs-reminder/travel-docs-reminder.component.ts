import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TravelDocsReminderService } from '../../core/reminders/travel-docs-reminder.service';
import { CompanionSuggestionService } from '../../core/ai/companion-suggestion.service';
import { TripService } from '../../features/trip/trip.service';
import { AuthService } from '../../core/auth/auth.service';
import { VisaRequirementService } from '../../core/visa/visa-requirement.service';
import { TravelInfoService } from '../../core/travel-info/travel-info.service';
import { WORLD_CITIES } from '../../data/cities.data';
import { buildTravelDocsSummary } from '../../core/reminders/travel-docs-summary.util';

@Component({
  selector: 'app-travel-docs-reminder',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (reminder.visible() && companion.state() === 'idle') {
      <div class="companion-mascot travel-docs-reminder">
        <img class="companion-dog is-suggesting" src="/small-black-dog.png" alt="Asistente Miel" draggable="false" />
        <div class="companion-bubble">
          <button type="button" class="companion-dismiss-x" (click)="reminder.dismiss()"
                  i18n-aria-label="@@travelDocs.dismissAria" aria-label="Cerrar">✕</button>
          <p class="companion-bubble-intro" i18n="@@travelDocs.message">
            Recuerda verificar si necesitas visa, vacunas y/o pasaporte para los lugares que visitas.
          </p>
          @if (summary().visaStops.length > 0) {
            <p class="travel-docs-detail" i18n="@@travelDocs.visaDetail">
              🛂 Necesitas revisar la visa para: {{ summary().visaStops.join(', ') }}.
            </p>
          }
          @if (summary().currencies.length > 0) {
            <p class="travel-docs-detail" i18n="@@travelDocs.currencyDetail">
              🪙 Monedas de tu viaje: {{ summary().currencies.join(', ') }}.
            </p>
          }
          @if (summary().adapterStops.length > 0) {
            <p class="travel-docs-detail" i18n="@@travelDocs.adapterDetail">
              🔌 Necesitas adaptador de enchufe para: {{ summary().adapterStops.join(', ') }}.
            </p>
          }
          <div class="companion-bubble-actions">
            <button type="button" class="btn-pill btn-primary" (click)="reminder.dismiss()"
                    i18n="@@travelDocs.dismissBtn">Entendido</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .travel-docs-detail { font-size: 12px; color: var(--t2); margin: 4px 0 0; }
  `],
})
export class TravelDocsReminderComponent {
  protected readonly reminder = inject(TravelDocsReminderService);
  protected readonly companion = inject(CompanionSuggestionService);
  private readonly trip = inject(TripService);
  private readonly auth = inject(AuthService);
  private readonly visaService = inject(VisaRequirementService);
  private readonly travelInfo = inject(TravelInfoService);

  protected readonly summary = computed(() => buildTravelDocsSummary(
    this.trip.stops(),
    this.auth.currentUser()?.countryOfResidence ?? null,
    cityId => WORLD_CITIES.find(c => c.id === cityId) ?? null,
    this.visaService,
    this.travelInfo,
  ));
}
