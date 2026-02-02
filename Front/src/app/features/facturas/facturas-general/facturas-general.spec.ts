import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacturasGeneral } from './facturas-general';

describe('FacturasGeneral', () => {
  let component: FacturasGeneral;
  let fixture: ComponentFixture<FacturasGeneral>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacturasGeneral]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacturasGeneral);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
