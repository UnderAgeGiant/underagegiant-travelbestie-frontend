import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { UsernameEditComponent } from './username-edit.component';
import { AuthService } from '../../../core/auth/auth.service';

function setup(update: jest.Mock, username: string | null = null) {
  TestBed.configureTestingModule({
    imports: [UsernameEditComponent],
    providers: [provideRouter([]), { provide: AuthService, useValue: { currentUser: signal({ name: 'Ana', email: 'a@x', username }), updateProfile: update } }],
  });
  const f = TestBed.createComponent(UsernameEditComponent);
  f.detectChanges();
  return f;
}

describe('UsernameEditComponent', () => {
  it('lowercases input and blocks invalid formats client-side', () => {
    const update = jest.fn();
    const f = setup(update);
    const c = f.componentInstance;
    c.open.set(true);
    c.draft.set('AN');
    expect(c.valid()).toBe(false);
    c.onInput('Ana_Viaja');
    expect(c.draft()).toBe('ana_viaja');
    expect(c.valid()).toBe(true);
    c.draft.set('an..a');
    c.save();
    expect(update).not.toHaveBeenCalled();
  });

  it('maps CONFLICT and BAD_REQUEST to messages', () => {
    const update = jest.fn()
      .mockReturnValueOnce(throwError(() => ({ code: 'CONFLICT' })))
      .mockReturnValueOnce(throwError(() => ({ code: 'BAD_REQUEST' })));
    const c = setup(update).componentInstance;
    c.draft.set('ana'); c.save();
    expect(c.errorKind()).toBe('taken');
    c.draft.set('admin'); c.save();
    expect(c.errorKind()).toBe('notAllowed');
  });

  it('shows the public profile link once set', () => {
    const f = setup(jest.fn().mockReturnValue(of({})), 'ana');
    f.componentInstance.open.set(true);
    f.detectChanges();
    expect(f.nativeElement.querySelector('a[href="/u/ana"]')).not.toBeNull();
  });
});
