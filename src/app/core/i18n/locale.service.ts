import { Injectable, LOCALE_ID, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  AppLocale,
  DEFAULT_LOCALE,
  LOCALE_COOKIE_KEY,
  isSupportedLocale,
  otherLocale,
} from './locale.util';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

@Injectable({ providedIn: 'root' })
export class LocaleService {
  private readonly localeId = inject(LOCALE_ID);
  private readonly doc = inject(DOCUMENT);

  /** The locale this bundle was compiled with. */
  current(): AppLocale {
    return isSupportedLocale(this.localeId) ? this.localeId : DEFAULT_LOCALE;
  }

  /** The locale the toggle would switch to. */
  other(): AppLocale {
    return otherLocale(this.current());
  }

  /**
   * Persist the choice so the Vercel edge rewrite serves the matching bundle
   * on the next request. Writes ONLY the tb_locale cookie — never any other
   * app storage key, and never a path — the URL is never touched.
   */
  persist(target: AppLocale): void {
    this.doc.cookie = `${LOCALE_COOKIE_KEY}=${target}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
  }

  /**
   * Persist the target locale, then reload the CURRENT URL — the address bar never changes.
   * The Vercel edge middleware reads the just-set cookie on that reload and serves the other
   * locale's bundle for the identical path, so /profile reopens as /profile (Feature 68).
   */
  switchTo(target: AppLocale): void {
    if (target === this.current()) return;
    this.persist(target);
    this.doc.defaultView?.location.reload();
  }
}
