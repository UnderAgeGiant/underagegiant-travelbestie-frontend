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
      locale: l10n,
      dateFormat: 'd/m/Y',
      disableMobile: true,
    };

    const parseInitial = (s: string): Date | undefined => {
      if (!s) return undefined;
      const [dd, mm, yyyy] = s.split('/').map(Number);
      if (!dd || !mm || !yyyy) return undefined;
      return new Date(yyyy, mm - 1, dd);
    };

    this.fpIn = flatpickr(this.inEl.nativeElement, {
      ...base,
      defaultDate: parseInitial(this.initialCheckIn),
      onChange: ([date]) => {
        if (!date) return;
        this.checkIn.emit(this.fmt(date));
        this.fpOut?.set('minDate', date);
      },
    }) as flatpickr.Instance;

    this.fpOut = flatpickr(this.outEl.nativeElement, {
      ...base,
      defaultDate: parseInitial(this.initialCheckOut),
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
