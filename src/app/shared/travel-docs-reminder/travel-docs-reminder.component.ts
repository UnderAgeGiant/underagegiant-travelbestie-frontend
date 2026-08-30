import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TravelDocsReminderService } from '../../core/reminders/travel-docs-reminder.service';

@Component({
  selector: 'app-travel-docs-reminder',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (reminder.visible()) {
      <div class="companion-mascot travel-docs-reminder">
        <img class="companion-dog is-suggesting" src="/small-black-dog.png" alt="Asistente Miel" draggable="false" />
        <div class="companion-bubble">
          <button type="button" class="companion-dismiss-x" (click)="reminder.dismiss()"
                  i18n-aria-label="@@travelDocs.dismissAria" aria-label="Cerrar">✕</button>
          <p class="companion-bubble-intro" i18n="@@travelDocs.message">
            Recuerda verificar si necesitas visa, vacunas y/o pasaporte para los lugares que visitas.
          </p>
          <div class="companion-bubble-actions">
            <button type="button" class="btn-pill btn-primary" (click)="reminder.dismiss()"
                    i18n="@@travelDocs.dismissBtn">Entendido</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class TravelDocsReminderComponent {
  protected readonly reminder = inject(TravelDocsReminderService);
}
