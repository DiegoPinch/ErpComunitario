import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BoardMember {
  board_id?: number;
  administration_id: number;
  user_id: number;
  role: string;
  start_date: string;
  end_date?: string | null;
  active: boolean | number;
  first_name?: string;
  last_name?: string;
  national_id?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BoardMembersService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/board-members`;

  getAll(administrationId?: number): Observable<BoardMember[]> {
    const url = administrationId ? `${this.apiUrl}?administration_id=${administrationId}` : this.apiUrl;
    return this.http.get<BoardMember[]>(url);
  }

  create(member: BoardMember): Observable<any> {
    return this.http.post<any>(this.apiUrl, member);
  }

  update(id: number, member: BoardMember): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, member);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
