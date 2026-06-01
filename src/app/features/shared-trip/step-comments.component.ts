import { Component, inject, input, output, signal, OnInit } from '@angular/core';
import { SharedTripsService, StepComment } from '../../core/shared-trips/shared-trips.service';
import { AuthService } from '../../core/auth/auth.service';
import { KarmaService } from '../../core/karma/karma.service';

@Component({
  selector: 'app-step-comments',
  standalone: true,
  template: `
    <div class="step-comments">
      @for (c of localComments(); track c.id) {
        <div class="step-comment">
          <div class="step-comment-avatar">{{ initials(c.authorName) }}</div>
          <div class="step-comment-body">
            <div class="step-comment-meta">
              <span class="step-comment-author">{{ c.authorName }}</span>
              <span class="step-comment-date">{{ fmtDate(c.createdAt) }}</span>
            </div>
            <div class="step-comment-text">{{ c.text }}</div>
          </div>
        </div>
      }

      @if (auth.isLoggedIn()) {
        <div class="step-comment-form" (focusout)="onFormFocusOut($event)">
          <input class="step-comment-input"
                 [value]="newText()"
                 (input)="newText.set($any($event.target).value)"
                 placeholder="Agrega tu comentario…"
                 (keydown.enter)="submit()" />
          @let remaining = 50 - newText().trim().length;
          @if (remaining > 0 && newText().trim().length > 0) {
            <span class="step-comment-hint">{{ remaining }} más</span>
          }
          <button class="btn-pill btn-primary"
                  style="padding:5px 14px;font-size:11px;flex-shrink:0"
                  [disabled]="newText().trim().length < 50"
                  [style.opacity]="newText().trim().length >= 50 ? 1 : 0.45"
                  (click)="submit()">Comentar</button>
          @if (karmaFlash()) {
            <span class="karma-flash">+1 ⭐</span>
          }
        </div>
      } @else {
        <div class="step-comment-login">Inicia sesión para comentar</div>
      }
    </div>
  `,
})
export class StepCommentsComponent implements OnInit {
  readonly tripId     = input.required<string>();
  readonly stepKey    = input.required<string>();
  readonly ownerEmail = input.required<string>();

  readonly auth        = inject(AuthService);
  private readonly svc   = inject(SharedTripsService);
  private readonly karma = inject(KarmaService);

  focusLost = output<void>();

  newText       = signal('');
  karmaFlash    = signal(false);
  localComments = signal<StepComment[]>([]);

  ngOnInit(): void {
    this.reload();
  }

  submit(): void {
    const text = this.newText().trim();
    const user = this.auth.currentUser();
    if (!text || text.length < 50 || !user) return;

    this.svc.addComment({
      tripId:      this.tripId(),
      stepKey:     this.stepKey(),
      authorEmail: user.email,
      authorName:  user.name,
      text,
    });

    const isOwnTrip   = user.email === this.ownerEmail();
    const alreadySeen = this.svc.hasCommentedOnStep(user.email, this.tripId(), this.stepKey());

    if (!isOwnTrip && !alreadySeen) {
      this.karma.gain();
      this.svc.markStepCommented(user.email, this.tripId(), this.stepKey());
      this.karmaFlash.set(true);
      setTimeout(() => this.karmaFlash.set(false), 1800);
    }

    this.newText.set('');
    this.reload();
  }

  onFormFocusOut(event: FocusEvent): void {
    const related = event.relatedTarget as Node | null;
    if (!related || !(event.currentTarget as HTMLElement).contains(related)) {
      this.focusLost.emit();
    }
  }

  private reload(): void {
    this.localComments.set(this.svc.getComments(this.tripId(), this.stepKey()));
  }

  initials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  fmtDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
    } catch { return ''; }
  }
}
