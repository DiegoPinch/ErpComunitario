import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserAttendance {
  user_id: number;
  user_name: string;
  locked: boolean;
  lock_reason?: string;
  attendance_id?: number | null;
  attended: 'yes' | 'no' | 'justified';
  observations?: string | null;
  invoice_status?: 'pending' | 'partial' | 'paid' | 'cancelled' | null;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/attendance`;

  getAttendanceByMeeting(meetingId: number): Observable<UserAttendance[]> {
    return this.http.get<UserAttendance[]>(`${this.apiUrl}/meeting/${meetingId}`);
  }

  preview(meetingId: number, payload: object): Observable<any> {
    return this.http.post(`${this.apiUrl}/preview/${meetingId}`, payload);
  }
  updateAttendanceBulk(meetingId: number, payload: object): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/bulk/${meetingId}`, payload);
  }
}
