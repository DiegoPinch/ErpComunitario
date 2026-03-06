import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstadoCaja } from './estado-caja';

describe('EstadoCaja', () => {
  let component: EstadoCaja;
  let fixture: ComponentFixture<EstadoCaja>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstadoCaja]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EstadoCaja);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
