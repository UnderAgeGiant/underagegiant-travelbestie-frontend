import {
  Component, output, AfterViewInit, OnDestroy,
  ViewChild, ElementRef, inject, LOCALE_ID, Input,
} from '@angular/core';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es';

@Component({
  selector: 'app-date-range',
  standalone: true,
  template: `
    <div style="display:flex;gap:10px">
      <div class="form-group" style="flex:1;margin-bottom:0">
        <label class="form-label" i18n="@@addStop.checkInLabel">Entrada</label>
        <input #inEl class="form-input"
               i18n-placeholder="@@datePicker.fromPlaceholder" placeholder="dd/mm/aaaa"
               readonly />
      </div>
      <div class="form-group" style="flex:1;margin-bottom:0">
        <label class="form-label" i18n="@@addStop.checkOutLabel">Salida</label>
        <input #outEl class="form-input"
               i18n-placeholder="@@datePicker.toPlaceholder" placeholder="dd/mm/aaaa"
               readonly />
      </div>
    </div>
  `,
})
export class DateRangeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('inEl') private inEl!: ElementRef<HTMLInputElement>;
  @ViewChild('outEl') private outEl!: ElementRef<HTMLInputElement>;

  @Input() initialCheckIn  = '';
  @Input() initialCheckOut = '';

  checkIn  = output<string>();
  checkOut = output<string>();

  private fpIn?:  flatpickr.Instance;
  private fpOut?: flatpickr.Instance;
  private readonly locale = inject(LOCALE_ID);

  ngAfterViewInit() {
    const l10n = this.locale.startsWith('es') ? Spanish : undefined;
    const base: flatpickr.Options.Options = {
      ...(l10n ? { locale: l10n } : {}),
      dateFormat: 'd/m/Y',
      disableMobile: true,
    };

    const parseInitial = (s: string): Date | undefined => {
      if (!s) return undefined;
      const [dd, mm, yyyy] = s.split('/').map(Number);
      if (!dd || !mm || !yyyy) return undefined;
      return new Date(yyyy, mm - 1, dd);
    };

    // Custom positioner: viewport-clamped horizontal + reliable above/below detection.
    // Replaces flatpickr's default which sums children.offsetHeight (can be 0 on first
    // open inside a bottom-sheet modal) and uses body.offsetWidth (unreliable on mobile).
    const makePosition =
      (alignRight: boolean): flatpickr.Options.Options['position'] =>
      (self, posEl) => {
        const el   = (posEl ?? self.element) as HTMLElement;
        const b    = el.getBoundingClientRect();
        const calW = self.calendarContainer.offsetWidth  || 307;
        const calH = self.calendarContainer.offsetHeight || 300;
        const MARGIN = 8;

        const idealLeft = alignRight ? b.right - calW : b.left;
        const left = Math.max(MARGIN, Math.min(idealLeft, window.innerWidth - calW - MARGIN));

        const above = window.innerHeight - b.bottom < calH + 4;
        const top   = window.pageYOffset + (above ? b.top - calH - 2 : b.bottom + 2);

        const c = self.calendarContainer;
        c.classList.toggle('arrowTop',    !above);
        c.classList.toggle('arrowBottom',  above);
        c.classList.toggle('arrowLeft',   !alignRight);
        c.classList.toggle('arrowRight',   alignRight);
        c.style.top   = `${top}px`;
        c.style.left  = `${left}px`;
        c.style.right = 'auto';
      };

    const checkInDefault = parseInitial(this.initialCheckIn);

    this.fpIn = flatpickr(this.inEl.nativeElement, {
      ...base,
      position: makePosition(false),
      defaultDate: checkInDefault,
      onChange: ([date]) => {
        if (!date) return;
        this.checkIn.emit(this.fmt(date));
        this.fpOut?.set('minDate', date);
        // If no checkout chosen yet, jump the checkout calendar to the same month
        if (!this.fpOut?.selectedDates.length) {
          this.fpOut?.jumpToDate(date, false);
        }
      },
    }) as flatpickr.Instance;

    this.fpOut = flatpickr(this.outEl.nativeElement, {
      ...base,
      position: makePosition(true),
      defaultDate: parseInitial(this.initialCheckOut),
      // When there is a check-in but no check-out, open the calendar at the check-in month
      onOpen: checkInDefault && !this.initialCheckOut
        ? () => this.fpOut?.jumpToDate(checkInDefault!, false)
        : undefined,
      onChange: ([date]) => {
        if (!date) return;
        this.checkOut.emit(this.fmt(date));
        this.fpIn?.set('maxDate', date);
      },
    }) as flatpickr.Instance;
  }

  ngOnDestroy() {
    this.fpIn?.destroy();
    this.fpOut?.destroy();
  }

  private fmt(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }
}
