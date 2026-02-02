import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaUsuariosPasivos } from './lista-usuarios-pasivos';

describe('ListaUsuariosPasivos', () => {
  let component: ListaUsuariosPasivos;
  let fixture: ComponentFixture<ListaUsuariosPasivos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaUsuariosPasivos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaUsuariosPasivos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
