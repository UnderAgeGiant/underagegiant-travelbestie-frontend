import { Component, input, output, signal, inject } from '@angular/core';
import { Attraction, Comment } from '../../../core/models/comment.model';
import { CommentModalComponent } from '../comment-modal/comment-modal.component';
import { ApiService } from '../../../core/api/api.service';

@Component({
  selector: 'app-attraction-card',
  standalone: true,
  imports: [CommentModalComponent],
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
      </div>
      <div class="att-card-bottom">
        @if (comments().length === 0) {
          <div class="no-comments">No comments yet — be the first! 💬</div>
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
              <div class="c-more">+{{ comments().length - 2 }} more</div>
            }
          </div>
        }
        <button class="add-c-btn" (click)="showModal.set(true)">💌 Add a comment</button>
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
  comments = input<Comment[]>([]);
  commentAdded = output<{ attractionId: string; comment: Omit<Comment, 'id'> }>();

  showModal = signal(false);
  private readonly api = inject(ApiService);

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
