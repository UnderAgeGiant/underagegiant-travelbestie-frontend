import { TestBed } from '@angular/core/testing';
import { Component, output } from '@angular/core';
import { provideRouter } from '@angular/router';
import { PreferencesPageComponent } from './preferences-page.component';
import { PreferencesComponent } from './preferences.component';
import { NavFacadeService } from '../nav/nav-facade.service';

@Component({ selector: 'app-preferences', template: '' })
class ProfileStub { close = output<void>(); openAiPlanning = output<void>(); }

describe('PreferencesPageComponent', () => {
  it('openAiPlanning → facade.openAiPlanning()', () => {
    TestBed.configureTestingModule({
      imports: [PreferencesPageComponent],
      providers: [provideRouter([]), { provide: NavFacadeService, useValue: { openAiPlanning: jest.fn() } }],
    });
    TestBed.overrideComponent(PreferencesPageComponent, { remove: { imports: [PreferencesComponent] }, add: { imports: [ProfileStub] } });
    const fixture = TestBed.createComponent(PreferencesPageComponent);
    fixture.detectChanges();
    const stub = fixture.debugElement.children[0].componentInstance as ProfileStub;
    stub.openAiPlanning.emit();
    expect(TestBed.inject(NavFacadeService).openAiPlanning).toHaveBeenCalledWith();
  });
});
