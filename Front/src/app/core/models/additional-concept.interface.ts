export interface AdditionalConcept {
    concept_id?: number;
    description: string;
    amount: number;
    applies_to: 'all' | 'individual';
    application_month?: string;
    created_at?: string;
}

export interface InvoiceConcept {
    id: number;
    invoice_id: number;
    concept_id: number;
}

export interface AssignedUser {
    invoice_concept_id: number;
    invoice_id: number;
    user_id: number;
    user_name: string;
    national_id: string;
    billing_month: string;
    invoice_status: 'paid' | 'pending';
    amount: number;
}

export interface ConceptResponse {
    concept_id?: number;
    updated?: number;
    deleted?: number;
    message?: string;
}
