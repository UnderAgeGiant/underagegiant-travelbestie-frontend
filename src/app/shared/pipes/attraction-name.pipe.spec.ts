import { TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { AttractionNamePipe, AttractionNativePipe } from './attraction-name.pipe';

const ATT = { name: 'Ciudad Prohibida', nameEn: 'Forbidden City', nativeName: '故宫' } as any;

function pipes(locale: string) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: locale }] });
  return TestBed.runInInjectionContext(() => ({ name: new AttractionNamePipe(), native: new AttractionNativePipe() }));
}

describe('attraction name pipes', () => {
  it('attName follows the bundle locale', () => {
    expect(pipes('es-CL').name.transform(ATT)).toBe('Ciudad Prohibida');
    expect(pipes('en-US').name.transform(ATT)).toBe('Forbidden City');
  });
  it('attNative returns the native label or null', () => {
    expect(pipes('en-US').native.transform(ATT)).toBe('故宫');
    expect(pipes('es-CL').native.transform({ name: 'Museo del Prado', nativeName: 'Museo del Prado' } as any)).toBeNull();
  });
});
