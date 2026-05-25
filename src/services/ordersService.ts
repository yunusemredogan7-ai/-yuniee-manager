import { supabase } from '../core/supabase/client';
import { costService } from './costService';

export type Order = {
    id: number;
    customer_name: string;
    status: 'Preparing' | 'Ready' | 'Shipped' | 'Delivered' | 'Cancelled';
    total_price: number;
    packaging_cost: number;
    note: string | null;
    source: string | null;
    created_at: string;
};

export type OrderItem = {
    id?: number;
    order_id?: number;
    product_id: number;
    size: string;
    quantity: number;
    price: number;
};

export const ordersService = {
    async createOrder(customerName: string, items: OrderItem[], totalPrice: number, note?: string, source?: string): Promise<{ data: Order | null, error: unknown }> {
        // Calculate dynamic packaging cost based on the ordered items
        const packagingCost = await costService.calculateOrderPackagingCost(items);

        // 1. Insert Order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                customer_name: customerName,
                status: 'Preparing',
                total_price: totalPrice,
                packaging_cost: packagingCost,
                note: note || null,
                source: source || null
            } as any) // Type override needed as generated types resolve dynamically
            .select()
            .single();

        if (orderError || !order) return { data: null, error: orderError };

        // 2. Insert Order Items attached to new order ID
        const itemsToInsert = items.map(i => ({
            order_id: order.id,
            product_id: i.product_id,
            size: i.size,
            quantity: i.quantity,
            price: i.price
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(itemsToInsert);

        if (itemsError) {
            // Rollback order is not natively supported easily without full RPC.
            // But this will log an incomplete order without items. Better to handle edge cases in UI.
            return { data: order, error: itemsError };
        }

        return { data: order, error: null };
    },

    async updateOrderStatus(orderId: number, status: Order['status']): Promise<{ success: boolean, error: unknown }> {
        const { error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', orderId);
            
        return { success: !error, error };
    },

    // Transactional safe delivery
    async deliverOrder(orderId: number): Promise<{ success: boolean, error: unknown }> {
        const { error } = await supabase.rpc('deliver_order_safely', { p_order_id: orderId });
        return { success: !error, error };
    },

    async getTodayOrdersCount(): Promise<number> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { count } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today.toISOString());
        return count || 0;
    },

    async getOrderWithStock(orderId: number): Promise<{ items: { product_id: number; product_name: string; size: string; quantity: number; available_stock: number }[] | null, error: unknown }> {
        try {
            // Fetch order items with product name
            const { data: orderItems, error: itemsError } = await supabase
                .from('order_items')
                .select(`
                    product_id,
                    size,
                    quantity,
                    products ( name )
                `)
                .eq('order_id', orderId);

            if (itemsError || !orderItems) return { items: null, error: itemsError };

            const result: { product_id: number; product_name: string; size: string; quantity: number; available_stock: number }[] = [];

            for (const item of orderItems) {
                const prodData = (item.products as unknown) as Record<string, unknown> | null;
                const productName = prodData ? String(prodData.name || 'Unknown') : 'Unknown';

                // Fetch current stock for this product + size
                const { data: stockData } = await supabase
                    .from('stock')
                    .select('quantity')
                    .eq('product_id', item.product_id)
                    .eq('size', item.size)
                    .maybeSingle();

                result.push({
                    product_id: item.product_id,
                    product_name: productName,
                    size: item.size,
                    quantity: item.quantity,
                    available_stock: stockData?.quantity ?? 0
                });
            }

            return { items: result, error: null };
        } catch (error) {
            return { items: null, error };
        }
    },

    async getOrders(limit?: number): Promise<{ data: Record<string, unknown>[] | null, error: unknown }> {
        let query = supabase
            .from('orders')
            .select(`
                id,
                customer_name,
                status,
                total_price,
                packaging_cost,
                note,
                source,
                created_at,
                order_items (
                    id,
                    product_id,
                    size,
                    quantity,
                    price,
                    products ( name )
                )
            `)
            .order('id', { ascending: false });
            
        if (limit) {
            query = query.limit(limit);
        }
        
        const { data, error } = await query;
        return { data, error };
    }
};
