import { Component, input, output, signal, inject, computed } from '@angular/core';
import { Attraction, Comment } from '../../../core/models/comment.model';
import { CommentModalComponent } from '../comment-modal/comment-modal.component';
import { ApiService } from '../../../core/api/api.service';
import { TripService } from '../../trip/trip.service';

@Component({
  selector: 'app-attraction-card',
  standalone: true,
  imports: [CommentModalComponent],
  styles: [`
    .plan-btn {
      display: flex; align-items: center; gap: 5px;
      padding: 5px 11px; border-radius: 99px; font-size: 11px; font-weight: 600;
      border: 1.5px solid var(--border); background: #fff; color: var(--t2);
      cursor: pointer; transition: all .18s; white-space: nowrap;
    }
    .plan-btn:hover { border-color: var(--lav-d); color: var(--lav-d); background: var(--lav); }
    .plan-btn.planned { background: var(--lav-d); color: #fff; border-color: var(--lav-d); }
    .plan-btn.planned:hover { filter: brightness(1.1); }
  `],
  template: `
    <div class="att-card">
      <div class="att-card-top">
        <div class="att-icon-wrap" [style.background]="attraction().bg">{{ attraction().icon }}</div>
        <div class="att-info">
          <div class="att-name">{{ attraction().name }}</div>
          <div class="att-type">{{ attraction().type }}</div>
          <div class="att-rating">
            <span class="stars">{{ starStr() }}</span>
            <span class="rating-val">{{ attraction().rating }}</span>
          </div>
        </div>
        <button [class]="'plan-btn' + (inPlan() ? ' planned' : '')"
                (click)="togglePlan()">
          @if (inPlan()) {
            <span>📌</span><span i18n="@@attCard.inPlan">En plan</span>
          } @else {
            <span>🔖</span><span i18n="@@attCard.addToPlan">Planificar</span>
          }
        </button>
      </div>
      <div class="att-card-bottom">
        @if (comments().length === 0) {
          <div class="no-comments" i18n="@@attCard.noComments">¡Sin comentarios aún — sé el primero! 💬</div>
        } @else {
          <div class="comments-list">
            @for (c of comments().slice(-2); track $index) {
              <div class="comment-row">
                <div class="c-avatar" [style.background]="c.color">{{ c.name[0].toUpperCase() }}</div>
                <div class="c-bubble">
                  <strong>{{ c.name }} {{ '⭐'.repeat(c.rating) }} · {{ c.date }}</strong>
                  {{ c.text }}
                </div>
              </div>
            }
            @if (comments().length > 2) {
              <div class="c-more">+{{ comments().length - 2 }} <ng-container i18n="@@attCard.more">más</ng-container></div>
            }
          </div>
        }
        <button class="add-c-btn" (click)="showModal.set(true)" i18n="@@attCard.addComment">💌 Agregar comentario</button>
      </div>
    </div>

    @if (showModal()) {
      <app-comment-modal
        [attraction]="attraction()"
        [cityName]="cityName()"
        (close)="showModal.set(false)"
        (submitted)="onCommentSubmitted($event)" />
    }
  `,
})
export class AttractionCardComponent {
  attraction = input.required<Attraction>();
  cityName = input.required<string>();
  cityId = input.required<string>();
  comments = input<Comment[]>([]);
  commentAdded = output<{ attractionId: string; comment: Omit<Comment, 'id'> }>();

  showModal = signal(false);
  private readonly api = inject(ApiService);
  private readonly trip = inject(TripService);

  readonly inPlan = computed(() =>
    this.trip.isAttractionSelected(this.cityId(), this.attraction().id)
  );

  togglePlan(): void {
    if (this.inPlan()) {
      this.trip.removeAttraction(this.cityId(), this.attraction().id);
    } else {
      this.trip.addAttraction(this.cityId(), this.attraction().id);
    }
  }

  starStr() {
    const r = Math.round(this.attraction().rating);
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  }

  onCommentSubmitted(comment: Omit<Comment, 'id'>): void {
    this.api.addComment(comment).subscribe(() => {
      this.commentAdded.emit({ attractionId: this.attraction().id, comment });
      this.showModal.set(false);
    });
  }
}
