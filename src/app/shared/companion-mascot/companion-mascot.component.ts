import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CompanionSuggestionService } from '../../core/ai/companion-suggestion.service';
import { findCuratedAttraction } from '../../data/attractions.data';

// Closes only via the ✕ button or the "No, gracias"/"Agregar" actions — there is no
// backdrop and no outside-click handler, so clicking anywhere else on the page never
// dismisses it (same "only an explicit close" pattern as CitySuggestCloudComponent).
// The bubble also has no auto-dismiss timer: it stays until the user closes it.
@Component({
  selector: 'app-companion-mascot',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (companion.state() === 'sniffing') {
      <div class="companion-roam">
        <img class="companion-dog is-sniffing" src="/sniffing-back-dog.png" alt="Asistente Miel" draggable="false" />
      </div>
    } @else if (companion.state() === 'suggesting' && suggestionView(); as v) {
      <div class="companion-mascot">
        <img class="companion-dog is-suggesting" src="/small-black-dog.png" alt="Asistente Miel" draggable="false" />
        <div class="companion-bubble">
          <button type="button" class="companion-dismiss-x" (click)="companion.dismiss()"
                  i18n-aria-label="@@companion.dismissAria" aria-label="Cerrar">✕</button>
          <p class="companion-bubble-intro" i18n="@@companion.suggestIntro">
            Olí que agregaste la atracción {{ v.addedName }} el día {{ v.addedDate }} a la hora {{ v.addedTime }}. La siguiente atracción es muy popular junto con lo que seleccionaste:
          </p>
          <div class="companion-bubble-msg">
            <span class="companion-bubble-icon">{{ v.icon }}</span>
            <div>
              <span class="companion-bubble-name">{{ v.name }}</span>
              <span class="companion-bubble-time">{{ v.date }} · {{ v.startTime }}–{{ v.endTime }}</span>
              <p class="companion-bubble-reason">{{ v.reason }}</p>
            </div>
          </div>
          <div class="companion-bubble-actions">
            <button type="button" class="btn-pill btn-outline" (click)="companion.dismiss()"
                    i18n="@@companion.dismissBtn">No, gracias</button>
            <button type="button" class="btn-pill btn-primary companion-accept-btn" (click)="companion.accept()"
                    i18n="@@companion.addBtn">➕ Agregar</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class CompanionMascotComponent {
  protected readonly companion = inject(CompanionSuggestionService);

  protected readonly suggestionView = computed(() => {
    const suggestion = this.companion.suggestion();
    const cityId     = this.companion.cityId();
    const added      = this.companion.addedAttractionInfo();
    if (!suggestion || !cityId) return null;
    const attraction = findCuratedAttraction(cityId, suggestion.attractionId);
    return {
      addedName: added?.name ?? '',
      addedDate: added?.date ?? '',
      addedTime: added?.time ?? '',
      name:      attraction?.name ?? suggestion.attractionId,
      icon:      attraction?.icon ?? '📍',
      date:      suggestion.date,
      startTime: suggestion.startTime,
      endTime:   suggestion.endTime,
      reason:    suggestion.reason,
    };
  });
}
