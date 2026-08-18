import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListDirectiva } from './list-directiva';

describe('ListDirectiva', () => {
  let component: ListDirectiva;
  let fixture: ComponentFixture<ListDirectiva>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListDirectiva]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListDirectiva);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
