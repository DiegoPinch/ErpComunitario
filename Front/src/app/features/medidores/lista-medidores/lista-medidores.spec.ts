import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaMedidores } from './lista-medidores';

describe('ListaMedidores', () => {
  let component: ListaMedidores;
  let fixture: ComponentFixture<ListaMedidores>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaMedidores]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaMedidores);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
