import {
  Component, Input, output, AfterViewInit, OnDestroy,
  ViewChild, ElementRef, ChangeDetectionStrategy
} from '@angular/core';
import flatpickr from 'flatpickr';

@Component({
  selector: 'app-time-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <input #el class="form-input"
           i18n-placeholder="@@timePicker.placeholder" placeholder="hh:mm"
           readonly />
  `,
})
export class TimePickerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('el') private el!: ElementRef<HTMLInputElement>;

  @Input() initialTime = '';

  timeChange = output<string>();

  private fp?: flatpickr.Instance;

  ngAfterViewInit() {
    const parseInitial = (s: string): Date | undefined => {
      const [hh, mm] = s.split(':').map(Number);
      if (Number.isNaN(hh) || Number.isNaN(mm)) return undefined;
      const d = new Date();
      d.setHours(hh, mm, 0, 0);
      return d;
    };

    // Same custom positioner as DateRangeComponent (see makePosition there) — flatpickr's
    // default sums children.offsetHeight (can be 0 on first open inside a fixed modal) and
    // uses body.offsetWidth (unreliable on mobile).
    const position: flatpickr.Options.Options['position'] = (self, posEl) => {
      const el   = (posEl ?? self.element) as HTMLElement;
      const b    = el.getBoundingClientRect();
      const calW = self.calendarContainer.offsetWidth  || 200;
      const calH = self.calendarContainer.offsetHeight || 200;
      const MARGIN = 8;

      const left  = Math.max(MARGIN, Math.min(b.left, window.innerWidth - calW - MARGIN));
      const above = window.innerHeight - b.bottom < calH + 4;
      const top   = window.pageYOffset + (above ? b.top - calH - 2 : b.bottom + 2);

      const c = self.calendarContainer;
      c.classList.toggle('arrowTop',    !above);
      c.classList.toggle('arrowBottom',  above);
      c.style.top   = `${top}px`;
      c.style.left  = `${left}px`;
      c.style.right = 'auto';
    };

    this.fp = flatpickr(this.el.nativeElement, {
      enableTime:    true,
      noCalendar:    true,
      dateFormat:    'H:i',
      time_24hr:     true,
      disableMobile: true,
      defaultDate:   parseInitial(this.initialTime),
      position,
      onChange: ([date]) => {
        if (!date) return;
        this.timeChange.emit(this.fmt(date));
      },
    }) as flatpickr.Instance;
  }

  ngOnDestroy() {
    this.fp?.destroy();
  }

  private fmt(d: Date): string {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
}
