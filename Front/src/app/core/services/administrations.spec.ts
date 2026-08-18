import { TestBed } from '@angular/core/testing';

import { Administrations } from './administrations';

describe('Administrations', () => {
  let service: Administrations;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Administrations);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
