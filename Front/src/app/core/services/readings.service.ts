import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserAssignmentStatus, LatestReadingResponse, CurrentReadingResponse, ProcessReadingRequest, GenericResponse } from '../models/reading.model';

@Injectable({
    providedIn: 'root'
})
export class ReadingsService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/readings`;

    /**
     * Obtiene la lista base de usuarios y sus medidores activos
     */
    getAssignmentStatus(): Observable<UserAssignmentStatus[]> {
        return this.http.get<UserAssignmentStatus[]>(`${this.apiUrl}/assignment-status`);
    }

    /**
     * Obtiene la lectura anterior de un medidor para un mes específico
     */
    getLatestReading(meterId: number, monthYear: string): Observable<LatestReadingResponse> {
        return this.http.get<LatestReadingResponse>(`${this.apiUrl}/latest/${meterId}/${monthYear}`);
    }

    /**
     * Obtiene la lectura actual (si existe) y el estado de su factura
     */
    getCurrentReading(meterId: number, monthYear: string): Observable<CurrentReadingResponse | null> {
        return this.http.get<CurrentReadingResponse | null>(`${this.apiUrl}/current/${meterId}/${monthYear}`);
    }

    /**
     * Procesa una nueva lectura (Guarda o Actualiza) a través del Stored Procedure
     */
    processReading(data: ProcessReadingRequest): Observable<GenericResponse> {
        return this.http.post<GenericResponse>(`${this.apiUrl}/process`, data);
    }

    /**
     * Obtiene todas las lecturas registradas para un mes (opcional)
     */
    getReadingsByMonth(monthYear: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/month/${monthYear}`);
    }
}
