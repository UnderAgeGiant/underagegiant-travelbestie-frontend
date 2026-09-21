import type { SeoPage } from './seo.service';

/** Functions (not consts) so `$localize` runs lazily — same convention as getCategoryMeta(). */
export type RouteSeo = () => SeoPage;

export const aboutSeo: RouteSeo = () => ({
  title: $localize`:@@seo.about.title:Sobre Tripilove — el equipo detrás del planificador`,
  description: $localize`:@@seo.about.description:Conoce al equipo y la historia de Tripilove, el planificador de viajes que te ayuda a armar tu itinerario ciudad por ciudad.`,
});

export const termsSeo: RouteSeo = () => ({
  title: $localize`:@@seo.terms.title:Términos de servicio | Tripilove`,
  description: $localize`:@@seo.terms.description:Lee los términos de servicio de Tripilove: cuentas, karma, planes compartidos y uso aceptable.`,
});

export const privacySeo: RouteSeo = () => ({
  title: $localize`:@@seo.privacy.title:Política de privacidad | Tripilove`,
  description: $localize`:@@seo.privacy.description:Cómo Tripilove recopila, usa y protege tus datos personales.`,
});

export const karmaHistorySeo: RouteSeo = () => ({
  title: $localize`:@@seo.karmaHistory.title:Historial de karma | Tripilove`,
  noindex: true,
});

export const notFoundSeo: RouteSeo = () => ({
  title: $localize`:@@seo.notFound.title:Página no encontrada | Tripilove`,
  noindex: true,
});

/** Interim head for /shared/:id until the plan loads (SharedTripComponent then applies the real one). */
export const sharedPendingSeo: RouteSeo = () => ({
  title: $localize`:@@seo.sharedPending.title:Plan de viaje compartido | Tripilove`,
  noindex: true,
});
