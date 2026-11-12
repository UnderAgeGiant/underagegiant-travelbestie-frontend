import { Component, computed, input } from '@angular/core';
import { attractionsStatus, retryCityAttractions } from '../../data/attractions.data';

/** Shows a load-failure notice with a Reintentar button for any listed city whose file failed. Renders nothing otherwise. */
@Component({
  selector: 'tb-attractions-load-error',
  template: `
    @if (failed().length) {
      <div class="badge" role="status" style="background:var(--cream);color:var(--t2);border:1px solid var(--border)">
        <span i18n="@@attractions.loadError">No pudimos cargar las atracciones.</span>
        <button type="button" class="btn-pill btn-outline" (click)="retry()" i18n="@@attractions.retry">Reintentar</button>
      </div>
    }
  `,
})
export class AttractionsLoadErrorComponent {
  readonly cityIds = input.required<readonly string[]>();

  readonly failed = computed(() => this.cityIds().filter(id => attractionsStatus(id) === 'error'));

  protected retry(): void {
    this.failed().forEach(id => retryCityAttractions(id));
  }
}
