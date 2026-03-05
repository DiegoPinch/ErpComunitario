export interface UserPendingSummary {
    user_id: number;
    user_name: string;
    national_id: string;
    pending_count: number;
    total_debt: string;
}

export interface Invoice {
    invoice_id: number;
    user_id: number;
    billing_month: string;
    total_amount: number;
    issue_date: string;
    status: 'pending' | 'paid';
    details?: any | null;
}

export interface ReadingDetail {
    meter_code: string;
    meter_type: string;
    previous_reading: number;
    current_reading: number;
    consumption: number;
    amount: number;
}

export interface ConceptDetail {
    description: string;
    amount: number;
}

export interface InvoiceDetails {
    readings: ReadingDetail[];
    concepts: ConceptDetail[];
}
