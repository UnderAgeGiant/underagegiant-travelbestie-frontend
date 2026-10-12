import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { isUsernameFormatValid } from '../../../core/social/username.util';

@Component({
  selector: 'tb-username-edit',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button class="pref-accordion-hd" type="button" (click)="toggle()">
      <span style="font-size:17px">🪪</span>
      <div style="flex:1;text-align:left">
        <div class="pref-accordion-title" i18n="@@profile.usernameTitle">Nombre de usuario</div>
        @if (!open()) {
          <div class="pref-accordion-sub">{{ current() ? '@' + current() : noneLabel }}</div>
        }
      </div>
      @if (saved()) { <span class="pref-accordion-check">✓</span> }
      @else { <span class="pref-accordion-chevron">{{ open() ? '▴' : '▾' }}</span> }
    </button>
    @if (open()) {
      <div class="pref-accordion-bd">
        <p class="pref-accordion-sub" style="margin:0 0 10px" i18n="@@profile.usernameHelp">Con un nombre de usuario tienes un perfil público y otros viajeros pueden seguirte. Puedes cambiarlo, pero no eliminarlo.</p>
        <div class="form-group" style="margin-bottom:8px">
          <input class="form-input" maxlength="50" autocomplete="off" spellcheck="false" i18n-placeholder="@@profile.usernamePlaceholder" placeholder="tu_usuario"
                 [value]="draft()" (input)="onInput($any($event.target).value)" />
        </div>
        @if (draft() && !valid()) {
          <div class="pref-error" i18n="@@profile.usernameFormat">De 3 a 50 caracteres: letras minúsculas, números, _ y . (sin empezar ni terminar con punto).</div>
        }
        @switch (errorKind()) {
          @case ('taken')      { <div class="pref-error" i18n="@@profile.usernameTaken">Ese nombre ya está en uso.</div> }
          @case ('notAllowed') { <div class="pref-error" i18n="@@profile.usernameNotAllowed">Ese nombre no está permitido.</div> }
          @case ('unknown')    { <div class="pref-error" i18n="@@profile.usernameError">No se pudo guardar. Intenta de nuevo.</div> }
        }
        <button class="btn-pill btn-primary" type="button" style="width:100%;justify-content:center"
                [disabled]="loading() || !valid() || draft() === current()" (click)="save()" i18n="@@profile.usernameSave">Guardar nombre de usuario</button>
        @if (current()) {
          <a class="btn-pill btn-outline" style="width:100%;justify-content:center;margin-top:8px" [routerLink]="['/u', current()]" i18n="@@profile.viewPublicProfile">Ver mi perfil público</a>
        }
      </div>
    }
  `,
})
export class UsernameEditComponent {
  private readonly auth = inject(AuthService);

  readonly current = computed(() => this.auth.currentUser()?.username ?? null);
  readonly open = signal(false);
  readonly draft = signal(this.current() ?? '');
  readonly loading = signal(false);
  readonly saved = signal(false);
  readonly errorKind = signal<'taken' | 'notAllowed' | 'unknown' | null>(null);
  readonly valid = computed(() => isUsernameFormatValid(this.draft()));
  readonly noneLabel = $localize`:@@profile.usernameNone:Sin perfil público`;

  toggle(): void { this.open.update(o => !o); this.errorKind.set(null); this.draft.set(this.current() ?? ''); }

  onInput(v: string): void { this.draft.set(v.trim().toLowerCase()); this.errorKind.set(null); }

  save(): void {
    if (!this.valid()) return;
    this.errorKind.set(null);
    this.loading.set(true);
    this.auth.updateProfile({ username: this.draft() }).subscribe({
      next: () => { this.loading.set(false); this.saved.set(true); setTimeout(() => this.saved.set(false), 2500); },
      error: (e: { code?: string }) => {
        this.loading.set(false);
        this.errorKind.set(e?.code === 'CONFLICT' ? 'taken' : e?.code === 'BAD_REQUEST' ? 'notAllowed' : 'unknown');
      },
    });
  }
}
