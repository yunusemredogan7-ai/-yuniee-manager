import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    Animated,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { supabase } from '../src/core/supabase/client';
import { ordersService } from '../src/services/ordersService';
import { dashboardService, TimeRange } from '../src/services/dashboardService';
import { useAppSettings } from '../src/core/settings/AppSettingsContext';
import {
    Badge,
    EmptyState,
    KpiCard,
    Section,
    SegmentedControl,
    Skeleton,
    SkeletonGroup,
} from '../src/components/ui';
import type { BadgeTone } from '../src/components/ui';
import { spacing, radii, motion } from '../src/core/design/tokens';
import { typography } from '../src/core/design/typography';

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
    const styles = React.useMemo(() => makeStyles(colors), [colors]);
    const copy = language === 'tr' ? {
        overline: 'YUNIEE',
        title: 'Yönetim Paneli',
        subtitle: 'Operasyonel özet ve canlı veriler',
        today: 'Bugün',
        week: 'Bu Hafta',
        month: 'Bu Ay',
        orders: 'Siparişler',
        revenue: 'Ciro',
        itemsSold: 'Satılan Ürün',
        profit: 'Kar',
        lowStock: 'Düşük Stok',
        lowStockSubtitle: 'Acil ilgi gerektiren ürünler',
        left: 'kaldı',
        wellStocked: 'Stok seviyeleri sağlıklı',
        wellStockedDesc: 'Tüm ürünler güvenli stok aralığında.',
        topProducts: 'En Çok Satanlar',
        recentOrders: 'Son Siparişler',
        recentOrdersSub: 'Son 10 sipariş',
        noOrders: 'Henüz sipariş yok',
        noOrdersDesc: 'İlk sipariş eklendiğinde burada görünür.',
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
        overline: 'YUNIEE',
        title: 'Manager Dashboard',
        subtitle: 'Operational pulse and live insights',
        today: 'Today',
        week: 'This Week',
        month: 'This Month',
        orders: 'Orders',
        revenue: 'Revenue',
        itemsSold: 'Items Sold',
        profit: 'Profit',
        lowStock: 'Low Stock',
        lowStockSubtitle: 'Items that need attention soon',
        left: 'left',
        wellStocked: 'Stock levels are healthy',
        wellStockedDesc: 'All products are within safe inventory range.',
        topProducts: 'Top Products',
        recentOrders: 'Recent Orders',
        recentOrdersSub: 'Latest 10 entries',
        noOrders: 'No orders yet',
        noOrdersDesc: 'The first order will appear here as soon as it lands.',
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

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(8)).current;

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
        if (!loading) {
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: motion.slow, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 0, duration: motion.slow, useNativeDriver: true }),
            ]).start();
        } else {
            fadeAnim.setValue(0);
            slideAnim.setValue(8);
        }
    }, [loading, fadeAnim, slideAnim]);

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

    const rangeOptions = [
        { value: 'today' as TimeRange, label: copy.today },
        { value: 'week' as TimeRange, label: copy.week },
        { value: 'month' as TimeRange, label: copy.month },
    ];

    function getStatusTone(status: string): BadgeTone {
        switch (status) {
            case 'Preparing': return 'warning';
            case 'Ready': return 'primary';
            case 'Shipped': return 'primary';
            case 'Delivered': return 'success';
            case 'Cancelled': return 'danger';
            default: return 'neutral';
        }
    }

    function getStatusLabel(status: string) {
        const normalized = Object.keys(copy.statusLabels).find(
            s => s.toLowerCase() === status.toLowerCase(),
        ) as keyof typeof copy.statusLabels | undefined;
        return normalized ? copy.statusLabels[normalized] : status;
    }

    const formatTL = (n: number) => `${n.toLocaleString()} ₺`;

    if (loading) {
        return (
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <Text style={[typography.overline, { color: colors.textMuted, marginBottom: 4 }]}>
                    {copy.overline}
                </Text>
                <Skeleton width={180} height={28} style={{ marginBottom: 6 }} />
                <Skeleton width={240} height={14} style={{ marginBottom: spacing.xl }} />
                <Skeleton width="100%" height={44} borderRadius={radii.md} style={{ marginBottom: spacing.xl }} />
                <View style={styles.kpiGrid}>
                    {[0, 1, 2, 3].map(i => (
                        <View key={i} style={styles.kpiSkeletonCell}>
                            <SkeletonGroup>
                                <Skeleton width={80} height={12} />
                                <Skeleton width={110} height={28} />
                                <Skeleton width={60} height={12} />
                            </SkeletonGroup>
                        </View>
                    ))}
                </View>
                <SkeletonGroup style={{ marginTop: spacing.xl }}>
                    <Skeleton width="40%" height={18} />
                    <Skeleton width="100%" height={60} borderRadius={radii.md} />
                    <Skeleton width="100%" height={60} borderRadius={radii.md} />
                </SkeletonGroup>
            </ScrollView>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={colors.primary}
                    colors={[colors.primary]}
                />
            }
        >
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                {/* ── Header ── */}
                <View style={styles.headerBlock}>
                    <Text style={[typography.overline, { color: colors.textMuted }]}>
                        {copy.overline}
                    </Text>
                    <Text style={[typography.display, { color: colors.text, marginTop: 2 }]}>
                        {copy.title}
                    </Text>
                    <Text style={[typography.body, { color: colors.subtext, marginTop: 4 }]}>
                        {copy.subtitle}
                    </Text>
                </View>

                {/* ── Time Range ── */}
                <SegmentedControl
                    options={rangeOptions}
                    value={range}
                    onChange={setRange}
                    style={{ marginBottom: spacing.xl }}
                />

                {/* ── KPI Grid ── */}
                <View style={styles.kpiGrid}>
                    <KpiCard
                        label={copy.orders}
                        value={String(overview.orders)}
                        icon="receipt-outline"
                        tone="primary"
                    />
                    <KpiCard
                        label={copy.revenue}
                        value={formatTL(overview.revenue)}
                        icon="trending-up-outline"
                        tone="success"
                    />
                    <KpiCard
                        label={copy.itemsSold}
                        value={String(overview.itemsSold)}
                        icon="cube-outline"
                        tone="warning"
                    />
                    <KpiCard
                        label={copy.profit}
                        value={`${overview.profit < 0 ? '−' : ''}${formatTL(Math.abs(overview.profit))}`}
                        icon={overview.profit >= 0 ? 'arrow-up-circle-outline' : 'arrow-down-circle-outline'}
                        tone={overview.profit >= 0 ? 'success' : 'danger'}
                    />
                </View>

                {/* ── Low Stock ── */}
                {lowStock.length > 0 ? (
                    <Section
                        title={copy.lowStock}
                        subtitle={copy.lowStockSubtitle}
                        action={<Badge label={String(lowStock.length)} tone="danger" dot />}
                    >
                        {lowStock.map(item => {
                            const isCritical = item.totalStock <= 3;
                            return (
                                <View
                                    key={item.id}
                                    style={[
                                        styles.row,
                                        {
                                            backgroundColor: isCritical
                                                ? colors.dangerSoft
                                                : colors.surfaceElevated,
                                            borderColor: isCritical ? colors.danger : colors.border,
                                        },
                                    ]}
                                >
                                    <View style={styles.rowLeft}>
                                        <View
                                            style={[
                                                styles.severityDot,
                                                {
                                                    backgroundColor: isCritical
                                                        ? colors.danger
                                                        : colors.warning,
                                                },
                                            ]}
                                        />
                                        <Text style={[typography.bodyStrong, { color: colors.text }]}>
                                            {item.name}
                                        </Text>
                                    </View>
                                    <Text
                                        style={[
                                            typography.bodyStrong,
                                            { color: isCritical ? colors.danger : colors.warning },
                                        ]}
                                    >
                                        {item.totalStock} {copy.left}
                                    </Text>
                                </View>
                            );
                        })}
                    </Section>
                ) : (
                    <View
                        style={[
                            styles.banner,
                            { backgroundColor: colors.successSoft, borderColor: colors.success },
                        ]}
                    >
                        <Icon name="checkmark-circle" size={20} color={colors.success} />
                        <View style={{ flex: 1 }}>
                            <Text style={[typography.bodyStrong, { color: colors.success }]}>
                                {copy.wellStocked}
                            </Text>
                            <Text style={[typography.caption, { color: colors.subtext, marginTop: 2 }]}>
                                {copy.wellStockedDesc}
                            </Text>
                        </View>
                    </View>
                )}

                {/* ── Top Selling ── */}
                {topProducts.length > 0 && (
                    <Section title={copy.topProducts}>
                        {topProducts.map((item, index) => (
                            <View
                                key={item.product_name}
                                style={[
                                    styles.row,
                                    { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                                ]}
                            >
                                <View style={[styles.rankCircle, { backgroundColor: colors.primarySoft }]}>
                                    <Text style={[typography.caption, { color: colors.primary }]}>
                                        {index + 1}
                                    </Text>
                                </View>
                                <Text
                                    style={[
                                        typography.bodyStrong,
                                        { color: colors.text, flex: 1, marginLeft: spacing.md },
                                    ]}
                                    numberOfLines={1}
                                >
                                    {item.product_name}
                                </Text>
                                <Text style={[typography.caption, { color: colors.subtext }]}>
                                    {item.total_qty} {copy.sold}
                                </Text>
                            </View>
                        ))}
                    </Section>
                )}

                {/* ── Recent Orders ── */}
                <Section title={copy.recentOrders} subtitle={copy.recentOrdersSub}>
                    {recentOrders.length === 0 ? (
                        <EmptyState
                            icon="receipt-outline"
                            title={copy.noOrders}
                            description={copy.noOrdersDesc}
                        />
                    ) : (
                        recentOrders.map(order => (
                            <View
                                key={order.id}
                                style={[
                                    styles.row,
                                    {
                                        backgroundColor: colors.surfaceElevated,
                                        borderColor: colors.border,
                                        alignItems: 'flex-start',
                                    },
                                ]}
                            >
                                <View style={styles.orderLeft}>
                                    <Text style={[typography.bodyStrong, { color: colors.text }]}>
                                        {order.customer_name}
                                    </Text>
                                    <Text
                                        style={[typography.caption, { color: colors.subtext, marginTop: 2 }]}
                                        numberOfLines={1}
                                    >
                                        {order.items.join(', ')}
                                    </Text>
                                </View>
                                <View style={styles.orderRight}>
                                    <Badge
                                        label={getStatusLabel(order.status)}
                                        tone={getStatusTone(order.status)}
                                    />
                                    <Text
                                        style={[
                                            typography.bodyStrong,
                                            { color: colors.text, marginTop: 6 },
                                        ]}
                                    >
                                        {formatTL(order.total_price)}
                                    </Text>
                                </View>
                            </View>
                        ))
                    )}
                </Section>

                <View style={styles.bottomSpacer} />
            </Animated.View>
        </ScrollView>
    );
}

function makeStyles(colors: ReturnType<typeof useAppSettings>['colors']) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.bg,
        },
        content: {
            padding: spacing.xl,
        },
        headerBlock: {
            marginBottom: spacing.xl,
        },
        kpiGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.md,
            marginBottom: spacing.xl,
        },
        kpiSkeletonCell: {
            width: '47%',
            backgroundColor: colors.surfaceElevated,
            borderRadius: radii.lg,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
            padding: spacing.lg,
            minHeight: 110,
            gap: spacing.sm,
        },
        row: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderRadius: radii.md,
            paddingHorizontal: spacing.md + 2,
            paddingVertical: spacing.md,
            borderWidth: StyleSheet.hairlineWidth,
        },
        rowLeft: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            flex: 1,
        },
        severityDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
        },
        banner: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.lg,
            borderRadius: radii.md,
            borderWidth: StyleSheet.hairlineWidth,
            marginBottom: spacing.xl,
        },
        rankCircle: {
            width: 28,
            height: 28,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
        },
        orderLeft: {
            flex: 1,
            marginRight: spacing.md,
        },
        orderRight: {
            alignItems: 'flex-end',
        },
        bottomSpacer: {
            height: spacing.huge,
        },
    });
}

// Kept for backward compatibility if anything imports it elsewhere.
// Pre-refactor helper retained as a no-op style map.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _legacyMakeStyles(_colors: unknown, _themeMode: 'light' | 'dark') {
    return null;
}
