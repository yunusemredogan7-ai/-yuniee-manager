import { supabase } from '../core/supabase/client';

export type Customer = {
    id: number;
    name: string;
    phone: string | null;
    address: string | null;
    created_at: string;
};

export const customersService = {
    async getCustomers(): Promise<{ data: Customer[] | null, error: unknown }> {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('id', { ascending: false });
        return { data, error };
    },

    async searchCustomers(query: string): Promise<{ data: Customer[] | null, error: unknown }> {
        if (!query.trim()) return { data: [], error: null };
        
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .ilike('name', `%${query}%`)
            .limit(10);
            
        return { data, error };
    },

    async createCustomer(customer: Omit<Customer, 'id' | 'created_at'>): Promise<{ data: Customer | null, error: unknown }> {
        const { data, error } = await supabase
            .from('customers')
            .insert(customer)
            .select()
            .single();
            
        return { data, error };
    }
};
