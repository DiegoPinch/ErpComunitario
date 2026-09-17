import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { UserPendingSummary, Invoice } from '../models/invoice.model';

@Injectable({
    providedIn: 'root'
})
export class InvoicesService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/invoices`;
    private paymentsUrl = `${environment.apiUrl}/payments`;

    /**
     * Obtiene el resumen de usuarios con facturas pendientes 
     */
    getPendingUsers(): Observable<UserPendingSummary[]> {
        return this.http.get<UserPendingSummary[]>(`${this.apiUrl}/users-summary`);
    }

    /**
     * Obtiene todas las facturas de un usuario
     */
    getUserInvoices(userId: number): Observable<Invoice[]> {
        return this.http.get<Invoice[]>(`${this.apiUrl}/user/${userId}`);
    }

    /**
     * Obtiene el detalle de consumos de una factura
     */
    getInvoiceDetails(invoiceId: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${invoiceId}/details`);
    }

    /**
     * Anula el pago de una factura
     */
    voidPayment(invoiceId: number, reason: string): Observable<any> {
        return this.http.delete(`${this.paymentsUrl}/void/${invoiceId}`, { body: { reason } });
    }

    /**
     * Procesa el cobro de una o varias facturas
     */
    collectPayments(invoiceIds: number[], amountPaid: number, changeAmount: number, paymentMethod: string = 'cash', accountId: number | null = null, referenceNumber: string | null = null): Observable<any> {
        return this.http.post<any>(`${this.paymentsUrl}/collect`, {
            invoice_ids: invoiceIds,
            amount_paid: amountPaid,
            change_amount: changeAmount,
            payment_method: paymentMethod,
            account_id: accountId,
            reference_number: referenceNumber
        });
    }

    collectCombinedPayment(data: {
        invoice_ids: number[];
        debt_payments: { agreement_id: number; amount: number }[];
        amount_tendered: number;
        payment_method: string;
        account_id: number | null;
        reference_number: string | null;
        idempotency_key: string;
    }): Observable<any> {
        return this.http.post<any>(`${this.paymentsUrl}/collect-combined`, data);
    }

    /**
     * Retorna la URL para descargar el recibo en PDF
     */
    getReceiptUrl(invoiceIds: number[]): string {
        return `${this.paymentsUrl}/receipt?invoiceIds=${invoiceIds.join(',')}`;
    }

    /**
     * Imprime el recibo directamente sin descargarlo.
     * Carga el PDF en un iframe oculto y dispara el diálogo de impresión del navegador.
     */
    printReceipt(invoiceIds: number[]): Observable<void> {
        const url = this.getReceiptUrl(invoiceIds);
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
                    // Limpiar recursos después de 2 minutos
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
