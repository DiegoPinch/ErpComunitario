export interface GenericResponse {
    message: string;
    result?: any;
}

export interface ReadingStatus {
    meter_id: number;
    meter_code: string;
    meter_type: string;
    status: string;
}

export interface UserAssignmentStatus {
    user_id: number;
    user_name: string;
    national_id: string;
    meters: ReadingStatus[];
}

export interface LatestReadingResponse {
    previous_reading: number;
    month_year: string;
    source: 'reading' | 'initial';
}

export interface CurrentReadingResponse {
    current_reading: number;
    amount: number;
    invoice_status: 'paid' | 'pending';
    invoice_id: number;
}

export interface ProcessReadingRequest {
    user_id: number;
    meter_id: number;
    month_year: string;
    current_reading: number;
}
