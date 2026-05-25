import { supabase } from '../core/supabase/client';

export type StockMovement = {
    id: number;
    created_at: string;
    product_id: number;
    size: string;
    quantity: number;
    type: 'production' | 'sale' | 'adjustment' | 'return';
    source: string | null;
    product_name?: string;
};

export const stockMovementsService = {
    async getMovements(limit = 100): Promise<{ data: StockMovement[] | null, error: unknown }> {
        const { data, error } = await supabase
            .from('stock_movements')
            .select(`
                id,
                created_at,
                product_id,
                size,
                quantity,
                type,
                source,
                products(name)
            `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error || !data) {
            return { data: null, error };
        }

        const mappedData = data.map((item: any) => ({
            ...item,
            product_name: Array.isArray(item.products) ? item.products[0]?.name : item.products?.name || 'Unknown Product'
        }));

        return { data: mappedData, error: null };
    }
};
