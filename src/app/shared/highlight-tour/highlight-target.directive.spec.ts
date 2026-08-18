import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HighlightTargetDirective } from './highlight-target.directive';
import { HighlightRegistryService } from './highlight-registry.service';

@Component({
  standalone: true,
  imports: [HighlightTargetDirective],
  template: `<button tbHighlightTarget="add-city-btn">+ Agregar</button>`,
})
class HostComponent {}

describe('HighlightTargetDirective', () => {
  let registry: HighlightRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    registry = TestBed.inject(HighlightRegistryService);
  });

  it('registers its host element under the given id on init', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(registry.get('add-city-btn')).toBe(button);
  });

  it('unregisters on destroy', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    fixture.destroy();
    expect(registry.get('add-city-btn')).toBeNull();
  });
});
