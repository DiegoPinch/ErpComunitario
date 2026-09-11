import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Respaldos } from './respaldos';

describe('Respaldos', () => {
  let component: Respaldos;
  let fixture: ComponentFixture<Respaldos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Respaldos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Respaldos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
