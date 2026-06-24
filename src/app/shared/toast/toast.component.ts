import { Component, input, output, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<div class="toast">✓ {{ message() }}</div>`,
})
export class ToastComponent implements OnInit, OnDestroy {
  message = input.required<string>();
  done = output<void>();
  private timer?: ReturnType<typeof setTimeout>;

  ngOnInit() {
    this.timer = setTimeout(() => this.done.emit(), 2400);
  }

  ngOnDestroy() {
    clearTimeout(this.timer);
  }
}
