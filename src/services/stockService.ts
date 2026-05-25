import { supabase } from '../core/supabase/client';

export type StockRecord = {
    id: number;
    product_id: number;
    size: string;
    quantity: number;
    updated_at: string;
};

export const stockService = {
    async getStock(): Promise<{ data: StockRecord[] | null, error: unknown }> {
        const { data, error } = await supabase
            .from('stock')
            .select('*')
            .order('updated_at', { ascending: false });
        return { data, error };
    },

    async adjustStock(productId: number, size: string, quantityChange: number, source: string, type: 'production' | 'sale' | 'adjustment' | 'return' = 'adjustment'): Promise<{ success: boolean, error: unknown }> {
        // Since adjustStock requires complex updates securely, we can fetch current stock, update it, and log the movement.
        // Or safely execute via a single transaction RPC if available. For now, sequential secure calls:
        
        try {
            // First log the movement
            const { error: moveError } = await supabase
                .from('stock_movements')
                .insert({
                    product_id: productId,
                    size: size,
                    type: type,
                    quantity: quantityChange,
                    source: source
                });
            if (moveError) throw moveError;

            // Wait, we should probably do standard postgres upsert instead of manual tracking
            // Use RPC if strict consistency is needed, else standard updates:
            // Since we need to update based on existing, we can let PostgreSQL's upsert rules apply.
            // But React Native client requires knowing existing ID to increment safely without RPC unless we fetch first.
            
            const { data: current, error: fetchErr } = await supabase
                .from('stock')
                .select('*')
                .eq('product_id', productId)
                .eq('size', size)
                .single();
            
            if (fetchErr && fetchErr.code !== 'PGRST116') throw fetchErr; // PGRST116 is No Rows Found

            if (!current) {
                if (quantityChange < 0) throw new Error("Cannot drop stock below 0.");
                const { error: insertErr } = await supabase
                    .from('stock')
                    .insert({ product_id: productId, size, quantity: quantityChange });
                if (insertErr) throw insertErr;
            } else {
                const newQty = current.quantity + quantityChange;
                if (newQty < 0) throw new Error("Cannot drop stock below 0.");
                const { error: updateErr } = await supabase
                    .from('stock')
                    .update({ quantity: newQty, updated_at: new Date().toISOString() })
                    .eq('id', current.id);
                if (updateErr) throw updateErr;
            }

            return { success: true, error: null };
        } catch (err) {
            return { success: false, error: err };
        }
    }
};
