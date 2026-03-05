export interface ExpenseCategory {
    category_id?: number;
    name: string;
    description?: string;
    created_at?: string;
}

export interface Expense {
    expense_id?: number;
    category_id: number;
    category_name?: string;
    description: string;
    amount: number;
    expense_date: string;
    payment_method?: string;
    reference_number?: string;
    created_at?: string;
}

export interface ConceptCollection {
    concept_id: number;
    description: string;
    total_collected: number;
}

export interface FinancialBalance {
    balance: number;
}
