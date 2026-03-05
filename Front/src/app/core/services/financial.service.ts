import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FinancialBalance, ConceptCollection, Expense } from '../models/financial.model';

@Injectable({
    providedIn: 'root'
})
export class FinancialService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/financial`;

    // --- Balance y Recaudación ---
    getBalance(): Observable<FinancialBalance> {
        return this.http.get<FinancialBalance>(`${this.apiUrl}/balance`);
    }

    getCollectionByConcept(): Observable<ConceptCollection[]> {
        return this.http.get<ConceptCollection[]>(`${this.apiUrl}/collection-by-concept`);
    }

    // --- Gastos (Egresos) ---
    getExpenses(): Observable<Expense[]> {
        return this.http.get<Expense[]>(`${this.apiUrl}/expenses`);
    }

    createExpense(expense: Expense): Observable<{ id: number; message: string }> {
        return this.http.post<{ id: number; message: string }>(`${this.apiUrl}/expenses`, expense);
    }

    deleteExpense(id: number): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.apiUrl}/expenses/${id}`);
    }
}
