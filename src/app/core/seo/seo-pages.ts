import type { SeoPage } from './seo.service';

/** Functions (not consts) so `$localize` runs lazily — same convention as getCategoryMeta(). */
export type RouteSeo = () => SeoPage;

export const aboutSeo: RouteSeo = () => ({
  title: $localize`:@@seo.about.title:Sobre Tripilove — el equipo detrás del planificador`,
  description: $localize`:@@seo.about.description:Conoce al equipo y la historia de Tripilove, el planificador de viajes que te ayuda a armar tu itinerario ciudad por ciudad.`,
});

export const termsSeo: RouteSeo = () => ({
  title: $localize`:@@seo.terms.title:Términos de servicio | Tripilove`,
  description: $localize`:@@seo.terms.description:Lee los términos de servicio de Tripilove: cuentas, token, planes compartidos y uso aceptable.`,
});

export const privacySeo: RouteSeo = () => ({
  title: $localize`:@@seo.privacy.title:Política de privacidad | Tripilove`,
  description: $localize`:@@seo.privacy.description:Cómo Tripilove recopila, usa y protege tus datos personales.`,
});

export const karmaHistorySeo: RouteSeo = () => ({
  title: $localize`:@@seo.karmaHistory.title:Historial de token | Tripilove`,
  noindex: true,
});

export const notFoundSeo: RouteSeo = () => ({
  title: $localize`:@@seo.notFound.title:Página no encontrada | Tripilove`,
  noindex: true,
});

/**
 * Interim head for /shared/:id while the plan is still loading (SharedTripComponent's fetchTrip() then applies
 * the real title/description/noindex/JSON-LD once it resolves, success or 404).
 *
 * Deliberately carries NO `noindex` — a JS-rendering crawler (Google's indexing renderer, not just non-JS link
 * scrapers) can snapshot the DOM during this window, before the real result is known. A false `noindex,follow`
 * transiently present in the live DOM is exactly what a "noindex tag detected" report in Search Console looks
 * like — caught live on production 2026-09-21 (a ~1.6s-wide "Plan de viaje compartido | Tripilove" state with
 * `<meta name="robots" content="noindex,follow">` on a page that is fully indexable once loaded). Showing the
 * placeholder title with no robots meta is strictly safer than a transient false noindex signal. The genuinely
 * terminal noindex cases — a truly unknown/thin/uncategorizable plan — are set by sharedTripSeo()/
 * sharedTripNotFoundSeo() once fetchTrip() resolves, not here.
 */
export const sharedPendingSeo: RouteSeo = () => ({
  title: $localize`:@@seo.sharedPending.title:Plan de viaje compartido | Tripilove`,
});
