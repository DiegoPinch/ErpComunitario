import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormDirectiva } from './form-directiva';

describe('FormDirectiva', () => {
  let component: FormDirectiva;
  let fixture: ComponentFixture<FormDirectiva>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormDirectiva]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormDirectiva);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
