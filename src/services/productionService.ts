import { supabase } from '../core/supabase/client';

export type ProductStock = {
    id: number;
    name: string;
    cost: number;
    stock: { size: string; quantity: number }[];
};

export const productionService = {
    async getProductsWithStock(): Promise<{ data: ProductStock[] | null, error: unknown }> {
        const { data, error } = await supabase
            .from('products')
            .select(`
                id,
                name,
                cost,
                stock (
                    size,
                    quantity
                )
            `)
            .order('id', { ascending: false });
        return { data, error };
    },

    async recordProduction(productId: number, productName: string, sizes: { size: string, qty: number }[]): Promise<{ success: boolean; error: unknown }> {
        try {
            // First log the production movements
            const movements = sizes.map(s => ({
                product_id: productId,
                size: s.size,
                type: 'production',
                quantity: s.qty,
                source: 'Production Entry'
            }));

            const { error: moveError } = await supabase
                .from('stock_movements')
                .insert(movements);
            if (moveError) throw moveError;

            // Fetch current generic stock sizes for this product
            const { data: currentStock, error: fetchErr } = await supabase
                .from('stock')
                .select('*')
                .eq('product_id', productId);
            if (fetchErr) throw fetchErr;

            for (const s of sizes) {
                const current = currentStock?.find(cs => cs.size === s.size);
                if (current) {
                    const { error: updateErr } = await supabase
                        .from('stock')
                        .update({ quantity: current.quantity + s.qty, updated_at: new Date().toISOString() })
                        .eq('id', current.id);
                    if (updateErr) throw updateErr;
                } else {
                    const { error: insertErr } = await supabase
                        .from('stock')
                        .insert({ product_id: productId, size: s.size, quantity: s.qty });
                    if (insertErr) throw insertErr;
                }
            }

            return { success: true, error: null };
        } catch (error) {
            console.log("recordProduction error:", error);
            return { success: false, error };
        }
    }
};
