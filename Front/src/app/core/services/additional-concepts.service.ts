import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdditionalConcept, InvoiceConcept, AssignedUser, ConceptResponse } from '../models/additional-concept.interface';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AdditionalConceptsService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/additional-concepts`;
    private linkUrl = `${environment.apiUrl}/invoice-concepts`;

    getConcepts(): Observable<AdditionalConcept[]> {
        return this.http.get<AdditionalConcept[]>(this.apiUrl);
    }

    getConcept(id: number): Observable<AdditionalConcept> {
        return this.http.get<AdditionalConcept>(`${this.apiUrl}/${id}`);
    }

    createConcept(concept: AdditionalConcept): Observable<ConceptResponse> {
        return this.http.post<ConceptResponse>(this.apiUrl, concept);
    }

    updateConcept(id: number, concept: AdditionalConcept): Observable<ConceptResponse> {
        return this.http.put<ConceptResponse>(`${this.apiUrl}/${id}`, concept);
    }

    deleteConcept(id: number): Observable<ConceptResponse> {
        return this.http.delete<ConceptResponse>(`${this.apiUrl}/${id}`);
    }

    // Links
    linkConceptToInvoice(invoiceId: number, conceptId: number): Observable<{ id: number }> {
        return this.http.post<{ id: number }>(this.linkUrl, { invoice_id: invoiceId, concept_id: conceptId });
    }

    unlinkConcept(id: number): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.linkUrl}/${id}`);
    }

    getAssignedUsers(conceptId: number): Observable<AssignedUser[]> {
        return this.http.get<AssignedUser[]>(`${this.apiUrl}/assigned-users/${conceptId}`);
    }
}
