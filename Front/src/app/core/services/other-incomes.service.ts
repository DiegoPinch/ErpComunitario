import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface OtherIncome {
  income_id?: number;
  system_user_id?: number;
  amount: number;
  income_date: string;
  description: string;
  payment_method?: string;
  reference_number?: string;
  treasurer_username?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OtherIncomesService {
  private apiUrl = `${environment.apiUrl}/other-incomes`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<OtherIncome[]> {
    return this.http.get<OtherIncome[]>(this.apiUrl);
  }

  create(income: OtherIncome): Observable<any> {
    return this.http.post(this.apiUrl, income);
  }
}
