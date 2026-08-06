import { Component, OnInit, OnDestroy, output, ChangeDetectionStrategy } from '@angular/core';

const REMINDER_DISMISS_MS = 8000;

@Component({
  selector: 'app-autosave-reminder-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    .autosave-reminder-banner {
      position: fixed; top: 0; left: 0; right: 0; z-index: 500;
      display: flex; align-items: center; justify-content: center; gap: 12px;
      padding: 10px 20px; background: oklch(88% 0.15 85); color: oklch(30% 0.08 85);
      font-size: 13px; font-weight: 500; text-align: center; line-height: 1.4;
      box-shadow: 0 2px 10px oklch(0% 0 0/.12);
      animation: reminderSlideDown .25s ease;
    }
    .autosave-reminder-close {
      background: none; border: none; cursor: pointer; font-size: 15px;
      color: inherit; opacity: .7; flex-shrink: 0;
    }
    .autosave-reminder-close:hover { opacity: 1; }
    @keyframes reminderSlideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }
  `],
  template: `
    <div class="autosave-reminder-banner" role="status">
      <span>⚠️ <ng-container i18n="@@autosave.reminderMessage">Recuerda grabar tus avances en el plan y considera que este es un plan colaborativo por lo cual asegurate de estar sincronizados con tus amigos.</ng-container></span>
      <button type="button" class="autosave-reminder-close" (click)="dismiss.emit()"
              i18n-aria-label="@@autosave.reminderDismiss" aria-label="Cerrar">✕</button>
    </div>
  `,
})
export class AutosaveReminderBannerComponent implements OnInit, OnDestroy {
  dismiss = output<void>();
  private timer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.timer = setTimeout(() => this.dismiss.emit(), REMINDER_DISMISS_MS);
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer);
  }
}
