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
            <div class="cs-step-row">
              <button type="button" class="cs-step" aria-label="Quitar adulto" i18n-aria-label="@@costSettings.lessAdults"
                      [disabled]="settings().adults <= MIN_ADULTS" (click)="setAdults(settings().adults - 1)">−</button>
              <span class="cs-value" aria-live="polite">{{ settings().adults }}</span>
              <button type="button" class="cs-step" aria-label="Agregar adulto" i18n-aria-label="@@costSettings.moreAdults"
                      [disabled]="settings().adults >= MAX_TRAVELERS" (click)="setAdults(settings().adults + 1)">+</button>
            </div>
          </div>
          <div class="cs-stepper">
            <span class="cs-step-label" i18n="@@costSettings.children">Niños &lt;12</span>
            <div class="cs-step-row">
              <button type="button" class="cs-step" aria-label="Quitar niño" i18n-aria-label="@@costSettings.lessChildren"
                      [disabled]="settings().children <= 0" (click)="setChildren(settings().children - 1)">−</button>
              <span class="cs-value" aria-live="polite">{{ settings().children }}</span>
              <button type="button" class="cs-step" aria-label="Agregar niño" i18n-aria-label="@@costSettings.moreChildren"
                      [disabled]="settings().children >= MAX_TRAVELERS" (click)="setChildren(settings().children + 1)">+</button>
            </div>
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
              <ng-container i18n="@@costSettings.budgetDesc">Cama en hostal por persona · vuelos en clase económica</ng-container>
            }
            @case ('mid') {
              <ng-container i18n="@@costSettings.midDesc">Hotel 3–4★ · vuelos en clase económica</ng-container>
            }
            @case ('luxury') {
              <ng-container i18n="@@costSettings.luxuryDesc">Hotel 5★ · vuelos en business</ng-container>
            }
          }
        </span>
      </div>
    </div>
  `,
  styles: [`
    .cs { display: flex; flex-direction: column; gap: 12px; }
    .cs-field { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
    .cs-label { font-size: 12px; font-weight: 600; color: var(--t1); }
    .cs-hint, .cs-desc { font-size: 11px; color: var(--t2); line-height: 1.35; }

    .cs-steppers { display: flex; gap: 8px; }
    .cs-stepper {
      flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0;
      background: var(--cream); border: 1px solid var(--border); border-radius: 12px; padding: 6px 4px 2px;
    }
    .cs-step-label { font-size: 11px; color: var(--t2); padding-left: 8px; white-space: nowrap; }
    .cs-step-row { display: flex; align-items: center; justify-content: space-between; }
    /* 40px hit area, 26px lavender dot drawn inside it. */
    .cs-step {
      position: relative; width: 40px; height: 40px; flex: none; padding: 0; border: none; background: none;
      font: inherit; font-size: 15px; font-weight: 700; color: var(--lav-d); cursor: pointer;
      display: grid; place-items: center; isolation: isolate;
    }
    .cs-step::before {
      content: ''; position: absolute; inset: 7px; border-radius: 50%; background: var(--lav); z-index: -1;
      transition: transform .15s ease-out, background .15s;
    }
    .cs-step:hover:not(:disabled)::before { transform: scale(1.1); }
    .cs-step:active:not(:disabled)::before { transform: scale(.92); }
    .cs-step:disabled { opacity: .35; cursor: default; }
    .cs-step:focus-visible { outline: none; }
    .cs-step:focus-visible::before { box-shadow: 0 0 0 2px var(--cream), 0 0 0 4px var(--lav-d); }
    .cs-value { min-width: 20px; text-align: center; font-size: 15px; font-weight: 700; color: var(--t1); font-variant-numeric: tabular-nums; }

    .cs-seg { display: flex; border: 1px solid var(--border); border-radius: 999px; overflow: hidden; }
    .cs-seg button {
      flex: 1; min-width: 0; min-height: 40px; border: none; background: transparent; padding: 0 4px;
      color: var(--t2); font: inherit; font-size: 12px; font-weight: 500; cursor: pointer;
      transition: background .15s, color .15s;
    }
    .cs-seg button:hover:not(.on) { color: var(--lav-d); }
    .cs-seg button.on { background: var(--lav-d); color: var(--cream); font-weight: 600; }
    .cs-seg button:focus-visible { outline: 2px solid var(--lav-d); outline-offset: -4px; border-radius: 999px; }
    .cs-seg button.on:focus-visible { outline-color: var(--cream); }
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
