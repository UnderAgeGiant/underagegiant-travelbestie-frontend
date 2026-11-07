import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { stayLength } from '../../core/utils/event-datetime.util';

/** Travel-agency style "3 días - 2 noches" label; renders nothing for missing/invalid dates. */
@Component({
  selector: 'tb-stay-length',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: inline-block; white-space: nowrap; vertical-align: middle;
      font: 500 12px/1.3 'DM Sans', sans-serif; color: var(--t3);
    }
    :host:empty { display: none; }
  `],
  template: `@if (len(); as l) {<ng-container i18n="@@stayLength.days">{l.days, plural, =1 {1 día} other {{{l.days}} días}}</ng-container>@if (l.nights > 0) { - <ng-container i18n="@@stayLength.nights">{l.nights, plural, =1 {1 noche} other {{{l.nights}} noches}}</ng-container>}}`,
})
export class StayLengthComponent {
  readonly stops = input<readonly { checkIn?: string | null; checkOut?: string | null }[] | null | undefined>();
  protected readonly len = computed(() => stayLength(this.stops()));
}
