import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { PlaceComboboxComponent } from '../place-combobox/place-combobox.component';
import { ComfortLevel, CostSettings, Place } from '../../core/models/trip.model';

const MIN_ADULTS = 1;
const MAX_TRAVELERS = 20;

/** Cost estimate inputs: origin city, travelers and comfort level. Emits a new object on every change. */
@Component({
  selector: 'app-cost-settings',
  standalone: true,
  imports: [PlaceComboboxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cs">
      <div class="cs-field">
        <span class="cs-label" i18n="@@costSettings.origin">Sale desde</span>
        <app-place-combobox [value]="settings().origin" (placeChange)="setOrigin($event)" />
        <span class="cs-hint" i18n="@@costSettings.originHint">Tu ciudad del perfil · cámbiala solo para este viaje</span>
      </div>

      <div class="cs-field">
        <span class="cs-label" i18n="@@costSettings.travelers">Viajeros</span>
        <div class="cs-steppers">
          <div class="cs-stepper">
            <span class="cs-step-label" i18n="@@costSettings.adults">Adultos</span>
            <button type="button" class="cs-step" aria-label="Quitar adulto" i18n-aria-label="@@costSettings.lessAdults"
                    [disabled]="settings().adults <= MIN_ADULTS" (click)="setAdults(settings().adults - 1)">−</button>
            <span class="cs-value" aria-live="polite">{{ settings().adults }}</span>
            <button type="button" class="cs-step" aria-label="Agregar adulto" i18n-aria-label="@@costSettings.moreAdults"
                    [disabled]="settings().adults >= MAX_TRAVELERS" (click)="setAdults(settings().adults + 1)">+</button>
          </div>
          <div class="cs-stepper">
            <span class="cs-step-label" i18n="@@costSettings.children">Niños &lt;12</span>
            <button type="button" class="cs-step" aria-label="Quitar niño" i18n-aria-label="@@costSettings.lessChildren"
                    [disabled]="settings().children <= 0" (click)="setChildren(settings().children - 1)">−</button>
            <span class="cs-value" aria-live="polite">{{ settings().children }}</span>
            <button type="button" class="cs-step" aria-label="Agregar niño" i18n-aria-label="@@costSettings.moreChildren"
                    [disabled]="settings().children >= MAX_TRAVELERS" (click)="setChildren(settings().children + 1)">+</button>
          </div>
        </div>
      </div>

      <div class="cs-field">
        <span class="cs-label" i18n="@@costSettings.comfort">Estilo de viaje</span>
        <div class="cs-seg" role="group" aria-label="Estilo de viaje" i18n-aria-label="@@costSettings.comfort">
          <button type="button" data-comfort="budget" [attr.aria-pressed]="settings().comfort === 'budget'"
                  [class.on]="settings().comfort === 'budget'" (click)="setComfort('budget')"
                  i18n="@@costSettings.budget">Económico</button>
          <button type="button" data-comfort="mid" [attr.aria-pressed]="settings().comfort === 'mid'"
                  [class.on]="settings().comfort === 'mid'" (click)="setComfort('mid')"
                  i18n="@@costSettings.mid">Intermedio</button>
          <button type="button" data-comfort="luxury" [attr.aria-pressed]="settings().comfort === 'luxury'"
                  [class.on]="settings().comfort === 'luxury'" (click)="setComfort('luxury')"
                  i18n="@@costSettings.luxury">Lujo</button>
        </div>
        <span class="cs-desc">
          @switch (settings().comfort) {
            @case ('budget') {
              <ng-container i18n="@@costSettings.budgetDesc">Cama en hostal por persona · vuelos económicos</ng-container>
            }
            @case ('mid') {
              <ng-container i18n="@@costSettings.midDesc">Habitación 3–4★ · vuelos económicos</ng-container>
            }
            @case ('luxury') {
              <ng-container i18n="@@costSettings.luxuryDesc">Habitación 5★ · vuelos en business</ng-container>
            }
          }
        </span>
      </div>
    </div>
  `,
  styles: [`
    .cs { display: flex; flex-direction: column; gap: 10px; }
    .cs-field { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .cs-label { font-size: 11px; font-weight: 600; color: var(--t2); letter-spacing: .2px; }
    .cs-hint, .cs-desc { font-size: 11px; color: var(--t3); line-height: 1.35; }
    .cs-steppers { display: flex; flex-direction: column; gap: 6px; }
    .cs-stepper { display: flex; align-items: center; gap: 6px; }
    .cs-step-label { flex: 1; font-size: 12px; color: var(--t1); }
    .cs-step {
      min-width: 40px; min-height: 40px; border-radius: 10px; border: 1.5px solid var(--border);
      background: var(--cream); color: var(--t1); font: inherit; font-size: 16px; cursor: pointer;
    }
    .cs-step:disabled { opacity: .35; cursor: default; }
    .cs-value { min-width: 24px; text-align: center; font-size: 13px; font-weight: 600; color: var(--t1); }
    .cs-seg { display: flex; gap: 4px; background: var(--border); border-radius: 12px; padding: 3px; }
    .cs-seg button {
      flex: 1; min-height: 40px; border: none; border-radius: 9px; background: transparent;
      color: var(--t2); font: inherit; font-size: 12px; font-weight: 500; cursor: pointer;
    }
    .cs-seg button.on { background: var(--cream); color: var(--t1); font-weight: 600; box-shadow: var(--sh-lg); }
  `],
})
export class CostSettingsComponent {
  readonly settings = input.required<CostSettings>();
  readonly settingsChange = output<CostSettings>();

  protected readonly MIN_ADULTS = MIN_ADULTS;
  protected readonly MAX_TRAVELERS = MAX_TRAVELERS;

  setOrigin(origin: Place | null): void {
    this.update({ origin });
  }

  setAdults(n: number): void {
    this.update({ adults: clamp(n, MIN_ADULTS, MAX_TRAVELERS) });
  }

  setChildren(n: number): void {
    this.update({ children: clamp(n, 0, MAX_TRAVELERS) });
  }

  setComfort(comfort: ComfortLevel): void {
    this.update({ comfort });
  }

  private update(patch: Partial<CostSettings>): void {
    this.settingsChange.emit({ ...this.settings(), ...patch });
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
