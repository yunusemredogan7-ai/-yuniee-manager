import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import { supabase } from '../src/core/supabase/client';
import { ordersService } from '../src/services/ordersService';
import { dashboardService, TimeRange } from '../src/services/dashboardService';
import { useAppSettings } from '../src/core/settings/AppSettingsContext';

type TodayOverview = {
    orders: number;
    revenue: number;
    profit: number;
    itemsSold: number;
};

type LowStockProduct = {
    id: number;
    name: string;
    totalStock: number;
};

type TopProduct = {
    product_name: string;
    total_qty: number;
};

type RecentOrder = {
    id: number;
    customer_name: string;
    items: string[];
    status: string;
    total_price: number;
};

export default function Dashboard() {
    const { colors, language, themeMode } = useAppSettings();
    const styles = React.useMemo(() => makeStyles(colors, themeMode), [colors, themeMode]);
    const copy = language === 'tr' ? {
        title: 'Yuniee Yönetim',
        today: 'Bugün',
        week: 'Bu Hafta',
        month: 'Bu Ay',
        orders: 'Siparişler',
        revenue: 'Ciro',
        itemsSold: 'Satılan Ürün',
        profit: 'Kar',
        lowStock: 'Düşük Stok',
        left: 'kaldı',
        wellStocked: 'Tüm ürünlerde stok yeterli',
        topProducts: 'En Çok Satanlar',
        recentOrders: 'Son Siparişler',
        noOrders: 'Henüz sipariş yok',
        noItems: 'Ürün yok',
        sold: 'satıldı',
        statusLabels: {
            Preparing: 'Hazırlanıyor',
            Ready: 'Hazır',
            Shipped: 'Kargoda',
            Delivered: 'Teslim Edildi',
            Cancelled: 'İptal Edildi',
        },
    } : {
        title: 'Yuniee Manager',
        today: 'Today',
        week: 'This Week',
        month: 'This Month',
        orders: 'Orders',
        revenue: 'Revenue',
        itemsSold: 'Items Sold',
        profit: 'Profit',
        lowStock: 'Low Stock',
        left: 'left',
        wellStocked: 'All products well stocked',
        topProducts: 'Top Products',
        recentOrders: 'Recent Orders',
        noOrders: 'No orders yet',
        noItems: 'No items',
        sold: 'sold',
        statusLabels: {
            Preparing: 'Preparing',
            Ready: 'Ready',
            Shipped: 'Shipped',
            Delivered: 'Delivered',
            Cancelled: 'Cancelled',
        },
    };
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [range, setRange] = useState<TimeRange>('today');

    const [overview, setOverview] = useState<TodayOverview>({
        orders: 0,
        revenue: 0,
        profit: 0,
        itemsSold: 0,
    });
    const [lowStock, setLowStock] = useState<LowStockProduct[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

    const fetchAll = useCallback(async () => {
        try {
            const ordersCount = await dashboardService.getOrdersCount(range);
            const revenue = await dashboardService.getRevenue(range);
            const profit = await dashboardService.getProfit(range);
            const itemsSold = await dashboardService.getItemsSold(range);

            setOverview({ orders: ordersCount, revenue, profit, itemsSold });

            const { data: low } = await dashboardService.getLowStockProducts();
            if (low) setLowStock(low as unknown as LowStockProduct[]);

            const { data: top } = await dashboardService.getTopSellingProducts(range);
            if (top) setTopProducts(top as unknown as TopProduct[]);

            const { data: recent } = await ordersService.getOrders(10);
            if (recent) {
                const mappedOrders = recent.map(o => {
                    const orderItems = Array.isArray(o.order_items) ? o.order_items : [];
                    const itemStrings = orderItems.map((item: Record<string, unknown>) => {
                        const prodData = item.products as Record<string, unknown> | null;
                        const productName = prodData ? String(prodData.name || 'Unknown') : 'Unknown';
                        const size = String(item.size || '');
                        const qty = Number(item.quantity || 0);
                        return `${productName} — ${size} × ${qty}`;
                    });
                    return {
                        id: Number(o.id),
                        customer_name: String(o.customer_name || 'Unknown'),
                        items: itemStrings.length > 0 ? itemStrings : [copy.noItems],
                        status: String(o.status || 'Unknown'),
                        total_price: Number(o.total_price) || 0,
                    };
                });
                setRecentOrders(mappedOrders);
            }
        } catch (error) {
            console.log('Dashboard fetchAll error:', error);
        }
    }, [copy.noItems, range]);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchAll().finally(() => setLoading(false));
        }, [fetchAll])
    );

    useEffect(() => {
        const channel = supabase
            .channel('dashboard-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchAll())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => fetchAll())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'stock' }, () => fetchAll())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [fetchAll]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchAll();
        setRefreshing(false);
    }, [fetchAll]);

    const rangeLabels: Record<TimeRange, string> = {
        today: copy.today,
        week: copy.week,
        month: copy.month,
    };

    function getStatusStyle(status: string) {
        switch (status) {
            case 'Preparing': return { bg: '#FEF3C7', text: '#92400E' };
            case 'Ready': return { bg: '#E0E7FF', text: '#3730A3' };
            case 'Shipped': return { bg: '#DBEAFE', text: '#1E40AF' };
            case 'Delivered': return { bg: '#D1FAE5', text: '#065F46' };
            case 'Cancelled': return { bg: '#FEE2E2', text: '#991B1B' };
            default: return { bg: '#F3F4F6', text: '#555' };
        }
    }

    function getStatusLabel(status: string) {
        const normalized = Object.keys(copy.statusLabels).find(s => s.toLowerCase() === status.toLowerCase()) as keyof typeof copy.statusLabels | undefined;
        return normalized ? copy.statusLabels[normalized] : status;
    }

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            {/* ── Header ── */}
            <Text style={styles.title}>{copy.title}</Text>

            {/* ── Time Range ── */}
            <View style={styles.rangeSelector}>
                {(['today', 'week', 'month'] as TimeRange[]).map((r) => (
                    <TouchableOpacity
                        key={r}
                        style={[styles.rangePill, range === r && styles.rangePillActive]}
                        onPress={() => setRange(r)}
                    >
                        <Text style={[styles.rangePillText, range === r && styles.rangePillTextActive]}>
                            {rangeLabels[r]}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* ── KPI Grid ── */}
            <View style={styles.kpiGrid}>
                <View style={[styles.kpiCard, styles.kpiCardOrders]}>
                    <Text style={styles.kpiLabel}>{copy.orders}</Text>
                    <Text style={styles.kpiValue}>{overview.orders}</Text>
                </View>
                <View style={[styles.kpiCard, styles.kpiCardRevenue]}>
                    <Text style={styles.kpiLabel}>{copy.revenue}</Text>
                    <Text style={styles.kpiValue}>{overview.revenue.toLocaleString()}₺</Text>
                </View>
                <View style={[styles.kpiCard, styles.kpiCardItems]}>
                    <Text style={styles.kpiLabel}>{copy.itemsSold}</Text>
                    <Text style={styles.kpiValue}>{overview.itemsSold}</Text>
                </View>
                <View style={[styles.kpiCard, styles.kpiCardProfit]}>
                    <Text style={styles.kpiLabel}>{copy.profit}</Text>
                    <Text style={[
                        styles.kpiValue,
                        overview.profit >= 0 ? styles.profitPositive : styles.profitNegative,
                    ]}>
                        {overview.profit >= 0 ? '' : '−'}{Math.abs(overview.profit).toLocaleString()}₺
                    </Text>
                </View>
            </View>

            {/* ── Low Stock ── */}
            {lowStock.length > 0 && (
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>{copy.lowStock}</Text>
                        <View style={styles.alertBadge}>
                            <Text style={styles.alertBadgeText}>{lowStock.length}</Text>
                        </View>
                    </View>
                    {lowStock.map((item) => {
                        const isCritical = item.totalStock <= 3;
                        return (
                            <View key={item.id} style={[styles.stockAlertRow, isCritical && styles.stockAlertCritical]}>
                                <View style={styles.stockAlertLeft}>
                                    <View style={[styles.severityDot, isCritical ? styles.dotRed : styles.dotYellow]} />
                                    <Text style={styles.stockAlertName}>{item.name}</Text>
                                </View>
                                <Text style={[styles.stockAlertQty, isCritical && styles.stockAlertQtyCritical]}>
                                    {item.totalStock} {copy.left}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            )}

            {lowStock.length === 0 && (
                <View style={styles.wellStockedBanner}>
                    <Text style={styles.wellStockedText}>{copy.wellStocked}</Text>
                </View>
            )}

            {/* ── Top Selling ── */}
            {topProducts.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{copy.topProducts}</Text>
                    {topProducts.map((item, index) => (
                        <View key={item.product_name} style={styles.topRow}>
                            <View style={styles.topRankCircle}>
                                <Text style={styles.topRankText}>{index + 1}</Text>
                            </View>
                            <Text style={styles.topName}>{item.product_name}</Text>
                            <Text style={styles.topQty}>{item.total_qty} {copy.sold}</Text>
                        </View>
                    ))}
                </View>
            )}

            {/* ── Recent Orders ── */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{copy.recentOrders}</Text>
                {recentOrders.length === 0 ? (
                    <View style={styles.emptyBlock}>
                        <Text style={styles.emptyText}>{copy.noOrders}</Text>
                    </View>
                ) : (
                    recentOrders.map((order) => {
                        const statusStyle = getStatusStyle(order.status);
                        return (
                            <View key={order.id} style={styles.recentOrderRow}>
                                <View style={styles.recentOrderLeft}>
                                    <Text style={styles.recentOrderCustomer}>{order.customer_name}</Text>
                                    <Text style={styles.recentOrderItems} numberOfLines={1}>
                                        {order.items.join(', ')}
                                    </Text>
                                </View>
                                <View style={styles.recentOrderRight}>
                                    <View style={[styles.miniStatusBadge, { backgroundColor: statusStyle.bg }]}>
                                        <Text style={[styles.miniStatusText, { color: statusStyle.text }]}>
                                            {getStatusLabel(order.status)}
                                        </Text>
                                    </View>
                                    <Text style={styles.recentOrderPrice}>
                                        {order.total_price.toLocaleString()}₺
                                    </Text>
                                </View>
                            </View>
                        );
                    })
                )}
            </View>

            <View style={styles.bottomSpacer} />
        </ScrollView>
    );
}

function makeStyles(colors: ReturnType<typeof useAppSettings>['colors'], themeMode: 'light' | 'dark') {
return StyleSheet.create({
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.bg,
    },
    container: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: colors.text,
        letterSpacing: -0.5,
        marginBottom: 20,
    },
    // ── Range selector ──
    rangeSelector: {
        flexDirection: 'row',
        backgroundColor: colors.surfaceMuted,
        borderRadius: 10,
        padding: 3,
        marginBottom: 20,
    },
    rangePill: {
        flex: 1,
        paddingVertical: 9,
        alignItems: 'center',
        borderRadius: 8,
    },
    rangePillActive: {
        backgroundColor: themeMode === 'dark' ? '#252b4a' : '#f4f6ff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
    },
    rangePillText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.subtext,
    },
    rangePillTextActive: {
        color: colors.text,
        fontWeight: '700',
    },
    // ── KPI Grid ──
    kpiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 24,
    },
    kpiCard: {
        width: '47%' as unknown as number,
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: colors.border,
    },
    kpiCardOrders: {
        backgroundColor: themeMode === 'dark' ? '#182338' : '#f3f7ff',
        borderColor: themeMode === 'dark' ? '#34466b' : '#dbe8ff',
    },
    kpiCardRevenue: {
        backgroundColor: themeMode === 'dark' ? '#17291f' : '#f2fbf5',
        borderColor: themeMode === 'dark' ? '#335f44' : '#d7f0df',
    },
    kpiCardItems: {
        backgroundColor: themeMode === 'dark' ? '#2f2418' : '#fff7ed',
        borderColor: themeMode === 'dark' ? '#6f4e26' : '#fed7aa',
    },
    kpiCardProfit: {
        borderLeftWidth: 3,
        borderLeftColor: '#4f9d78',
        backgroundColor: themeMode === 'dark' ? '#1d242d' : '#f8fafc',
    },
    kpiLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.subtext,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    kpiValue: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.text,
        letterSpacing: -0.5,
    },
    profitPositive: { color: colors.success },
    profitNegative: { color: colors.danger },
    // ── Sections ──
    section: {
        marginBottom: 24,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.text,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 10,
    },
    // ── Low stock ──
    alertBadge: {
        backgroundColor: colors.danger,
        borderRadius: 10,
        paddingHorizontal: 7,
        paddingVertical: 2,
        marginBottom: 10,
    },
    alertBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    stockAlertRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 10,
        padding: 12,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: '#fee2e2',
    },
    stockAlertCritical: {
        backgroundColor: themeMode === 'dark' ? '#352026' : '#fef2f2',
        borderColor: themeMode === 'dark' ? '#6f3038' : '#fca5a5',
    },
    stockAlertLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    severityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    dotRed: { backgroundColor: colors.danger },
    dotYellow: { backgroundColor: colors.warning },
    stockAlertName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    stockAlertQty: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.danger,
    },
    stockAlertQtyCritical: {
        color: colors.danger,
    },
    wellStockedBanner: {
        backgroundColor: themeMode === 'dark' ? '#183025' : '#f0fdf4',
        borderRadius: 10,
        padding: 12,
        marginBottom: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: themeMode === 'dark' ? '#2e6b4d' : '#bbf7d0',
    },
    wellStockedText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.success,
    },
    // ── Top selling ──
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 10,
        padding: 12,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: colors.border,
    },
    topRankCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: themeMode === 'dark' ? '#252b4a' : '#eef2ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    topRankText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.primary,
    },
    topName: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    topQty: {
        fontSize: 13,
        color: colors.subtext,
        fontWeight: '600',
    },
    // ── Recent orders ──
    recentOrderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 10,
        padding: 12,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: colors.border,
    },
    recentOrderLeft: {
        flex: 1,
        marginRight: 12,
    },
    recentOrderCustomer: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
    },
    recentOrderItems: {
        fontSize: 12,
        color: colors.subtext,
        marginTop: 2,
    },
    recentOrderRight: {
        alignItems: 'flex-end',
        gap: 4,
    },
    miniStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    miniStatusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    recentOrderPrice: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
    },
    // ── Empty ──
    emptyBlock: {
        alignItems: 'center',
        paddingVertical: 20,
        backgroundColor: colors.surface,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
    },
    emptyText: {
        color: colors.subtext,
        fontSize: 14,
    },
    bottomSpacer: {
        height: 40,
    },
});
}
