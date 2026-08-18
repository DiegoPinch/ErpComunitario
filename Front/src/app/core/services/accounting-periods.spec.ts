import { TestBed } from '@angular/core/testing';

import { AccountingPeriods } from './accounting-periods';

describe('AccountingPeriods', () => {
  let service: AccountingPeriods;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AccountingPeriods);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
