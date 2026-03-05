import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ExpenseCategory } from '../models/financial.model';

@Injectable({
    providedIn: 'root'
})
export class ExpenseCategoryService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/expense-categories`;

    getCategories(): Observable<ExpenseCategory[]> {
        return this.http.get<ExpenseCategory[]>(this.apiUrl);
    }

    getCategory(id: number): Observable<ExpenseCategory> {
        return this.http.get<ExpenseCategory>(`${this.apiUrl}/${id}`);
    }

    createCategory(category: ExpenseCategory): Observable<{ id: number; message: string }> {
        return this.http.post<{ id: number; message: string }>(this.apiUrl, category);
    }

    updateCategory(id: number, category: ExpenseCategory): Observable<{ message: string }> {
        return this.http.put<{ message: string }>(`${this.apiUrl}/${id}`, category);
    }

    deleteCategory(id: number): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
    }
}
