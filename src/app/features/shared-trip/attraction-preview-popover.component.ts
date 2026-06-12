import { Component, input, computed } from '@angular/core';
import { Attraction } from '../../core/models/comment.model';
import { DurationPipe } from '../../shared/pipes/duration.pipe';

@Component({
  selector: 'app-attraction-preview-popover',
  standalone: true,
  imports: [DurationPipe],
  template: `
    <div class="att-preview-card"
         role="tooltip"
         [style.left.px]="x()"
         [style.top.px]="y()">

      @if (attraction().imageUrl) {
        <img class="att-preview-img"
             [src]="attraction().imageUrl"
             [alt]="attraction().name"
             loading="lazy" />
      } @else {
        <div class="att-preview-img-fallback"
             [style.background]="attraction().bg">
          {{ attraction().icon }}
        </div>
      }

      <div class="att-preview-body">
        <span class="att-preview-type"
              [style.background]="attraction().bg">
          {{ attraction().type }}
        </span>
        <div class="att-preview-name">{{ attraction().icon }} {{ attraction().name }}</div>
        <div class="att-preview-meta">
          <span class="att-preview-stars">{{ stars() }}</span>
          <span>{{ attraction().estimatedMinutes | duration }}</span>
        </div>
      </div>

    </div>
  `,
})
export class AttractionPreviewPopoverComponent {
  readonly attraction = input.required<Attraction>();
  readonly x          = input.required<number>();
  readonly y          = input.required<number>();

  readonly stars = computed(() => {
    const r = Math.round(this.attraction().rating);
    return '★'.repeat(r) + '☆'.repeat(Math.max(0, 5 - r));
  });
}
