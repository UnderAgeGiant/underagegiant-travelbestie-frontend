import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { countryCodeFromFlagEmoji } from './flag-emoji.util';

@Component({
  selector: 'app-flag-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (countryCode(); as code) {
      <img class="flag-icon"
           [style.width.px]="size()"
           [src]="'https://flagcdn.com/w40/' + code + '.jpg'"
           [alt]="alt()"
           loading="lazy" />
    } @else {
      <span class="flag-icon-fallback" [style.font-size.px]="size()">{{ flag() }}</span>
    }
  `,
})
export class FlagIconComponent {
  /** A city's `flag` field — normally a regional-indicator emoji, but the
   *  fallback glyphs used elsewhere ('📍' unknown city, '🏠' home address)
   *  are also accepted and rendered as-is via the fallback branch. */
  readonly flag = input.required<string>();
  readonly alt = input<string>('');
  /** Rendered width in px; a single w40 source image is fetched and scaled
   *  via CSS for every call site rather than requesting a matching flagcdn
   *  size variant per usage. */
  readonly size = input<number>(20);
  readonly countryCode = computed(() => countryCodeFromFlagEmoji(this.flag()));
}
