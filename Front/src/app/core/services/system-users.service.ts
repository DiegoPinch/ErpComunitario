import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SystemUser {
  system_user_id?: number;
  user_id: number;
  username: string;
  password?: string;
  role: 'admin' | 'board' | 'user';
  status: boolean | number;
  // Extras joined from users table
  first_name?: string;
  last_name?: string;
  national_id?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SystemUsersService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/system-users`;

  getAll(): Observable<SystemUser[]> {
    return this.http.get<SystemUser[]>(this.apiUrl);
  }

  getById(id: number): Observable<SystemUser> {
    return this.http.get<SystemUser>(`${this.apiUrl}/${id}`);
  }

  create(user: SystemUser): Observable<any> {
    return this.http.post<any>(this.apiUrl, user);
  }

  update(id: number, user: SystemUser): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, user);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
