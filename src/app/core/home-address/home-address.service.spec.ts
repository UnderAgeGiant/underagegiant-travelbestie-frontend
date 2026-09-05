import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { HomeAddressService } from './home-address.service';
import { AuthService, AuthUser } from '../auth/auth.service';

describe('HomeAddressService', () => {
  let service: HomeAddressService;
  let authStub: { currentUser: () => AuthUser | null; updateProfile: jest.Mock };

  beforeEach(() => {
    authStub = {
      currentUser: () => ({ name: 'Test', email: 't@example.com', countryOfResidence: 'CL' }),
      updateProfile: jest.fn().mockReturnValue(of({ user: { name: 'Test', email: 't@example.com', countryOfResidence: 'FR' } })),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: authStub }],
    });
    service = TestBed.inject(HomeAddressService);
  });

  it('countryCode reflects the current user\'s countryOfResidence', () => {
    expect(service.countryCode()).toBe('CL');
  });

  it('save() calls AuthService.updateProfile with countryOfResidence', () => {
    service.save('FR').subscribe();
    expect(authStub.updateProfile).toHaveBeenCalledWith({ countryOfResidence: 'FR' });
  });
});
