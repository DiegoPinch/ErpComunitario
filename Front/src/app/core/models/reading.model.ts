export interface ReadingStatus {
    meter_id: number;
    meter_code: string;
    meter_type: string;
    status: 'pending' | 'completed';
}

export interface UserAssignmentStatus {
    user_id: number;
    user_name: string;
    national_id: string;
    meters: ReadingStatus[];
    // Campos calculados localmente para la UI
    pending_count?: number;
    is_fully_completed?: boolean;
}

export interface LatestReadingResponse {
    previous_reading: number;
    month_year: string;
    source: 'reading' | 'initial';
}

export interface CurrentReadingResponse {
    current_reading: number;
    amount: number;
    invoice_status: 'pending' | 'paid' | 'canceled';
    invoice_id: number;
}

export interface ProcessReadingRequest {
    user_id: number;
    meter_id: number;
    month_year: string;
    current_reading: number;
}
