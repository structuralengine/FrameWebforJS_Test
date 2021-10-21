import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrintCustomPickFsecComponent } from './print-custom-pick-fsec.component';

describe('PrintCustomPickFsecComponent', () => {
  let component: PrintCustomPickFsecComponent;
  let fixture: ComponentFixture<PrintCustomPickFsecComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrintCustomPickFsecComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PrintCustomPickFsecComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
