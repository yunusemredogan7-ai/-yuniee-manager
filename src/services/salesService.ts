import { supabase } from '../core/supabase/client';
import { stockService } from './stockService';

export type SaleRecord = {
    id: number;
    product_id: number;
    quantity: number;
    revenue: number;
    cost: number;
    profit: number;
    created_at: string;
};

export const salesService = {
    async getSales(): Promise<{ data: SaleRecord[] | null, error: unknown }> {
        const { data, error } = await supabase
            .from('sales')
            .select('*')
            .order('created_at', { ascending: false });
        return { data, error };
    },

    async getTodayRevenue(): Promise<{ revenue: number, profit: number, itemsSold: number, error: unknown }> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
            .from('sales')
            .select('revenue, profit, quantity')
            .gte('created_at', today.toISOString());

        if (error || !data) {
            return { revenue: 0, profit: 0, itemsSold: 0, error };
        }

        const totalRevenue = data.reduce((sum, item) => sum + (Number(item.revenue) || 0), 0);
        const totalProfit = data.reduce((sum, item) => sum + (Number(item.profit) || 0), 0);
        const itemsSold = data.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
        
        return { revenue: totalRevenue, profit: totalProfit, itemsSold, error: null };
    },

    async recordSale(productId: number, size: string, quantity: number, price: number, cost: number): Promise<{ success: boolean, error: unknown }> {
        // Safe stock adjustment
        const { success, error: stockErr } = await stockService.adjustStock(productId, size, -quantity, 'Manual Sale', 'sale');
        if (!success || stockErr) return { success: false, error: stockErr };

        const revenue = price * quantity;
        const profit = (price - cost) * quantity;
        
        const { error } = await supabase
            .from('sales')
            .insert({
                product_id: productId,
                quantity,
                revenue,
                cost,
                profit,
                source: 'manual'
            });

        return { success: !error, error };
    }
};
