import { Component, input, output, signal, HostListener, ElementRef, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { StepComment } from '../../core/models/comment.model';

@Component({
  selector: 'app-step-comments',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="step-comments">
      @for (c of comments(); track c.id) {
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

      @if (loggedIn()) {
        <div class="step-comment-form" (focusout)="onFormFocusOut($event)">
          <input class="step-comment-input"
                 [value]="newText()"
                 [disabled]="submitting()"
                 (input)="newText.set($any($event.target).value)"
                 placeholder="Agrega tu comentario…"
                 (keydown.enter)="submit()" />
          @let remaining = 50 - newText().trim().length;
          @if (remaining > 0 && newText().trim().length > 0) {
            <span class="step-comment-hint">{{ remaining }} más</span>
          }
          <button class="btn-pill btn-primary"
                  style="padding:5px 14px;font-size:11px;flex-shrink:0"
                  [disabled]="newText().trim().length < 50 || submitting()"
                  [style.opacity]="newText().trim().length >= 50 && !submitting() ? 1 : 0.45"
                  (click)="submit()">
            {{ submitting() ? '…' : 'Comentar' }}
          </button>
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
  comments   = input<StepComment[]>([]);
  loggedIn   = input<boolean>(false);
  submitting = input<boolean>(false);
  karmaFlash = input<boolean>(false);

  commentSubmitted = output<string>();
  focusLost        = output<void>();

  newText = signal('');

  private readonly el = inject(ElementRef);
  private _ready = false;

  ngOnInit(): void {
    setTimeout(() => { this._ready = true; });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (!this._ready || this.newText().trim()) return;
    if (!(this.el.nativeElement as HTMLElement).contains(e.target as Node)) {
      this.focusLost.emit();
    }
  }

  submit(): void {
    const text = this.newText().trim();
    if (text.length < 50 || this.submitting()) return;
    this.commentSubmitted.emit(text);
    this.newText.set('');
  }

  onFormFocusOut(event: FocusEvent): void {
    const related = event.relatedTarget as Node | null;
    if (!related || !(event.currentTarget as HTMLElement).contains(related)) {
      this.focusLost.emit();
    }
  }

  initials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  fmtDate(iso: string): string {
    try { return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }); }
    catch { return ''; }
  }
}
