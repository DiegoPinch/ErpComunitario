import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
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
    private authService = inject(AuthService);
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

    getDailyCollectionsReport(date: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/daily-collections`, { params: { date } });
    }

    saveCashCount(date: string, counted: number, reason: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/cash-count`, {date, counted, reason});
    }

    getCollectionDays(year: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/collection-days`, {params:{year}});
    }

    getCashBalanceReport(startMonth: string, endMonth: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/cash-balance`, { params: { startMonth, endMonth } });
    }

    getIncomesReport(startMonth: string, endMonth: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/incomes`, { params: { startMonth, endMonth } });
    }

    getExpensesReport(startMonth: string, endMonth: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/expenses`, { params: { startMonth, endMonth } });
    }

    getBankAccountsLedgerReport(startMonth: string, endMonth: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/bank-accounts`, { params: { startMonth, endMonth } });
    }

    getReportPdfUrl(reportId: string, startMonth?: string, endMonth?: string, date?: string, startDate?: string, endDate?: string, periodId?: string | null): string {
        let url = `${this.apiUrl}/${reportId}?format=pdf`;
        if (startMonth) url += `&startMonth=${startMonth}`;
        if (endMonth) url += `&endMonth=${endMonth}`;
        if (date) url += `&date=${date}`;
        if (startDate) url += `&startDate=${startDate}`;
        if (endDate) url += `&endDate=${endDate}`;
        if (periodId !== undefined && periodId !== null) url += `&periodId=${periodId}`;
        
        const token = this.authService.getToken();
        if (token) {
            url += `&token=${token}`;
        }
        return url;
    }
}
