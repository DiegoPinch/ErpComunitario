import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    UsersMetersReport,
    ReadingsReport,
    RecollectionReport,
    DelinquencyReport,
    AdditionalChargesReport,
    ActiveUsersReport
} from '../models/report.model';

@Injectable({
    providedIn: 'root'
})
export class ReportsService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/reports`;

    getUsersMetersReport(): Observable<UsersMetersReport[]> {
        return this.http.get<UsersMetersReport[]>(`${this.apiUrl}/users-meters`);
    }

    getReadingsReport(startMonth: string, endMonth: string): Observable<ReadingsReport[]> {
        return this.http.get<ReadingsReport[]>(`${this.apiUrl}/readings`, { params: { startMonth, endMonth } });
    }

    getRecollectionReport(startMonth: string, endMonth: string): Observable<RecollectionReport[]> {
        return this.http.get<RecollectionReport[]>(`${this.apiUrl}/recollection`, { params: { startMonth, endMonth } });
    }

    getDelinquencyReport(startMonth: string, endMonth: string): Observable<DelinquencyReport[]> {
        return this.http.get<DelinquencyReport[]>(`${this.apiUrl}/delinquency`, { params: { startMonth, endMonth } });
    }

    getAdditionalChargesReport(startMonth: string, endMonth: string): Observable<AdditionalChargesReport[]> {
        return this.http.get<AdditionalChargesReport[]>(`${this.apiUrl}/additional-charges`, { params: { startMonth, endMonth } });
    }

    getActiveUsersReport(): Observable<ActiveUsersReport[]> {
        return this.http.get<ActiveUsersReport[]>(`${this.apiUrl}/active-users`);
    }

    getReportPdfUrl(reportId: string, startMonth?: string, endMonth?: string): string {
        let url = `${this.apiUrl}/${reportId}?format=pdf`;
        if (startMonth) url += `&startMonth=${startMonth}`;
        if (endMonth) url += `&endMonth=${endMonth}`;
        return url;
    }
}
