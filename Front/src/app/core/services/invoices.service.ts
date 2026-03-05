import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
    voidPayment(invoiceId: number): Observable<any> {
        return this.http.delete(`${this.paymentsUrl}/void/${invoiceId}`);
    }

    /**
     * Procesa el cobro de una o varias facturas
     */
    collectPayments(invoiceIds: number[], amountPaid: number, changeAmount: number): Observable<any> {
        return this.http.post(`${this.paymentsUrl}/collect`, {
            invoice_ids: invoiceIds,
            amount_paid: amountPaid,
            change_amount: changeAmount
        });
    }

    /**
     * Retorna la URL para descargar el recibo en PDF
     */
    getReceiptUrl(invoiceIds: number[]): string {
        return `${this.paymentsUrl}/receipt?invoiceIds=${invoiceIds.join(',')}`;
    }
}
