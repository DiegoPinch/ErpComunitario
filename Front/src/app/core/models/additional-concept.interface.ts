export interface AdditionalConcept {
    concept_id?: number;
    description: string;
    amount: number;
    applies_to: 'all' | 'user';
    application_month: string;
}

export interface InvoiceConcept {
    id?: number;
    invoice_id: number;
    concept_id: number;
    status: 'pending' | 'paid';
}
