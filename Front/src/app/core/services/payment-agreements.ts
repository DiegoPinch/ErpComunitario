import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface PaymentAgreement {
  agreement_id?: number;
  user_id: number;
  description: string;
  total_amount: number;
  number_of_installments: number;
  installment_amount?: number;
  remaining_amount?: number;
  start_month: string;
  status?: string;
  created_at?: string;
  // extras from join
  first_name?: string;
  last_name?: string;
  national_id?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentAgreementsService {
  private apiUrl = `${environment.apiUrl}/payment-agreements`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<PaymentAgreement[]> {
    return this.http.get<PaymentAgreement[]>(this.apiUrl);
  }

  getByUser(userId: number): Observable<PaymentAgreement[]> {
    return this.http.get<PaymentAgreement[]>(`${this.apiUrl}/user/${userId}`);
  }

  create(agreement: PaymentAgreement): Observable<any> {
    return this.http.post(this.apiUrl, agreement);
  }

  updateStatus(id: number, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/status`, { status });
  }

  addDebtPayment(id: number, amount_paid: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/payment`, { amount_paid });
  }

  getDebtPayments(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/payments`);
  }

  processMonth(billing_month: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/process-month`, { billing_month });
  }

  getReceiptUrl(paymentId: number): string {
    return `${this.apiUrl}/receipt?paymentId=${paymentId}`;
  }

  printReceipt(paymentId: number): Observable<void> {
    const url = this.getReceiptUrl(paymentId);
    return this.http.get(url, { responseType: 'blob' }).pipe(
      map(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.top = '-9999px';
        iframe.style.left = '-9999px';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.src = blobUrl;
        document.body.appendChild(iframe);
        iframe.onload = () => {
          iframe.contentWindow?.print();
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
            URL.revokeObjectURL(blobUrl);
          }, 120000);
        };
      })
    );
  }
}
