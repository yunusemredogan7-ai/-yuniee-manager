import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { supabase } from '../src/core/supabase/client';
import { costService } from '../src/services/costService';
import { useAppSettings } from '../src/core/settings/AppSettingsContext';

type SaleEntry = {
    id: number;
    product_name: string;
    quantity: number;
    revenue: number;
    profit: number;
    created_at: string;
    size: string | null;
    source: string | null;
};

export default function SalesHistory() {
    const { colors, language, themeMode } = useAppSettings();
    const styles = React.useMemo(() => makeStyles(colors, themeMode), [colors, themeMode]);
    const copy = language === 'tr' ? {
        qty: 'Adet',
        profit: 'Kar',
        noSales: 'Henüz satış yok',
        empty: 'Teslim edilen siparişler ve manuel satışlar burada görünür.',
        unknown: 'Bilinmeyen',
        orderSource: 'Sipariş',
        title: 'Satış Geçmişi',
        subtitle: 'Teslim edilen siparişler, ciro ve kar takibi.',
        revenue: 'Ciro',
    } : {
        qty: 'Qty',
        profit: 'Profit',
        noSales: 'No sales yet',
        empty: 'Delivered orders and manual sales will appear here.',
        unknown: 'Unknown',
        orderSource: 'Order',
        title: 'Sales History',
        subtitle: 'Delivered orders, revenue, and profit trail.',
        revenue: 'Revenue',
    };
    const [sales, setSales] = useState<SaleEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchSales = useCallback(async () => {
        try {
            // Fetch from sales table (manual sales)
            const { data: salesData, error: salesError } = await supabase
                .from('sales')
                .select(`
                    id,
                    quantity,
                    revenue,
                    cost,
                    created_at,
                    products ( name )
                `)
                .order('created_at', { ascending: false })
                .limit(100);

            if (salesError) {
                console.log('fetchSales sales query error:', salesError);
                // Don't return early, so we at least try to fetch delivered orders
            }

            // Also fetch delivered orders as sales
            const { data: deliveredData } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items (
                        *,
                        products ( * )
                    )
                `)
                .eq('status', 'Delivered')
                .order('created_at', { ascending: false })
                .limit(100);

            const manualSales: SaleEntry[] = (salesData || []).map((item: any) => {
                const prodData = Array.isArray(item.products) ? item.products[0] : item.products;
                const qty = Number(item.quantity) || 0;
                const costPerItem = Number(item.cost) || 0;
                const revenue = Number(item.revenue) || 0;
                const profit = revenue - (costPerItem * qty);

                return {
                    id: item.id,
                    product_name: prodData?.name || copy.unknown,
                    quantity: qty,
                    revenue: revenue,
                    profit: profit,
                    created_at: item.created_at,
                    size: null,
                    source: 'manual',
                };
            });

            const orderSales: SaleEntry[] = [];
            if (deliveredData) {
                for (const order of deliveredData) {
                    const items = Array.isArray(order.order_items) ? order.order_items : [];
                    
                    let totalOrderQty = 0;
                    for (const item of items as Record<string, any>[]) {
                        totalOrderQty += Number(item.quantity) || 0;
                    }

                    // Use stored packaging_cost if available, otherwise recalculate dynamically
                    let packagingCost = parseFloat(String(order.packaging_cost)) || 0;
                    if (packagingCost === 0 && items.length > 0) {
                        // Recalculate from current packaging rules for legacy orders
                        const costItems = (items as Record<string, any>[]).map(i => ({
                            product_id: Number(i.product_id),
                            quantity: Number(i.quantity) || 0,
                        }));
                        packagingCost = await costService.calculateOrderPackagingCost(costItems);
                    }

                    for (const item of items as Record<string, any>[]) {
                        const prod = Array.isArray(item.products) ? item.products[0] : item.products;
                        const price = parseFloat(String(item.price)) || 0;
                        const cost = parseFloat(String(prod?.cost)) || 0;
                        const qty = parseInt(String(item.quantity), 10) || 0;
                        
                        const itemSharePkg = totalOrderQty > 0 ? (qty / totalOrderQty) * packagingCost : 0;
                        const profit = (price - cost) * qty - itemSharePkg;

                        orderSales.push({
                            id: Number(`${order.id}${item.size || ''}`
                                .split('')
                                .reduce((a, c) => a + c.charCodeAt(0), 0)),
                            product_name: prod?.name || copy.unknown,
                            quantity: qty,
                            revenue: price * qty,
                            profit: profit,
                            created_at: order.created_at,
                            size: item.size || null,
                            source: 'order',
                        });
                    }
                }
            }

            // Combine and sort by date
            const combined = [...manualSales, ...orderSales]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setSales(combined);
        } catch (err) {
            console.log('fetchSales catch:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [copy.unknown]);

    useFocusEffect(
        useCallback(() => {
            fetchSales();
        }, [fetchSales])
    );

    useEffect(() => {

        const channel = supabase
            .channel('sales-history-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => fetchSales())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchSales())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [fetchSales]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchSales();
    };

    function renderItem({ item }: { item: SaleEntry }) {
        const date = new Date(item.created_at).toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                        <Text style={styles.productName}>{item.product_name}</Text>
                        {item.size ? (
                            <Text style={styles.sizeText}>{item.size} • {copy.qty}: {item.quantity}</Text>
                        ) : (
                            <Text style={styles.sizeText}>{copy.qty}: {item.quantity}</Text>
                        )}
                    </View>
                    <Text style={styles.dateText}>{date}</Text>
                </View>
                <View style={styles.cardBody}>
                    <View>
                        <Text style={styles.metricLabel}>{copy.revenue}</Text>
                        <Text style={styles.revenueText}>{item.revenue.toLocaleString()}₺</Text>
                    </View>
                    <Text style={styles.profitText}>
                        {copy.profit}: {item.profit.toLocaleString()}₺
                    </Text>
                </View>
                {item.source && item.source !== 'manual' ? (
                    <Text style={styles.sourceText}>{item.source === 'order' ? copy.orderSource : item.source}</Text>
                ) : null}
            </View>
        );
    }

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={colors.success} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={sales}
                keyExtractor={(item, idx) => `${item.id}-${idx}`}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <View style={styles.screenHeader}>
                        <Text style={styles.screenTitle}>{copy.title}</Text>
                        <Text style={styles.screenSubtitle}>{copy.subtitle}</Text>
                    </View>
                }
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>📈</Text>
                        <Text style={styles.emptyTitle}>{copy.noSales}</Text>
                        <Text style={styles.emptyDesc}>
                            {copy.empty}
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

function makeStyles(colors: ReturnType<typeof useAppSettings>['colors'], themeMode: 'light' | 'dark') {
return StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.bg,
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    screenHeader: {
        marginBottom: 14,
    },
    screenTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.text,
        letterSpacing: -0.4,
    },
    screenSubtitle: {
        fontSize: 14,
        color: colors.subtext,
        lineHeight: 20,
        marginTop: 3,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: colors.border,
        borderLeftWidth: 3,
        borderLeftColor: themeMode === 'dark' ? '#335f44' : '#bbf7d0',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    cardHeaderLeft: {
        flex: 1,
    },
    productName: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 2,
    },
    sizeText: {
        fontSize: 13,
        color: colors.subtext,
    },
    dateText: {
        fontSize: 12,
        color: colors.subtext,
        marginLeft: 10,
    },
    cardBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    revenueText: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text,
    },
    metricLabel: {
        fontSize: 11,
        color: colors.subtext,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    profitText: {
        fontSize: 14,
        color: colors.success,
        fontWeight: '700',
    },
    sourceText: {
        marginTop: 6,
        fontSize: 11,
        color: colors.primary,
        fontWeight: '600',
        backgroundColor: themeMode === 'dark' ? '#252b4a' : '#eef2ff',
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4,
        overflow: 'hidden',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyIcon: {
        fontSize: 40,
        marginBottom: 12,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 6,
    },
    emptyDesc: {
        fontSize: 14,
        color: colors.subtext,
        textAlign: 'center',
    },
});
}
