import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistroEgresos } from './registro-egresos';

describe('RegistroEgresos', () => {
  let component: RegistroEgresos;
  let fixture: ComponentFixture<RegistroEgresos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroEgresos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistroEgresos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
