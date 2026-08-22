export interface User {
    user_id?: number;
    national_id: string;
    first_name: string;
    last_name: string;
    address?: string;
    phone?: string;
    email?: string;
    registration_date?: string;
    status?: boolean | number;
    exempt_from_fines?: boolean | number;
}
