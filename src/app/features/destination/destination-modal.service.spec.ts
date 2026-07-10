import { TestBed } from '@angular/core/testing';
import { DestinationModalService } from './destination-modal.service';

describe('DestinationModalService', () => {
  let service: DestinationModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DestinationModalService);
  });

  it('starts closed', () => {
    expect(service.isOpen()).toBe(false);
  });

  it('open() sets isOpen to true', () => {
    service.open();
    expect(service.isOpen()).toBe(true);
  });

  it('close() sets isOpen back to false', () => {
    service.open();
    service.close();
    expect(service.isOpen()).toBe(false);
  });
});
