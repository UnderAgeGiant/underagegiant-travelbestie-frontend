import { TestBed } from '@angular/core/testing';
import { Component, output } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ProfilePageComponent } from './profile-page.component';
import { ProfileComponent } from './profile.component';
import { NavFacadeService } from '../nav/nav-facade.service';

@Component({ selector: 'app-profile', template: '' })
class ProfileStub { close = output<void>(); openAiPlanning = output<void>(); }

describe('ProfilePageComponent', () => {
  it('openAiPlanning → facade.openAiPlanning()', () => {
    TestBed.configureTestingModule({
      imports: [ProfilePageComponent],
      providers: [provideRouter([]), { provide: NavFacadeService, useValue: { openAiPlanning: jest.fn() } }],
    });
    TestBed.overrideComponent(ProfilePageComponent, { remove: { imports: [ProfileComponent] }, add: { imports: [ProfileStub] } });
    const fixture = TestBed.createComponent(ProfilePageComponent);
    fixture.detectChanges();
    const stub = fixture.debugElement.children[0].componentInstance as ProfileStub;
    stub.openAiPlanning.emit();
    expect(TestBed.inject(NavFacadeService).openAiPlanning).toHaveBeenCalledWith();
  });
});
