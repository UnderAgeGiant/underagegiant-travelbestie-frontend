import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AttractionsLoadErrorComponent } from './attractions-load-error.component';
import { __setAttractionSourceForTests, loadCityAttractions } from '../../data/attractions.data';

@Component({
  imports: [AttractionsLoadErrorComponent],
  template: `<tb-attractions-load-error [cityIds]="['paris']" />`,
})
class HostComponent {}

const realFetch = globalThis.fetch;
const jestSource = (globalThis as any).__tbJestAttractionSource;
let fetchMock: jest.Mock;

beforeEach(() => {
  __setAttractionSourceForTests(null);
  fetchMock = jest.fn(() => Promise.reject(new Error('network down')));
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = realFetch;
  __setAttractionSourceForTests(jestSource);
});

describe('AttractionsLoadErrorComponent', () => {
  it('renders nothing while a city is loading', () => {
    fetchMock.mockImplementation(() => new Promise(() => {}));
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });

  it('renders nothing when the city is ready', async () => {
    fetchMock.mockImplementation(() => Promise.resolve({ ok: true, status: 200, json: async () => [] }));
    await loadCityAttractions(['paris']);
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
  });

  it('renders the message and an outline Reintentar button for an errored city', async () => {
    await loadCityAttractions(['paris']);
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain('No pudimos cargar las atracciones.');
    const button = fixture.nativeElement.querySelector('button.btn-pill.btn-outline') as HTMLButtonElement;
    expect(button.textContent?.trim()).toBe('Reintentar');
  });

  it('clicking Reintentar refetches the errored city', async () => {
    await loadCityAttractions(['paris']);
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
