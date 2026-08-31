import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgStyle } from '@angular/common';
import { TouchDragGhostService } from '../../core/utils/touch-drag-ghost.service';

/**
 * Purely-visual "what am I dragging" pill for mobile touch-drag — see
 * TouchDragGhostService's doc comment for the full mechanism. Mounted once at root
 * (ShellComponent, same pattern as <app-toast>/<app-companion-mascot>) so it renders above
 * everything regardless of which AttractionCardComponent/DayTimelineComponent instance is
 * driving it.
 */
@Component({
  selector: 'app-touch-drag-ghost',
  standalone: true,
  imports: [NgStyle],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (ghostService.ghost(); as g) {
      <div class="touch-drag-ghost" [ngStyle]="{ left: g.x + 'px', top: g.y + 'px' }">
        <span class="touch-drag-ghost-icon">{{ g.icon }}</span>
        <span class="touch-drag-ghost-label">{{ g.label }}</span>
      </div>
    }
  `,
})
export class TouchDragGhostComponent {
  protected readonly ghostService = inject(TouchDragGhostService);
}
