import { TestBed } from '@angular/core/testing';

import { PrintCustomThreeService } from './print-custom-three.service';

describe('PrintCustomThreeService', () => {
  let service: PrintCustomThreeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PrintCustomThreeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
