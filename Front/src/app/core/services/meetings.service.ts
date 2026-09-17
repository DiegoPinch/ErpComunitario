import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Meeting {
  meeting_id?: number;
  reason: string;
  meeting_date: string;
  application_month: string;
  financial_locked?: boolean | number;
  minutes?: string;
  notes?: string;
  meeting_type: 'session' | 'minga';
  fine_config_id?: number;
  fine_amount: number;
  concept_id?: number;
}

@Injectable({
  providedIn: 'root'
})
export class MeetingsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/meetings`;

  getMeetings(): Observable<Meeting[]> {
    return this.http.get<Meeting[]>(this.apiUrl);
  }
  getBillingMonths(): Observable<{value:string;label:string;disabled:boolean;reason:string|null}[]> {
    return this.http.get<{value:string;label:string;disabled:boolean;reason:string|null}[]>(`${this.apiUrl}/billing-months`);
  }

  getMeeting(id: number): Observable<Meeting> {
    return this.http.get<Meeting>(`${this.apiUrl}/${id}`);
  }

  createMeeting(meeting: Meeting): Observable<{ meeting_id: number }> {
    return this.http.post<{ meeting_id: number }>(this.apiUrl, meeting);
  }

  updateMeeting(id: number, meeting: Meeting): Observable<{ updated: number }> {
    return this.http.put<{ updated: number }>(`${this.apiUrl}/${id}`, meeting);
  }

  deleteMeeting(id: number): Observable<{ deleted: number }> {
    return this.http.delete<{ deleted: number }>(`${this.apiUrl}/${id}`);
  }
}
