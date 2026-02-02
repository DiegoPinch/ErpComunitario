export interface Rate {
    rate_id?: number;
    meter_type: string;
    unit_price: number;
    base_limit: number;
    excess_price: number;
    active: boolean;
    start_date?: Date | string;
    end_date?: Date | string;
}
