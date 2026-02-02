import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RubrosLista } from './rubros-lista';

describe('RubrosLista', () => {
  let component: RubrosLista;
  let fixture: ComponentFixture<RubrosLista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RubrosLista]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RubrosLista);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
