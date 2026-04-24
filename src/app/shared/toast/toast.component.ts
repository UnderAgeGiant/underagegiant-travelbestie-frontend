import { Component, input, output, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-toast',
  standalone: true,
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
