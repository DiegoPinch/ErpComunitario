import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoriasEgresos } from './categorias-egresos';

describe('CategoriasEgresos', () => {
  let component: CategoriasEgresos;
  let fixture: ComponentFixture<CategoriasEgresos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriasEgresos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoriasEgresos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
