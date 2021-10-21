import { TestBed } from '@angular/core/testing';

import { PrintCustomService } from './print-custom.service';

describe('PrintCustomService', () => {
  let service: PrintCustomService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PrintCustomService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
