import { Injectable, LOCALE_ID, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  AppLocale,
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  isSupportedLocale,
  otherLocale,
  stripLocalePrefix,
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

  /** Pure: where to navigate to land on the same view under `target`. */
  targetUrl(
    target: AppLocale,
    pathname: string,
    search: string,
    hash: string,
  ): string {
    const inApp = stripLocalePrefix(pathname); // always starts with "/"
    const path = inApp === '/' ? '/' : inApp;
    return `/${target}${path}${search}${hash}`;
  }

  /** Persist the choice so the root redirect and the in-app service agree. */
  persist(target: AppLocale): void {
    try {
      this.doc.defaultView?.localStorage.setItem(LOCALE_STORAGE_KEY, target);
    } catch {
      /* localStorage may be unavailable (private mode) — cookie still works */
    }
    this.doc.cookie = `${LOCALE_STORAGE_KEY}=${target}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
  }

  /** Persist then reload into the other locale at the same view.
   *  Callers can pass a `restoreView` key that AppComponent will read on
   *  the next boot to re-open the correct panel after the locale reload. */
  switchTo(target: AppLocale, restoreView?: string): void {
    if (target === this.current()) return;
    this.persist(target);
    if (restoreView) {
      try { this.doc.defaultView?.sessionStorage.setItem('tb_restore_view', restoreView); } catch {}
    }
    const loc = this.doc.defaultView!.location;
    loc.assign(this.targetUrl(target, loc.pathname, loc.search, loc.hash));
  }
}
