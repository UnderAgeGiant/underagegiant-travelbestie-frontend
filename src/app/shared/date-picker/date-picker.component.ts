import {
  Component, Input, output, AfterViewInit, OnDestroy,
  ViewChild, ElementRef, inject, LOCALE_ID,
} from '@angular/core';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  template: `
    <input #el class="form-input"
           i18n-placeholder="@@datePicker.fromPlaceholder" placeholder="dd/mm/aaaa"
           readonly />
  `,
})
export class DatePickerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('el') private el!: ElementRef<HTMLInputElement>;

  @Input() initialDate = '';
  @Input() minDate     = '';
  @Input() maxDate     = '';

  dateChange = output<string>();

  private fp?: flatpickr.Instance;
  private readonly locale = inject(LOCALE_ID);

  ngAfterViewInit() {
    const l10n  = this.locale.startsWith('es') ? Spanish : undefined;
    const parse = (s: string): Date | undefined => {
      if (!s) return undefined;
      const [dd, mm, yyyy] = s.split('/').map(Number);
      if (!dd || !mm || !yyyy) return undefined;
      return new Date(yyyy, mm - 1, dd);
    };

    const initialParsed = parse(this.initialDate);

    this.fp = flatpickr(this.el.nativeElement, {
      ...(l10n ? { locale: l10n } : {}),
      dateFormat:    'd/m/Y',
      disableMobile: true,
      defaultDate:   initialParsed,
      minDate:       parse(this.minDate),
      maxDate:       parse(this.maxDate),
      // Open at the initial date's month, not today
      onOpen: initialParsed
        ? () => this.fp?.jumpToDate(initialParsed!, false)
        : undefined,
      onChange: ([date]) => {
        if (!date) return;
        this.dateChange.emit(this.fmt(date));
      },
    }) as flatpickr.Instance;
  }

  ngOnDestroy() {
    this.fp?.destroy();
  }

  private fmt(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }
}
