import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MeterHistory } from '../models/meter-history.model';
import { Meter } from '../models/meter.model';

@Injectable({
    providedIn: 'root'
})
export class MeterHistoryService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/meter-history`;

    getAvailableMeters(): Observable<Meter[]> {
        return this.http.get<Meter[]>(`${this.apiUrl}/available-meters`);
    }

    getAssignmentsByUser(userId: number): Observable<MeterHistory[]> {
        return this.http.get<MeterHistory[]>(`${this.apiUrl}/user/${userId}`);
    }

    assignMeter(data: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/assign`, data);
    }

    createAndAssignMeter(data: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/quick-setup`, data);
    }

    removeAssignment(id: number): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/remove/${id}`, {});
    }
}
