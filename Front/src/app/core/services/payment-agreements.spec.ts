import { TestBed } from '@angular/core/testing';

import { PaymentAgreements } from './payment-agreements';

describe('PaymentAgreements', () => {
  let service: PaymentAgreements;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PaymentAgreements);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
