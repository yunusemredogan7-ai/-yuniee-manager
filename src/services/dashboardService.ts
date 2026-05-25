import { supabase } from '../core/supabase/client';
import { costService } from './costService';

export type TimeRange = 'today' | 'week' | 'month';

function getStartDate(range: TimeRange): string {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    if (range === 'week') {
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
    } else if (range === 'month') {
        d.setDate(1);
    }
    return d.toISOString();
}

export const dashboardService = {
    async getOrdersCount(range: TimeRange = 'today'): Promise<number> {
        const startDate = getStartDate(range);
        const { count, error } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startDate);
        if (error) {
            console.log('getTodayOrders err:', error);
            return 0;
        }
        return count || 0;
    },

    async getRevenue(range: TimeRange = 'today'): Promise<number> {
        const startDate = getStartDate(range);
        let totalRevenue = 0;

        // 1. Revenue from all orders placed in range (regardless of status)
        const { data: orderData } = await supabase
            .from('orders')
            .select('order_items(price, quantity)')
            .gte('created_at', startDate);

        if (orderData) {
            for (const o of orderData) {
                if (Array.isArray(o.order_items)) {
                    for (const item of o.order_items as Record<string, unknown>[]) {
                        totalRevenue += (Number(item.price) || 0) * (Number(item.quantity) || 0);
                    }
                }
            }
        }

        const { data: salesData } = await supabase
            .from('sales')
            .select('revenue')
            .eq('source', 'manual')
            .gte('created_at', startDate);

        if (salesData) {
            for (const s of salesData) {
                totalRevenue += Number(s.revenue) || 0;
            }
        }

        return totalRevenue;
    },

    async getProfit(range: TimeRange = 'today'): Promise<number> {
        const startDate = getStartDate(range);
        let totalProfit = 0;

        // 1. Profit from all orders placed in range
        const { data: orderData } = await supabase
            .from('orders')
            .select('*, order_items(*, products(*))')
            .gte('created_at', startDate);

        if (orderData) {
            for (const o of orderData) {
                let orderRevenue = 0;
                let orderCost = 0;
                const orderItems = Array.isArray(o.order_items) ? o.order_items as Record<string, unknown>[] : [];
                if (orderItems.length > 0) {
                    for (const item of orderItems) {
                        const price = parseFloat(String(item.price)) || 0;
                        const qty = parseInt(String(item.quantity), 10) || 0;
                        const productArray = item.products as Record<string, unknown>[] | undefined;
                        const productObj = item.products as Record<string, unknown> | undefined;
                        
                        let cost = 0;
                        if (Array.isArray(productArray) && productArray.length > 0) {
                            cost = parseFloat(String(productArray[0].cost)) || 0;
                        } else if (productObj && !Array.isArray(productObj)) {
                            cost = parseFloat(String(productObj.cost)) || 0;
                        }

                        orderRevenue += price * qty;
                        orderCost += cost * qty;
                    }
                }

                // Use stored packaging_cost if available, otherwise recalculate dynamically
                let packaging = parseFloat(String(o.packaging_cost)) || 0;
                if (packaging === 0 && orderItems.length > 0) {
                    const costItems = orderItems.map(i => ({
                        product_id: Number(i.product_id),
                        quantity: Number(i.quantity) || 0,
                    }));
                    packaging = await costService.calculateOrderPackagingCost(costItems);
                }

                totalProfit += (orderRevenue - orderCost - packaging);
            }
        }

        const { data: salesData } = await supabase
            .from('sales')
            .select('profit')
            .eq('source', 'manual')
            .gte('created_at', startDate);

        if (salesData) {
            for (const s of salesData) {
                totalProfit += Number(s.profit) || 0;
            }
        }

        return totalProfit;
    },

    async getItemsSold(range: TimeRange = 'today'): Promise<number> {
        const startDate = getStartDate(range);
        let total = 0;

        // 1. Items from orders in range
        const { data: orderData } = await supabase
            .from('orders')
            .select('order_items(quantity)')
            .gte('created_at', startDate);

        if (orderData) {
            for (const order of orderData) {
                if (Array.isArray(order.order_items)) {
                    for (const item of order.order_items as Record<string, unknown>[]) {
                        total += Number(item.quantity) || 0;
                    }
                }
            }
        }

        const { data: salesData } = await supabase
            .from('sales')
            .select('quantity')
            .eq('source', 'manual')
            .gte('created_at', startDate);

        if (salesData) {
            for (const s of salesData) {
                total += Number(s.quantity) || 0;
            }
        }

        return total;
    },

    async getLowStockProducts(): Promise<{ data: Record<string, unknown>[] | null, error: unknown }> {
        const { data, error } = await supabase
            .from('products')
            .select(`
                id,
                name,
                stock (
                    quantity
                )
            `);
            
        if (error || !data) return { data: null, error };

        const lowStock = data.map((p: Record<string, unknown>) => {
            const stockList = Array.isArray(p.stock) ? p.stock : [];
            const totalStock = stockList.reduce((sum: number, s: unknown) => sum + (Number((s as Record<string, unknown>).quantity) || 0), 0);
            return { id: p.id, name: p.name, totalStock };
        }).filter(p => p.totalStock < 10);

        return { data: lowStock, error: null };
    },

    async getTopSellingProducts(range: TimeRange = 'today'): Promise<{ data: Record<string, unknown>[] | null, error: unknown }> {
        const startDate = getStartDate(range);
        
        // group order_items by product_id, order by quantity desc, limit 5
        // Needs a join to orders to filter by date
        const { data, error } = await supabase
            .from('order_items')
            .select(`
                quantity,
                products ( name ),
                orders!inner ( created_at )
            `)
            .gte('orders.created_at', startDate);

        if (error || !data) return { data: null, error };

        const map: Record<string, number> = {};
        for (const item of data) {
            const prodData = item.products as unknown;
            const prod = Array.isArray(prodData) ? prodData[0] : prodData as Record<string, unknown> | null;
            const name = String(prod?.name || 'Unknown');
            map[name] = (map[name] || 0) + (Number(item.quantity) || 0);
        }

        const sorted = Object.entries(map)
            .map(([product_name, total_qty]) => ({ product_name, total_qty: Number(total_qty) }))
            .sort((a, b) => b.total_qty - a.total_qty)
            .slice(0, 5);

        return { data: sorted, error: null };
    }
};
