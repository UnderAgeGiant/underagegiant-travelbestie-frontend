import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { FollowButtonComponent } from './follow-button.component';
import { ApiService } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { AuthModalService } from '../../core/auth/auth-modal.service';

describe('FollowButtonComponent', () => {
  function create(opts: { loggedIn: boolean; followUser?: any; unfollowUser?: any }) {
    const api = {
      followUser: jest.fn(opts.followUser ?? (() => of(undefined))),
      unfollowUser: jest.fn(opts.unfollowUser ?? (() => of(undefined))),
    };
    const openLogin = jest.fn();
    TestBed.configureTestingModule({
      imports: [FollowButtonComponent],
      providers: [
        { provide: ApiService, useValue: api },
        { provide: AuthService, useValue: { isLoggedIn: signal(opts.loggedIn) } },
        { provide: AuthModalService, useValue: { openLogin } },
      ],
    });
    const f = TestBed.createComponent(FollowButtonComponent);
    f.componentRef.setInput('username', 'ana');
    f.detectChanges();
    return { f, api, openLogin, cmp: f.componentInstance };
  }

  it('logged out: click opens the login modal and makes no API call', () => {
    const { f, api, openLogin, cmp } = create({ loggedIn: false });
    f.nativeElement.querySelector('button').click();
    expect(openLogin).toHaveBeenCalled();
    expect(api.followUser).not.toHaveBeenCalled();
    expect(api.unfollowUser).not.toHaveBeenCalled();
    expect(cmp.following()).toBe(false);
  });

  it('logged in, follow errors: optimistic state reverts and busy clears', () => {
    const { f, api, cmp } = create({ loggedIn: true, followUser: () => throwError(() => new Error('boom')) });
    f.nativeElement.querySelector('button').click();
    f.detectChanges();
    expect(api.followUser).toHaveBeenCalledWith('ana');
    expect(cmp.following()).toBe(false);
    expect(cmp.busy()).toBe(false);
  });

  it('logged in, follow succeeds: following is true and busy clears', () => {
    const { f, cmp } = create({ loggedIn: true });
    f.nativeElement.querySelector('button').click();
    f.detectChanges();
    expect(cmp.following()).toBe(true);
    expect(cmp.busy()).toBe(false);
  });
});
