export interface UsersMetersReport {
    user_id: number;
    user_name: string;
    national_id: string;
    address: string;
    phone: string;
    meter_code: string;
    meter_type: string;
    initial_reading: number;
    meter_status: number | string;
    assignment_status: number | string;
}

export interface ReadingsReport {
    month_year: string;
    national_id: string;
    user_name: string;
    meter_code: string;
    meter_type: string;
    previous_reading: number;
    current_reading: number;
    consumption: number;
    consumption_amount: number;
    invoice_total: number;
    invoice_status: string;
}

export interface RecollectionReport {
    payment_date: string;
    billing_month: string;
    national_id: string;
    user_name: string;
    payment_method: string;
    paid_amount: number;
}

export interface DelinquencyReport {
    billing_month: string;
    national_id: string;
    user_name: string;
    status: string;
    total_debt: number;
}

export interface AdditionalChargesReport {
    billing_month: string;
    national_id: string;
    user_name: string;
    concept: string;
    concept_amount: number;
    invoice_status: string;
}

export interface ActiveUsersReport {
    national_id: string;
    user_name: string;
    phone: string;
    email: string;
    address: string;
    status_label: string;
}
