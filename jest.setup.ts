import '@angular/localize/init';
import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
import { __setAttractionSourceForTests } from './src/app/data/attractions.data';
import type { CURATED_ALL as CuratedAll } from './src/app/data/attractions-curated';

setupZoneTestEnv();

// Specs read the curated catalog synchronously. Loaded lazily so specs that never touch attractions skip the 13 MB load.
let curated: typeof CuratedAll | undefined;
const jestAttractionSource = (cityId: string) => {
  curated ??= (require('./src/app/data/attractions-curated') as typeof import('./src/app/data/attractions-curated')).CURATED_ALL;
  return curated[cityId];
};
(globalThis as Record<string, unknown>)['__tbJestAttractionSource'] = jestAttractionSource;
__setAttractionSourceForTests(jestAttractionSource);
