import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Meter } from '../models/meter.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class MeterService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/meters`;

    getMeters(): Observable<Meter[]> {
        return this.http.get<Meter[]>(this.apiUrl);
    }

    getMeter(id: number): Observable<Meter> {
        return this.http.get<Meter>(`${this.apiUrl}/${id}`);
    }

    createMeter(meter: Meter): Observable<Meter> {
        return this.http.post<Meter>(this.apiUrl, meter);
    }

    updateMeter(id: number, meter: Meter): Observable<Meter> {
        return this.http.put<Meter>(`${this.apiUrl}/${id}`, meter);
    }

    deleteMeter(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
