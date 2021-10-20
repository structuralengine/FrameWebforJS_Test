import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrintCustomThreeComponent } from './print-custom-three.component';

describe('PrintCustomThreeComponent', () => {
  let component: PrintCustomThreeComponent;
  let fixture: ComponentFixture<PrintCustomThreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrintCustomThreeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PrintCustomThreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
