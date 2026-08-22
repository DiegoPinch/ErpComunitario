import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BankAccount {
  account_id: number;
  bank_name: string;
  account_number: string;
  account_type: 'savings' | 'checking';
  initial_balance: number;
  current_balance?: number;
  status: 'active' | 'inactive';
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class BankAccountsService {
  private apiUrl = `${environment.apiUrl}/bank-accounts`;

  constructor(private http: HttpClient) { }

  getAllAccounts(): Observable<BankAccount[]> {
    return this.http.get<BankAccount[]>(this.apiUrl);
  }

  getActiveAccounts(): Observable<BankAccount[]> {
    return this.http.get<BankAccount[]>(`${this.apiUrl}/active`);
  }

  createAccount(account: Partial<BankAccount>): Observable<any> {
    return this.http.post(this.apiUrl, account);
  }

  updateAccount(id: number, account: Partial<BankAccount>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, account);
  }
}
