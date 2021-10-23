import { TestBed } from '@angular/core/testing';

import { PrintCustomFsecService } from './print-custom-fsec.service';

describe('PrintCustomFsecService', () => {
  let service: PrintCustomFsecService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PrintCustomFsecService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
