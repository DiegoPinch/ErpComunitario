import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Rate } from '../models/rate.model';

@Injectable({
    providedIn: 'root',
})
export class RatesService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/rates`;

    getRates(): Observable<Rate[]> {
        return this.http.get<Rate[]>(this.apiUrl);
    }

    getRate(id: number): Observable<Rate> {
        return this.http.get<Rate>(`${this.apiUrl}/${id}`);
    }

    createRate(rate: Rate): Observable<{ rate_id: number }> {
        return this.http.post<{ rate_id: number }>(this.apiUrl, rate);
    }

    updateRate(id: number, rate: Rate): Observable<{ updated: number }> {
        return this.http.put<{ updated: number }>(`${this.apiUrl}/${id}`, rate);
    }

    deleteRate(id: number): Observable<{ deactivated: number; message: string }> {
        return this.http.delete<{ deactivated: number; message: string }>(`${this.apiUrl}/${id}`);
    }
}
