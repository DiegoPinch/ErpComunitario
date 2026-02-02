export interface MeterHistory {
    assignment_id?: number;
    meter_id: number;
    user_id: number;
    assignment_date: string;
    removal_date?: string | null;
    assigned: boolean;
    // Campos extra para mostrar en la UI (JOINs)
    meter_code?: string;
    meter_type?: string;
    user_name?: string;
}
