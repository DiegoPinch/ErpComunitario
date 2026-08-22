import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface LoginResponse {
  token: string;
  role: string;
  board_role: string | null;
  username: string;
  user_id: number;
  first_name?: string;
  last_name?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl}/auth`;

  login(credentials: { username: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => this.setSession(res))
    );
  }

  private setSession(authResult: LoginResponse) {
    localStorage.setItem('token', authResult.token);
    localStorage.setItem('role', authResult.role);
    localStorage.setItem('username', authResult.username);
    localStorage.setItem('user_id', authResult.user_id.toString());
    localStorage.setItem('first_name', authResult.first_name || '');
    localStorage.setItem('last_name', authResult.last_name || '');
    if (authResult.board_role) {
      localStorage.setItem('board_role', authResult.board_role);
    } else {
      localStorage.removeItem('board_role');
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('board_role');
    localStorage.removeItem('username');
    localStorage.removeItem('user_id');
    localStorage.removeItem('first_name');
    localStorage.removeItem('last_name');
    this.router.navigate(['/']);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }

  getBoardRole(): string | null {
    return localStorage.getItem('board_role');
  }

  getUsername(): string | null {
    return localStorage.getItem('username');
  }

  getUserId(): number | null {
    const id = localStorage.getItem('user_id');
    return id ? parseInt(id, 10) : null;
  }

  getFirstName(): string {
    return localStorage.getItem('first_name') || '';
  }

  getLastName(): string {
    return localStorage.getItem('last_name') || '';
  }

  getFullName(): string {
    const fn = this.getFirstName();
    const ln = this.getLastName();
    if (!fn && !ln) {
      return this.getRole() === 'admin' ? 'Administrador Técnico' : 'Usuario';
    }
    return `${fn} ${ln}`.trim();
  }

  changePassword(payload: { oldPassword: string; newPassword: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/change-password`, payload);
  }
}
