import { Component, input, computed } from '@angular/core';
import { Attraction } from '../../core/models/comment.model';
import { DurationPipe } from '../../shared/pipes/duration.pipe';
import { formatTodayHours } from '../../core/utils/attraction-hours.util';

@Component({
    selector: 'app-attraction-preview-popover',
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

        @if (websiteDomain()) {
          <div class="att-preview-enrich">
            <span class="att-enrich-icon">🌐</span>
            <a class="att-enrich-value att-enrich-link"
               [href]="attraction().website"
               target="_blank"
               rel="noopener noreferrer">{{ websiteDomain() }}</a>
          </div>
        }

        @if (todayHours()) {
          <div class="att-preview-enrich">
            <span class="att-enrich-icon">🕐</span>
            <span class="att-enrich-value">{{ todayHours() }}</span>
          </div>
        }

        @if (ticketSummary()) {
          <div class="att-preview-enrich">
            <span class="att-enrich-icon">🎟️</span>
            <span class="att-enrich-value">{{ ticketSummary() }}</span>
          </div>
        }
      </div>

    </div>
  `
})
export class AttractionPreviewPopoverComponent {
  readonly attraction = input.required<Attraction>();
  readonly x          = input.required<number>();
  readonly y          = input.required<number>();

  readonly stars = computed(() => {
    const r = Math.round(this.attraction().rating);
    return '★'.repeat(r) + '☆'.repeat(Math.max(0, 5 - r));
  });

  readonly websiteDomain = computed(() => {
    const url = this.attraction().website;
    if (!url) return null;
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return null; }
  });

  readonly todayHours = computed(() => formatTodayHours(this.attraction().schedule));

  readonly ticketSummary = computed((): string | null => {
    const p = this.attraction().ticketPrices;
    if (!p) return null;
    if (p.free) return 'Entrada gratuita';
    const parts: string[] = [];
    if (p.adult)  parts.push(`Adulto ${p.adult}`);
    if (p.child)  parts.push(`Niño ${p.child}`);
    if (p.senior) parts.push(`Adulto mayor ${p.senior}`);
    if (p.notes && !parts.length) return p.notes;
    return parts.join(' · ') || null;
  });
}
