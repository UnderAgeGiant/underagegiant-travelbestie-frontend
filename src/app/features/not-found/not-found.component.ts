import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="not-found">
      <img src="/standing-black-dog.jpeg" alt="" width="160" height="160" class="not-found-dog" />
      <h1 i18n="@@notFound.title">Esta página no existe</h1>
      <p i18n="@@notFound.body">Puede que el enlace esté roto o que la página se haya movido.</p>
      <a class="btn-pill" routerLink="/" i18n="@@notFound.home">Volver al inicio</a>
    </main>
  `,
  styles: [`
    .not-found { min-height: 100vh; display: flex; flex-direction: column; align-items: center;
                 justify-content: center; gap: 12px; padding: 24px; text-align: center; }
    .not-found h1 { font-size: 24px; font-weight: 700; color: var(--t1); margin: 0; }
    .not-found p  { font-size: 14px; color: var(--t3); margin: 0 0 8px; }
    .not-found-dog { border-radius: 50%; object-fit: cover; }
    .not-found a { text-decoration: none; }
  `],
})
export class NotFoundComponent {}
