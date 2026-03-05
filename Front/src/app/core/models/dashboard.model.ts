export interface DashboardKPIs {
    activeUsers: number;
    meterDistribution: { type: string; count: number }[];
    monthlyRevenue: number;
    totalPendingDebt: number;
}

export interface RevenueHistory {
    month: string;
    water_amount: number;
    additional_amount: number;
}

export interface ConsumptionTrend {
    month: string;
    domestic_consumption: number;
    irrigation_consumption: number;
}

export interface CriticalDebtor {
    user_id: number;
    name: string;
    national_id: string;
    months_debt: number;
    total_amount: number;
}

export interface DashboardStats {
    kpis: DashboardKPIs;
    revenueHistory: RevenueHistory[];
    consumptionTrend: ConsumptionTrend[];
    criticalDebtors: CriticalDebtor[];
}
