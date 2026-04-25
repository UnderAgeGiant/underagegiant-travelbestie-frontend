import {
  Component, output, AfterViewInit, OnDestroy,
  ViewChild, ElementRef, inject, LOCALE_ID,
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

  checkIn = output<string>();
  checkOut = output<string>();

  private fpIn?: flatpickr.Instance;
  private fpOut?: flatpickr.Instance;
  private readonly locale = inject(LOCALE_ID);

  ngAfterViewInit() {
    const l10n = this.locale.startsWith('es') ? Spanish : undefined;
    const base: flatpickr.Options.Options = {
      locale: l10n,
      dateFormat: 'd/m/Y',
      disableMobile: true,
    };

    this.fpIn = flatpickr(this.inEl.nativeElement, {
      ...base,
      onChange: ([date]) => {
        if (!date) return;
        this.checkIn.emit(this.fmt(date));
        this.fpOut?.set('minDate', date);
      },
    }) as flatpickr.Instance;

    this.fpOut = flatpickr(this.outEl.nativeElement, {
      ...base,
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
