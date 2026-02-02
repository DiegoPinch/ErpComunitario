import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdditionalConcept, InvoiceConcept } from '../models/additional-concept.interface';

@Injectable({
    providedIn: 'root'
})
export class AdditionalConceptsService {
    private apiUrl = 'http://localhost:3000/api/additional-concepts';
    private linkUrl = 'http://localhost:3000/api/invoice-concepts';

    constructor(private http: HttpClient) { }

    getConcepts(): Observable<AdditionalConcept[]> {
        return this.http.get<AdditionalConcept[]>(this.apiUrl);
    }

    getConcept(id: number): Observable<AdditionalConcept> {
        return this.http.get<AdditionalConcept>(`${this.apiUrl}/${id}`);
    }

    createConcept(concept: AdditionalConcept): Observable<any> {
        return this.http.post(this.apiUrl, concept);
    }

    updateConcept(id: number, concept: AdditionalConcept): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, concept);
    }

    deleteConcept(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }

    // Links
    linkConceptToInvoice(invoiceId: number, conceptId: number): Observable<any> {
        return this.http.post(this.linkUrl, { invoice_id: invoiceId, concept_id: conceptId });
    }

    unlinkConcept(id: number): Observable<any> {
        return this.http.delete(`${this.linkUrl}/${id}`);
    }

    getAssignedUsers(conceptId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/assigned-users/${conceptId}`);
    }
}
