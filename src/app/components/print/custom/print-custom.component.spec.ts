import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrintCustomComponent } from './print-custom.component';

describe('PrintCustomComponent', () => {
  let component: PrintCustomComponent;
  let fixture: ComponentFixture<PrintCustomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrintCustomComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PrintCustomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
