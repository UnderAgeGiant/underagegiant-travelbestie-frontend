import { Component, output, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-comment-similar-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="modal-backdrop" (click)="dismiss.emit()">
      <div class="modal">
        <div class="modal-head"
             style="background:linear-gradient(135deg,var(--peach),var(--lav));text-align:center">
          <div style="font-size:36px;margin-bottom:8px">✏️</div>
          <div class="modal-title"
               i18n="@@commentSimilar.title">Reformula tu comentario</div>
        </div>
        <div class="modal-body" style="text-align:center;padding:24px 28px">
          <p style="font-size:14px;color:var(--t2);line-height:1.7;margin:0"
             i18n="@@commentSimilar.body">
            Tu comentario es muy similar al anterior. Reformúlalo y ayuda a los demás
            a mejorar sus planes de viajes.
          </p>
        </div>
        <div class="modal-foot">
          <button class="btn-pill btn-primary"
                  style="flex:1;justify-content:center"
                  (click)="dismiss.emit()"
                  i18n="@@commentSimilar.dismiss">Entendido</button>
        </div>
      </div>
    </div>
  `,
})
export class CommentSimilarModalComponent {
  dismiss = output<void>();
}
