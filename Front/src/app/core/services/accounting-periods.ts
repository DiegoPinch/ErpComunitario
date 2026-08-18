import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AccountingPeriod {
  period_id?: number;
  administration_id: number;
  system_user_id?: number;
  title: string;
  start_date: string;
  end_date: string;
  previous_balance?: number;
  total_incomes?: number;
  total_expenses?: number;
  system_balance?: number;
  physical_balance: number;
  difference?: number;
  observations: string;
  created_at?: string;
  // joins
  administration_name?: string;
  treasurer_username?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccountingPeriodsService {
  private apiUrl = `${environment.apiUrl}/accounting-periods`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<AccountingPeriod[]> {
    return this.http.get<AccountingPeriod[]>(this.apiUrl);
  }

  getById(id: number): Observable<AccountingPeriod> {
    return this.http.get<AccountingPeriod>(`${this.apiUrl}/${id}`);
  }

  generate(periodData: any): Observable<any> {
    return this.http.post(this.apiUrl, periodData);
  }
}
