import { Pipe, PipeTransform, inject } from '@angular/core';
import { Attraction } from '../../core/models/comment.model';
import { LocaleService } from '../../core/i18n/locale.service';
import { attractionName, attractionNativeLabel } from '../../core/utils/attraction-name.util';

/** `{{ att | attName }}` → the attraction name in the bundle's locale. Pure: the locale never changes during a page's life. */
@Pipe({ name: 'attName', standalone: true })
export class AttractionNamePipe implements PipeTransform {
  private readonly locale = inject(LocaleService);
  transform(a: Pick<Attraction, 'name' | 'nameEn'>): string {
    return attractionName(a, this.locale.current());
  }
}

/** `@if (att | attNative; as native)` → native name when it differs from the displayed one, else null. */
@Pipe({ name: 'attNative', standalone: true })
export class AttractionNativePipe implements PipeTransform {
  private readonly locale = inject(LocaleService);
  transform(a: Pick<Attraction, 'name' | 'nameEn' | 'nativeName'>): string | null {
    return attractionNativeLabel(a, this.locale.current());
  }
}
