import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CortesCaja } from './cortes-caja';

describe('CortesCaja', () => {
  let component: CortesCaja;
  let fixture: ComponentFixture<CortesCaja>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CortesCaja]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CortesCaja);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
