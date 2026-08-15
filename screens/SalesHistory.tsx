import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    RefreshControl,
    ScrollView,
} from 'react-native';
import { supabase } from '../src/core/supabase/client';
import { costService } from '../src/services/costService';
import { useAppSettings } from '../src/core/settings/AppSettingsContext';
import { createVisualSystem } from '../src/core/theme/visualSystem';
import { EmptyState, FilterChip, LoadingSkeleton, SearchInput, StatusBadge } from '../src/components/ui';
import { SPACING } from '../src/core/theme/tokens';

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
        search: 'Satış ara',
        all: 'Tümü',
        ordersOnly: 'Siparişler',
        manualOnly: 'Manuel',
        sortDate: 'Tarih',
        sortAmount: 'Tutar',
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
        search: 'Search sales',
        all: 'All',
        ordersOnly: 'Orders',
        manualOnly: 'Manual',
        sortDate: 'Date',
        sortAmount: 'Amount',
    };
    const [sales, setSales] = useState<SaleEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [salesSearch, setSalesSearch] = useState('');
    const [sourceFilter, setSourceFilter] = useState<'all' | 'order' | 'manual'>('all');
    const [sortMode, setSortMode] = useState<'date' | 'amount'>('date');

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

    const filteredSales = React.useMemo(() => {
        const q = salesSearch.trim().toLowerCase();
        return sales
            .filter(sale => {
                const matchesSource = sourceFilter === 'all' || sale.source === sourceFilter;
                const haystack = [sale.product_name, sale.size, sale.source, sale.quantity, sale.revenue].join(' ').toLowerCase();
                const matchesSearch = !q || haystack.includes(q);
                return matchesSource && matchesSearch;
            })
            .sort((a, b) => sortMode === 'amount'
                ? b.revenue - a.revenue
                : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
    }, [sales, salesSearch, sortMode, sourceFilter]);

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
                    <StatusBadge label={date} tone="muted" />
                </View>
                <View style={styles.cardBody}>
                    <View>
                        <Text style={styles.metricLabel}>{copy.revenue}</Text>
                        <Text style={styles.revenueText}>{item.revenue.toLocaleString()}₺</Text>
                    </View>
                    <StatusBadge label={`${copy.profit}: ${item.profit.toLocaleString()}₺`} tone="success" />
                </View>
                {item.source && item.source !== 'manual' ? (
                    <StatusBadge label={item.source === 'order' ? copy.orderSource : item.source} tone="primary" style={styles.sourceBadge} />
                ) : null}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={filteredSales}
                keyExtractor={(item, idx) => `${item.id}-${idx}`}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <View style={styles.screenHeader}>
                        <Text style={styles.screenTitle}>{copy.title}</Text>
                        <Text style={styles.screenSubtitle}>{copy.subtitle}</Text>
                        <View style={styles.tools}>
                            <SearchInput value={salesSearch} onChangeText={setSalesSearch} placeholder={copy.search} />
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                                <FilterChip label={copy.all} selected={sourceFilter === 'all'} onPress={() => setSourceFilter('all')} count={sales.length} />
                                <FilterChip label={copy.ordersOnly} selected={sourceFilter === 'order'} onPress={() => setSourceFilter(sourceFilter === 'order' ? 'all' : 'order')} tone="primary" />
                                <FilterChip label={copy.manualOnly} selected={sourceFilter === 'manual'} onPress={() => setSourceFilter(sourceFilter === 'manual' ? 'all' : 'manual')} />
                                <FilterChip label={copy.sortDate} selected={sortMode === 'date'} onPress={() => setSortMode('date')} />
                                <FilterChip label={copy.sortAmount} selected={sortMode === 'amount'} onPress={() => setSortMode('amount')} tone="success" />
                            </ScrollView>
                        </View>
                    </View>
                }
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    loading ? (
                        <LoadingSkeleton rows={5} style={styles.loadingContent} />
                    ) : (
                        <EmptyState icon="₺" title={copy.noSales} description={copy.empty} />
                    )
                }
            />
        </View>
    );
}

function makeStyles(colors: ReturnType<typeof useAppSettings>['colors'], themeMode: 'light' | 'dark') {
const v = createVisualSystem(colors, themeMode);
return StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg.page,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.bg.page,
    },
    loadingContent: {
        width: '100%',
        paddingHorizontal: SPACING.lg,
    },
    listContent: {
        padding: SPACING.lg,
        paddingBottom: SPACING.xxl + SPACING.sm,
    },
    screenHeader: {
        marginBottom: SPACING.md,
    },
    screenTitle: {
        ...v.type.title,
        color: colors.text.primary,
    },
    screenSubtitle: {
        ...v.type.body,
        color: colors.text.secondary,
        marginTop: 3,
    },
    tools: {
        gap: SPACING.sm,
        marginTop: SPACING.md,
    },
    filterRow: {
        gap: SPACING.sm,
        paddingRight: SPACING.xs,
    },
    // Plain divider accent, not status — neutral (matches other screens' card rails).
    card: {
        ...v.card,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        borderLeftWidth: 3,
        borderLeftColor: colors.border.strong,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.sm,
    },
    cardHeaderLeft: {
        flex: 1,
    },
    productName: {
        ...v.type.heading,
        color: colors.text.primary,
        marginBottom: 2,
    },
    sizeText: {
        ...v.type.label,
        color: colors.text.secondary,
    },
    cardBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    revenueText: {
        ...v.type.title,
        color: colors.text.primary,
    },
    metricLabel: {
        ...v.type.label,
        color: colors.text.secondary,
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    sourceBadge: {
        marginTop: SPACING.xs,
        alignSelf: 'flex-start',
    },
});
}
