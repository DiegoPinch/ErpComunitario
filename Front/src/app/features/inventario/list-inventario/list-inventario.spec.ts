import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListInventario } from './list-inventario';

describe('ListInventario', () => {
  let component: ListInventario;
  let fixture: ComponentFixture<ListInventario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListInventario]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListInventario);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
