import { TestBed } from '@angular/core/testing';

import { PrintCustomPickFsecService } from './print-custom-pick-fsec.service';

describe('PrintCustomPickFsecService', () => {
  let service: PrintCustomPickFsecService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PrintCustomPickFsecService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
