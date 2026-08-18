import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface InventoryItem {
  item_id?: number;
  code: string;
  name: string;
  category: string;
  description: string;
  unit_measure: string;
  current_stock?: number;
  initial_stock?: number;
  minimum_stock: number;
}

export interface InventoryMovement {
  movement_id?: number;
  item_id: number;
  system_user_id?: number;
  movement_type: 'in' | 'out';
  quantity: number;
  unit_cost: number;
  total_cost?: number;
  movement_date?: string;
  reference: string;
  description: string;
  // joins
  username?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private apiUrl = `${environment.apiUrl}/inventory`;

  constructor(private http: HttpClient) { }

  getItems(): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>(`${this.apiUrl}/items`);
  }

  getItemById(id: number): Observable<InventoryItem> {
    return this.http.get<InventoryItem>(`${this.apiUrl}/items/${id}`);
  }

  createItem(item: InventoryItem): Observable<any> {
    return this.http.post(`${this.apiUrl}/items`, item);
  }

  updateItem(id: number, item: InventoryItem): Observable<any> {
    return this.http.put(`${this.apiUrl}/items/${id}`, item);
  }

  getMovements(itemId: number): Observable<InventoryMovement[]> {
    return this.http.get<InventoryMovement[]>(`${this.apiUrl}/items/${itemId}/movements`);
  }

  createMovement(movement: InventoryMovement): Observable<any> {
    return this.http.post(`${this.apiUrl}/movements`, movement);
  }
}
