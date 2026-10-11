import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FollowingFeedComponent } from './following-feed.component';
import { ApiService } from '../../../core/api/api.service';
import { mockFeedPage } from '../../../core/api/feed.mock';

describe('FollowingFeedComponent', () => {
  it('shows the empty state', () => {
    TestBed.configureTestingModule({ imports: [FollowingFeedComponent], providers: [provideRouter([]),
      { provide: ApiService, useValue: { getFollowingFeed: () => of({ items: [], nextCursor: null }) } }] });
    const f = TestBed.createComponent(FollowingFeedComponent); f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Aún no sigues a nadie');
  });

  it('loads more with the cursor and hides the button at the end', () => {
    const getFollowingFeed = jest.fn()
      .mockReturnValueOnce(of({ items: mockFeedPage(null, 2).items, nextCursor: 'c1' }))
      .mockReturnValueOnce(of({ items: mockFeedPage(null, 1).items, nextCursor: null }));
    TestBed.configureTestingModule({ imports: [FollowingFeedComponent], providers: [provideRouter([]), { provide: ApiService, useValue: { getFollowingFeed } }] });
    const f = TestBed.createComponent(FollowingFeedComponent); f.detectChanges();
    f.componentInstance.loadMore(); f.detectChanges();
    expect(getFollowingFeed).toHaveBeenLastCalledWith('c1');
    expect(f.nativeElement.querySelectorAll('tb-feed-plan-card').length).toBe(3);
    expect(f.nativeElement.querySelector('.ff-more')).toBeNull();
  });

  it('shows an error, not the empty state, when the first load fails', () => {
    const getFollowingFeed = jest.fn().mockReturnValue(throwError(() => new Error('boom')));
    TestBed.configureTestingModule({ imports: [FollowingFeedComponent], providers: [provideRouter([]), { provide: ApiService, useValue: { getFollowingFeed } }] });
    const f = TestBed.createComponent(FollowingFeedComponent); f.detectChanges();
    expect(f.nativeElement.textContent).toContain('No pudimos cargar a quienes sigues.');
    expect(f.nativeElement.textContent).not.toContain('Aún no sigues a nadie');
  });

  it('retry reloads the same cursor after an error', () => {
    const getFollowingFeed = jest.fn()
      .mockReturnValueOnce(of({ items: mockFeedPage(null, 2).items, nextCursor: 'c1' }))
      .mockReturnValueOnce(throwError(() => new Error('boom')))
      .mockReturnValueOnce(of({ items: mockFeedPage(null, 1).items, nextCursor: null }));
    TestBed.configureTestingModule({ imports: [FollowingFeedComponent], providers: [provideRouter([]), { provide: ApiService, useValue: { getFollowingFeed } }] });
    const f = TestBed.createComponent(FollowingFeedComponent); f.detectChanges();
    f.componentInstance.loadMore(); f.detectChanges();
    expect(f.nativeElement.textContent).toContain('No pudimos cargar a quienes sigues.');
    f.componentInstance.retry(); f.detectChanges();
    expect(getFollowingFeed).toHaveBeenLastCalledWith('c1');
    expect(f.nativeElement.querySelectorAll('tb-feed-plan-card').length).toBe(3);
    expect(f.nativeElement.textContent).not.toContain('No pudimos cargar');
  });
});
