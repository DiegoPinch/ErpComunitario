export interface Meter {
    meter_id?: number;
    code: string;
    type: 'consumo' | 'riego';
    initial_reading: number;
    installation_date: string;
    active: boolean;
    is_assigned?: boolean;
}
