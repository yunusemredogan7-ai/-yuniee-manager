import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
} from 'react-native';
import { supabase } from '../src/core/supabase/client';
import { ordersService } from '../src/services/ordersService';
import { dashboardService, TimeRange } from '../src/services/dashboardService';
import { notificationService } from '../src/services/notificationService';
import { productsService } from '../src/services/productsService';
import { Task, todoService } from '../src/services/todoService';
import { useAppSettings } from '../src/core/settings/AppSettingsContext';
import { createVisualSystem } from '../src/core/theme/visualSystem';
import { EmptyState, LoadingSkeleton, NotificationCenter, SectionHeader, SegmentedControl, StatusBadge, SyncStatus, WarningCard } from '../src/components/ui';
import { AppNotification } from '../src/core/notifications/notificationTypes';
import { RADIUS, SPACING } from '../src/core/theme/tokens';

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
    source: string | null;
    total_price: number;
};

const FOCUS_FRESH_MS = 15000;
const SECONDARY_LOAD_DELAY_MS = 80;
const REALTIME_DEBOUNCE_MS = 450;

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
        needsAttention: 'Dikkat Gerekenler',
        ordersWaiting: 'Hazırlık veya kargo akışında bekleyen siparişler var.',
        noPriorities: 'Bugün için kritik uyarı yok.',
        synced: 'Senkron',
        refreshing: 'Yenileniyor...',
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
        needsAttention: 'Needs Attention',
        ordersWaiting: 'Some orders are still in the preparation or shipping flow.',
        noPriorities: 'No critical alerts for today.',
        synced: 'Synced',
        refreshing: 'Refreshing...',
    };
    const navigation = useNavigation<any>();
    const [loading, setLoading] = useState(true);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [secondaryLoading, setSecondaryLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
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
    const [sharedTasks, setSharedTasks] = useState<Task[]>([]);
    const [missingCostProducts, setMissingCostProducts] = useState<{ id: number; name: string; cost: number }[]>([]);
    const fetchingRef = useRef(false);
    const hasLoadedRef = useRef(false);
    const lastFetchRef = useRef(0);
    const lastFetchRangeRef = useRef<TimeRange | null>(null);
    const realtimeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchAll = useCallback(async (force = false) => {
        const now = Date.now();
        if (!force && hasLoadedRef.current && lastFetchRangeRef.current === range && now - lastFetchRef.current < FOCUS_FRESH_MS) {
            return;
        }
        if (fetchingRef.current) return;
        fetchingRef.current = true;
        setSecondaryLoading(true);
        try {
            await Promise.all([
                dashboardService.getOrdersCount(range),
                dashboardService.getRevenue(range),
                dashboardService.getProfit(range),
                dashboardService.getItemsSold(range),
            ]).then(([ordersCount, revenue, profit, itemsSold]) => {
                setOverview({ orders: ordersCount, revenue, profit, itemsSold });
                setHasLoaded(true);
                hasLoadedRef.current = true;
                setLoading(false);
            });

            await new Promise<void>(resolve => setTimeout(() => resolve(), SECONDARY_LOAD_DELAY_MS));

            await Promise.all([
                dashboardService.getLowStockProducts(),
                dashboardService.getTopSellingProducts(range),
                ordersService.getOrders(10),
                todoService.getTasks('yuniee'),
                productsService.getProducts(),
            ]).then(([low, top, recent, tasks, products]) => {
                if (low.data) setLowStock(low.data as unknown as LowStockProduct[]);

                if (top.data) setTopProducts(top.data as unknown as TopProduct[]);

                if (recent.data) {
                    const mappedOrders = recent.data.map(o => {
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
                            source: o.source ? String(o.source) : null,
                            total_price: Number(o.total_price) || 0,
                        };
                    });
                    setRecentOrders(mappedOrders);
                }
                if (tasks.data) setSharedTasks(tasks.data);

                if (products.data) {
                    setMissingCostProducts(products.data
                        .filter(product => Number(product.cost) <= 0)
                        .map(product => ({ id: product.id, name: product.name, cost: product.cost })));
                }
            }).finally(() => setSecondaryLoading(false));
            setLastUpdated(new Date());
            lastFetchRef.current = Date.now();
            lastFetchRangeRef.current = range;
        } catch (error) {
            console.log('Dashboard fetchAll error:', error);
        } finally {
            fetchingRef.current = false;
            setLoading(false);
            setSecondaryLoading(false);
        }
    }, [copy.noItems, range]);

    useFocusEffect(
        useCallback(() => {
            if (!hasLoadedRef.current) setLoading(true);
            fetchAll().finally(() => setLoading(false));
        }, [fetchAll])
    );

    const scheduleRealtimeFetch = useCallback(() => {
        if (realtimeTimerRef.current) clearTimeout(realtimeTimerRef.current);
        realtimeTimerRef.current = setTimeout(() => {
            realtimeTimerRef.current = null;
            fetchAll(true);
        }, REALTIME_DEBOUNCE_MS);
    }, [fetchAll]);

    useEffect(() => {
        const channel = supabase
            .channel('dashboard-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, scheduleRealtimeFetch)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, scheduleRealtimeFetch)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'stock' }, scheduleRealtimeFetch)
            .subscribe();

        return () => {
            if (realtimeTimerRef.current) clearTimeout(realtimeTimerRef.current);
            supabase.removeChannel(channel);
        };
    }, [scheduleRealtimeFetch]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchAll(true);
        setRefreshing(false);
    }, [fetchAll]);

    const rangeLabels: Record<TimeRange, string> = {
        today: copy.today,
        week: copy.week,
        month: copy.month,
    };

    function getStatusLabel(status: string) {
        const normalized = Object.keys(copy.statusLabels).find(s => s.toLowerCase() === status.toLowerCase()) as keyof typeof copy.statusLabels | undefined;
        return normalized ? copy.statusLabels[normalized] : status;
    }

    const attentionOrders = recentOrders.filter(order => !['Delivered', 'Cancelled'].includes(order.status));
    const notifications: AppNotification[] = [
        ...notificationService.buildOrderNotifications(recentOrders),
        ...notificationService.buildLowStockNotifications(lowStock),
        ...notificationService.buildTaskNotifications(sharedTasks),
        ...notificationService.buildProductCostNotifications(missingCostProducts),
    ].sort((a, b) => {
        const weight = { danger: 0, warning: 1, info: 2, success: 3 };
        return weight[a.severity] - weight[b.severity];
    });

    const firstLoad = loading && !hasLoaded;
    const secondaryFirstLoad = secondaryLoading && !lastUpdated;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            {/* ── Header ── */}
            <View style={styles.titleRow}>
                <Text style={styles.title}>{copy.title}</Text>
                <SyncStatus timestamp={lastUpdated} syncing={refreshing || loading || secondaryLoading} label={copy.synced} syncingLabel={copy.refreshing} />
            </View>

            {/* ── Time Range ── */}
            <SegmentedControl
                value={range}
                onChange={setRange}
                options={(['today', 'week', 'month'] as TimeRange[]).map(r => ({ value: r, label: rangeLabels[r] }))}
            />

            {firstLoad || secondaryFirstLoad ? (
                <LoadingSkeleton rows={2} style={styles.sectionSkeleton} />
            ) : attentionOrders.length > 0 ? (
                <WarningCard
                    title={`${attentionOrders.length} ${copy.needsAttention}`}
                    description={copy.ordersWaiting}
                    tone="warning"
                    style={styles.dashboardWarning}
                />
            ) : null}

            {!firstLoad && !secondaryFirstLoad ? (
                <NotificationCenter
                    title={copy.needsAttention}
                    emptyText={copy.noPriorities}
                    notifications={notifications}
                    onPressItem={(item) => {
                        if (item.target?.screen) navigation.navigate(item.target.screen);
                    }}
                />
            ) : null}

            {/* ── KPI Grid ── */}
            {firstLoad ? (
                <LoadingSkeleton rows={4} variant="metric" style={styles.loadingContent} />
            ) : (
                <View style={styles.kpiGrid}>
                    <View style={styles.kpiCard}>
                        <Text style={styles.kpiLabel}>{copy.orders}</Text>
                        <Text style={styles.kpiValue}>{overview.orders}</Text>
                    </View>
                    <View style={styles.kpiCard}>
                        <Text style={styles.kpiLabel}>{copy.revenue}</Text>
                        <Text style={styles.kpiValue}>{overview.revenue.toLocaleString()}₺</Text>
                    </View>
                    <View style={styles.kpiCard}>
                        <Text style={styles.kpiLabel}>{copy.itemsSold}</Text>
                        <Text style={styles.kpiValue}>{overview.itemsSold}</Text>
                    </View>
                    {/* Profit is the only KPI tile whose color is real status (its sign), not decoration. */}
                    <View style={[styles.kpiCard, overview.profit >= 0 ? styles.kpiCardProfitPositive : styles.kpiCardProfitNegative]}>
                        <Text style={styles.kpiLabel}>{copy.profit}</Text>
                        <Text style={[
                            styles.kpiValue,
                            overview.profit >= 0 ? styles.profitPositive : styles.profitNegative,
                        ]}>
                            {overview.profit >= 0 ? '' : '−'}{Math.abs(overview.profit).toLocaleString()}₺
                        </Text>
                    </View>
                </View>
            )}

            {/* ── Low Stock ── */}
            {lowStock.length > 0 && (
                <View style={styles.section}>
                    <SectionHeader
                        title={copy.lowStock}
                        right={<StatusBadge label={String(lowStock.length)} tone="danger" />}
                    />
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

            {!firstLoad && lowStock.length === 0 && (
                <View style={styles.wellStockedBanner}>
                    <Text style={styles.wellStockedText}>{copy.wellStocked}</Text>
                </View>
            )}

            {/* ── Top Selling ── */}
            {topProducts.length > 0 && (
                <View style={styles.section}>
                    <SectionHeader title={copy.topProducts} />
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
                <SectionHeader title={copy.recentOrders} />
                {firstLoad || secondaryFirstLoad ? (
                    <LoadingSkeleton rows={3} />
                ) : recentOrders.length === 0 ? (
                    <EmptyState
                        icon="□"
                        title={copy.noOrders}
                        description={language === 'tr' ? 'Yeni siparişler burada görünecek.' : 'New operational orders will appear here.'}
                    />
                ) : (
                    recentOrders.map((order) => {
                        return (
                            <View key={order.id} style={styles.recentOrderRow}>
                                <View style={styles.recentOrderLeft}>
                                    <Text style={styles.recentOrderCustomer}>{order.customer_name}</Text>
                                    <Text style={styles.recentOrderItems} numberOfLines={1}>
                                        {order.items.join(', ')}
                                    </Text>
                                </View>
                                <View style={styles.recentOrderRight}>
                                    <StatusBadge
                                        label={getStatusLabel(order.status)}
                                        tone={order.status === 'Delivered' ? 'success' : order.status === 'Cancelled' ? 'danger' : 'primary'}
                                    />
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
const v = createVisualSystem(colors, themeMode);
return StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg.page,
    },
    content: {
        padding: SPACING.lg,
    },
    loadingContent: { width: '100%' },
    sectionSkeleton: {
        marginBottom: SPACING.lg,
    },
    title: {
        ...v.type.title,
        color: colors.text.primary,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: SPACING.md,
        marginBottom: SPACING.xl,
    },
    // ── KPI Grid ──
    dashboardWarning: {
        marginBottom: SPACING.xl,
    },
    kpiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.md,
        marginBottom: SPACING.xl,
    },
    kpiCard: {
        width: '47%' as unknown as number,
        ...v.card,
    },
    // Profit is the only KPI tile whose color is real status (its sign),
    // not decoration — Orders/Revenue/Items Sold stay on the plain card.
    kpiCardProfitPositive: {
        ...v.successSurface,
    },
    kpiCardProfitNegative: {
        ...v.dangerSurface,
    },
    kpiLabel: {
        ...v.type.label,
        color: colors.text.secondary,
        textTransform: 'uppercase',
        marginBottom: SPACING.xs,
    },
    kpiValue: {
        ...v.type.title,
        color: colors.text.primary,
    },
    profitPositive: { color: colors.status.success.fg },
    profitNegative: { color: colors.status.danger.fg },
    // ── Sections ──
    section: {
        marginBottom: SPACING.xl,
    },
    // ── Low stock ──
    stockAlertRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...v.cardCompact,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        borderColor: colors.status.danger.bg,
    },
    stockAlertCritical: {
        ...v.dangerSurface,
    },
    stockAlertLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    severityDot: {
        width: 8,
        height: 8,
        borderRadius: RADIUS.pill,
    },
    dotRed: { backgroundColor: colors.status.danger.fg },
    dotYellow: { backgroundColor: colors.status.warning.fg },
    stockAlertName: {
        ...v.type.body,
        fontWeight: '600',
        color: colors.text.primary,
    },
    stockAlertQty: {
        ...v.type.label,
        color: colors.status.danger.fg,
    },
    stockAlertQtyCritical: {
        color: colors.status.danger.fg,
    },
    wellStockedBanner: {
        ...v.successSurface,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        marginBottom: SPACING.xl,
        alignItems: 'center',
        borderWidth: 1,
    },
    wellStockedText: {
        ...v.type.label,
        color: colors.status.success.fg,
    },
    // ── Top selling ──
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        ...v.cardCompact,
        marginBottom: SPACING.sm,
    },
    topRankCircle: {
        width: 26,
        height: 26,
        borderRadius: RADIUS.pill,
        backgroundColor: colors.bg.raised,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.sm,
    },
    topRankText: {
        ...v.type.label,
        color: colors.text.primary,
    },
    topName: {
        flex: 1,
        ...v.type.body,
        fontWeight: '600',
        color: colors.text.primary,
    },
    topQty: {
        ...v.type.label,
        color: colors.text.secondary,
    },
    // ── Recent orders ──
    recentOrderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...v.cardCompact,
        marginBottom: SPACING.sm,
    },
    recentOrderLeft: {
        flex: 1,
        marginRight: SPACING.md,
    },
    recentOrderCustomer: {
        ...v.type.body,
        fontWeight: '700',
        color: colors.text.primary,
    },
    recentOrderItems: {
        ...v.type.caption,
        color: colors.text.secondary,
        marginTop: SPACING.xs,
    },
    recentOrderRight: {
        alignItems: 'flex-end',
        gap: SPACING.xs,
    },
    recentOrderPrice: {
        ...v.type.body,
        fontWeight: '700',
        color: colors.text.primary,
    },
    bottomSpacer: {
        height: SPACING.xxl + SPACING.sm,
    },
});
}
