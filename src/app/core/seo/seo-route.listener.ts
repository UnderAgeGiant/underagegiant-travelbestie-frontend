import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { SeoService } from './seo.service';
import type { RouteSeo } from './seo-pages';

/** Applies the deepest activated route's `data.seo` on every navigation; routes without one get the index.html defaults. */
@Injectable({ providedIn: 'root' })
export class SeoRouteListener {
  constructor() {
    const router = inject(Router);
    const seo = inject(SeoService);
    router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe(() => {
      let route = router.routerState.snapshot.root;
      while (route.firstChild) route = route.firstChild;
      const page = route.data['seo'] as RouteSeo | undefined;
      if (page) seo.apply(page());
      else seo.reset();
    });
  }
}
