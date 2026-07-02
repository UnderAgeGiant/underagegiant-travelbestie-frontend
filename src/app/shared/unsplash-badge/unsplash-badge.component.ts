import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
    selector: 'tb-unsplash-badge',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    @if (isUnsplash()) {
      <a class="unsplash-badge"
         href="https://unsplash.com"
         target="_blank"
         rel="noopener noreferrer"
         (click)="$event.stopPropagation()">Unsplash</a>
    }
  `
})
export class UnsplashBadgeComponent {
    url = input<string | null | undefined>();
    readonly isUnsplash = computed(() => !!this.url()?.includes('unsplash.com'));
}
