import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FineConfiguration {
  config_id?: number;
  name: string;
  fine_type: 'session' | 'minga';
  default_amount: number;
  description?: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FineConfigurationsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/fine-configurations`;

  getConfigs(): Observable<FineConfiguration[]> {
    return this.http.get<FineConfiguration[]>(this.apiUrl);
  }

  getConfig(id: number): Observable<FineConfiguration> {
    return this.http.get<FineConfiguration>(`${this.apiUrl}/${id}`);
  }

  createConfig(config: FineConfiguration): Observable<{ config_id: number; message: string }> {
    return this.http.post<{ config_id: number; message: string }>(this.apiUrl, config);
  }

  updateConfig(id: number, config: FineConfiguration): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/${id}`, config);
  }

  deleteConfig(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
