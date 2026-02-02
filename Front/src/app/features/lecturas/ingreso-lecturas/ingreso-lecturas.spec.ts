import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IngresoLecturas } from './ingreso-lecturas';

describe('IngresoLecturas', () => {
  let component: IngresoLecturas;
  let fixture: ComponentFixture<IngresoLecturas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IngresoLecturas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IngresoLecturas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
