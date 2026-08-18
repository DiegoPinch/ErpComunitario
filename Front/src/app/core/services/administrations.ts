import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Administration {
  administration_id?: number;
  name: string;
  start_date: string;
  end_date?: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdministrationsService {
  private apiUrl = `${environment.apiUrl}/administrations`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<Administration[]> {
    return this.http.get<Administration[]>(this.apiUrl);
  }

  getActive(): Observable<Administration> {
    return this.http.get<Administration>(`${this.apiUrl}/active`);
  }

  getById(id: number): Observable<Administration> {
    return this.http.get<Administration>(`${this.apiUrl}/${id}`);
  }

  create(admin: Administration): Observable<any> {
    return this.http.post(this.apiUrl, admin);
  }

  update(id: number, admin: Administration): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, admin);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
