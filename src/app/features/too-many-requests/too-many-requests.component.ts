import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

const clamp = (raw: string | null): number => {
  const n = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 3600) : 60;
};

@Component({
  selector: 'tb-too-many-requests',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="tmr">
      <img src="/Dog-waiting-1.png" alt="" width="180" height="180" />
      <h1 i18n="@@tooMany.title">¡Guau, cuántas visitas!</h1>
      <p i18n="@@tooMany.body">Miel necesita un respiro. Vuelve a intentarlo en unos segundos.</p>
      @if (seconds() > 0) { <p class="tmr-count">{{ seconds() }} s</p> }
      <a class="btn-pill btn-primary" routerLink="/" i18n="@@tooMany.home">Volver al inicio</a>
    </main>
  `,
  styles: [`
    .tmr { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 12px; padding: 24px 16px; text-align: center; background: var(--cream); color: var(--t1); }
    .tmr h1 { font-family: 'Cormorant Garamond', serif; font-weight: 400; font-size: 36px; line-height: 1.1; letter-spacing: -.5px; margin: 0; }
    .tmr p { color: var(--t2); margin: 0; max-width: 360px; font-size: 14px; line-height: 1.5; }
    .tmr-count { font-variant-numeric: tabular-nums; color: var(--t2); font-size: 13px; padding: 4px 12px; border-radius: 99px; background: rgba(255,255,255,.6); }
    .tmr img { display: block; width: 180px; max-width: 60vw; height: auto; }
    @media (max-width: 768px) {
      .tmr h1 { font-size: 30px; }
    }
  `],
})
export class TooManyRequestsComponent {
  readonly seconds = signal(clamp(inject(ActivatedRoute).snapshot.queryParamMap.get('retry')));

  constructor() {
    const id = setInterval(() => this.seconds.update(s => Math.max(0, s - 1)), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }
}
