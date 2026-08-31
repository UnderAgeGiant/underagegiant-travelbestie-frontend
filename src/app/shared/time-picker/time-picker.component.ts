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

  // A plain field would only ever be read once, in ngAfterViewInit — fine for a one-shot modal
  // (PlanTimeModalComponent creates a fresh instance every time it opens), but StopListComponent
  // embeds this in an @for loop keyed by entryId: editing the START time recomputes the END
  // time's *derived* initialTime (planned.endTime || startTime + estimatedMinutes) on every
  // render, while the END picker's own component instance stays mounted (same entryId). Without
  // this setter, that recomputed value would never reach flatpickr, leaving the displayed end
  // time silently stale after editing the start time.
  @Input() set initialTime(value: string) {
    this._initialTime = value;
    if (!this.fp) return; // not yet created — ngAfterViewInit's own defaultDate covers this
    const d = this.parseTime(value);
    // `false` = don't fire flatpickr's onChange — this is an external/derived value syncing
    // IN, not a user edit; emitting here would misreport a "user changed the time" event.
    this.fp.setDate(d ?? '', false);
  }
  get initialTime(): string { return this._initialTime; }
  private _initialTime = '';

  timeChange = output<string>();

  private fp?: flatpickr.Instance;

  private parseTime(s: string): Date | undefined {
    const [hh, mm] = s.split(':').map(Number);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return undefined;
    const d = new Date();
    d.setHours(hh, mm, 0, 0);
    return d;
  }

  ngAfterViewInit() {

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
      defaultDate:   this.parseTime(this.initialTime),
      position,
      onChange: ([date]) => {
        if (!date) return;
        this.timeChange.emit(this.fmt(date));
      },
    }) as flatpickr.Instance;

    // flatpickr only fires onChange once a typed hour/minute value is "committed"
    // (blur, Enter, or the increment arrows) — typing digits directly and clicking
    // "Confirmar" without first clicking away never emits, so the parent modal keeps
    // the stale initial time. Listen on the raw inputs too so every keystroke updates
    // the value the instant it forms a valid hh:mm.
    const emitFromInputs = () => {
      const hh = this.fp?.hourElement?.value;
      const mm = this.fp?.minuteElement?.value;
      if (hh === undefined || mm === undefined) return;
      const h = Number(hh);
      const m = Number(mm);
      if (Number.isNaN(h) || Number.isNaN(m)) return;
      // This raw `input` listener bypasses flatpickr's own commit-time clamping (which only
      // runs on blur/Enter/arrows) — without clamping here, typing e.g. "99" into the hour
      // field emits an invalid "99:mm" straight into the plan before the user ever blurs.
      const clampedH = Math.min(23, Math.max(0, h));
      const clampedM = Math.min(59, Math.max(0, m));
      this.timeChange.emit(`${String(clampedH).padStart(2, '0')}:${String(clampedM).padStart(2, '0')}`);
    };
    this.fp.hourElement?.addEventListener('input', emitFromInputs);
    this.fp.minuteElement?.addEventListener('input', emitFromInputs);
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
