import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastComponent } from './toast.component';

describe('ToastComponent', () => {
  let fixture: ComponentFixture<ToastComponent>;

  beforeEach(async () => {
    jest.useFakeTimers();
    await TestBed.configureTestingModule({ imports: [ToastComponent] }).compileComponents();
    fixture = TestBed.createComponent(ToastComponent);
  });

  afterEach(() => jest.useRealTimers());

  it('renders the message', () => {
    fixture.componentRef.setInput('message', 'Paris added!');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Paris added!');
  });

  it('emits done after 2400ms', () => {
    let doneFired = false;
    fixture.componentRef.setInput('message', 'Test');
    fixture.componentInstance.done.subscribe(() => (doneFired = true));
    fixture.detectChanges();
    jest.advanceTimersByTime(2400);
    expect(doneFired).toBe(true);
  });
});
