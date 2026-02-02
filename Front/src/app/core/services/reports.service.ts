import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ReportsService {
    private apiUrl = `${environment.apiUrl}/reports`;

    constructor(private http: HttpClient) { }

    getUsersMetersReport(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/users-meters`);
    }

    getReadingsReport(startMonth: string, endMonth: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/readings`, { params: { startMonth, endMonth } });
    }

    getRecollectionReport(startMonth: string, endMonth: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/recollection`, { params: { startMonth, endMonth } });
    }

    getDelinquencyReport(startMonth: string, endMonth: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/delinquency`, { params: { startMonth, endMonth } });
    }

    getAdditionalChargesReport(startMonth: string, endMonth: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/additional-charges`, { params: { startMonth, endMonth } });
    }

    getActiveUsersReport(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/active-users`);
    }

    getReportPdfUrl(reportId: string, startMonth?: string, endMonth?: string): string {
        let url = `${this.apiUrl}/${reportId}?format=pdf`;
        if (startMonth) url += `&startMonth=${startMonth}`;
        if (endMonth) url += `&endMonth=${endMonth}`;
        return url;
    }
}
