import { supabase } from '../core/supabase/client';

export type Expense = {
    id: number;
    amount: number;
    category: string;
    note: string | null;
    created_at: string;
};

export const EXPENSE_CATEGORIES = [
    'Rent',
    'Electricity',
    'Water',
    'Internet',
    'Shipping',
    'Fabric',
    'Printing',
    'Packaging',
    'Ads',
    'General',
    'Other',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const expensesService = {
    async getExpenses(limit = 100): Promise<{ data: Expense[] | null; error: unknown }> {
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);
        return { data, error };
    },

    async addExpense(expense: {
        amount: number;
        category: string;
        note?: string;
    }): Promise<{ data: Expense | null; error: unknown }> {
        const { data, error } = await supabase
            .from('expenses')
            .insert({
                amount: expense.amount,
                category: expense.category,
                note: expense.note || null,
            })
            .select()
            .single();
        return { data, error };
    },

    async deleteExpense(id: number): Promise<{ success: boolean; error: unknown }> {
        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id);
        return { success: !error, error };
    },

    async getTotalExpenses(): Promise<number> {
        const { data, error } = await supabase
            .from('expenses')
            .select('amount');
        if (error || !data) return 0;
        return data.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    },

    async getTodayExpenses(): Promise<number> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { data, error } = await supabase
            .from('expenses')
            .select('amount')
            .gte('created_at', today.toISOString());
        if (error || !data) return 0;
        return data.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    },
};
