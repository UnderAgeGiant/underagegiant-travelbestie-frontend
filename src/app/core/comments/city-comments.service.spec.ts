import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CityCommentsService } from './city-comments.service';
import { Comment } from '../models/comment.model';

const C = (id: string): Comment =>
  ({ id, attractionId: 'paris_0', name: 'Ana', text: 'Genial', rating: 5, color: '#fff', date: '01/07/2026' }) as Comment;

describe('CityCommentsService (C3)', () => {
  let svc: CityCommentsService;
  let http: HttpTestingController;
  const batch = () => http.match(r => r.url.includes('/comments?ids='));

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    svc = TestBed.inject(CityCommentsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('fetches a city once, and a revisit costs no request', () => {
    svc.load('paris', ['paris_0']);
    batch()[0].flush({ paris_0: [C('1')] });
    svc.load('paris', ['paris_0']);
    expect(batch()).toHaveLength(0);
    expect(svc.commentsFor('paris')['paris_0']).toHaveLength(1);
  });

  it('collapses concurrent loads of the same city into one request', () => {
    svc.load('paris', ['paris_0']);
    svc.load('paris', ['paris_0']);
    const reqs = batch();
    expect(reqs).toHaveLength(1);
    reqs[0].flush({});
  });

  it('keeps each city separate (no stale first-city comments)', () => {
    svc.load('paris', ['paris_0']);
    batch()[0].flush({ paris_0: [C('1')] });
    svc.load('rome', ['rome_0']);
    batch()[0].flush({ rome_0: [] });
    expect(svc.commentsFor('rome')['paris_0']).toBeUndefined();
    expect(svc.commentsFor('paris')['paris_0']).toHaveLength(1);
  });

  it('allows a retry after a failed load', () => {
    svc.load('paris', ['paris_0']);
    batch()[0].flush('boom', { status: 500, statusText: 'Server Error' });
    svc.load('paris', ['paris_0']);
    const reqs = batch();
    expect(reqs).toHaveLength(1);
    reqs[0].flush({});
  });

  it('shows a locally added comment immediately', () => {
    svc.load('paris', ['paris_0']);
    batch()[0].flush({ paris_0: [] });
    svc.addLocal('paris', 'paris_0', C('2'));
    expect(svc.commentsFor('paris')['paris_0'].map(c => c.id)).toEqual(['2']);
  });

  it('does nothing for a city with no attractions', () => {
    svc.load('nowhere', []);
    expect(batch()).toHaveLength(0);
  });
});
