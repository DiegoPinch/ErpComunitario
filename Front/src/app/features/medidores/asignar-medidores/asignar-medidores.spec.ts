import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsignarMedidores } from './asignar-medidores';

describe('AsignarMedidores', () => {
  let component: AsignarMedidores;
  let fixture: ComponentFixture<AsignarMedidores>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsignarMedidores]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AsignarMedidores);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
