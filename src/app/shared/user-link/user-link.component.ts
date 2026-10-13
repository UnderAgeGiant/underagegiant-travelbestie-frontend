import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** An owner/author name that links to their public profile only when they picked a username. */
@Component({
  selector: 'tb-user-link',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@if (username()) { <a class="user-link" [routerLink]="['/u', username()]">{{ name() }}</a> } @else { {{ name() }} }`,
  styles: [`.user-link { color: inherit; font-weight: 600; text-decoration: underline; text-underline-offset: 2px; }`],
})
export class UserLinkComponent {
  readonly name = input.required<string>();
  readonly username = input<string | null | undefined>(null);
}
