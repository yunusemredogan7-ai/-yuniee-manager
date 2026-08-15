import React, { useState, useCallback, useRef } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    ScrollView,
} from 'react-native';
import { dashboardService } from '../src/services/dashboardService';
import { expensesService } from '../src/services/expensesService';
import { useAppSettings } from '../src/core/settings/AppSettingsContext';
import { createVisualSystem } from '../src/core/theme/visualSystem';
import { LoadingSkeleton, MetricCard, SectionHeader } from '../src/components/ui';
import { RADIUS, SPACING } from '../src/core/theme/tokens';

const FOCUS_FRESH_MS = 15000;

export default function FinanceOverview() {
    const { colors, language, themeMode } = useAppSettings();
    const styles = React.useMemo(() => makeStyles(colors, themeMode), [colors, themeMode]);
    const copy = language === 'tr' ? {
        title: 'Finans',
        performance: 'BUGÜNÜN PERFORMANSI',
        revenue: 'Ciro',
        itemsSold: 'Satılan Ürün',
        grossProfit: 'Brüt Kar',
        expenses: 'Giderler',
        netProfit: 'Net Kar',
        salesExpenses: 'SATIŞ & GİDERLER',
        salesHistory: 'Satış Geçmişi',
    } : {
        title: 'Finance',
        performance: "TODAY'S PERFORMANCE",
        revenue: 'Revenue',
        itemsSold: 'Items Sold',
        grossProfit: 'Gross Profit',
        expenses: 'Expenses',
        netProfit: 'Net Profit',
        salesExpenses: 'SALES & EXPENSES',
        salesHistory: 'Sales History',
    };
    const navigation = useNavigation<any>();
    const [loading, setLoading] = useState(true);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [revenue, setRevenue] = useState(0);
    const [profit, setProfit] = useState(0);
    const [itemsSold, setItemsSold] = useState(0);
    const [todayExpenses, setTodayExpenses] = useState(0);
    const fetchingRef = useRef(false);
    const lastFetchRef = useRef(0);

    const fetchData = useCallback(async (force = false) => {
        if (!force && lastFetchRef.current > 0 && Date.now() - lastFetchRef.current < FOCUS_FRESH_MS) {
            setLoading(false);
            setRefreshing(false);
            return;
        }
        if (fetchingRef.current) {
            setRefreshing(false);
            return;
        }
        fetchingRef.current = true;
        try {
            const [rev, prof, items, expenses] = await Promise.all([
                dashboardService.getRevenue(),
                dashboardService.getProfit(),
                dashboardService.getItemsSold(),
                expensesService.getTodayExpenses(),
            ]);
            setRevenue(rev);
            setProfit(prof);
            setItemsSold(items);
            setTodayExpenses(expenses);
            setHasLoaded(true);
            lastFetchRef.current = Date.now();
        } catch (err) {
            console.log('FinanceOverview fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
            fetchingRef.current = false;
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchData(true);
    };

    const netProfit = profit - todayExpenses;
    const isNetPositive = netProfit >= 0;
    const firstLoad = loading && !hasLoaded;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <Text style={styles.title}>{copy.title}</Text>

            {/* ── Metrics ── */}
            <View style={styles.metricsSection}>
                <SectionHeader title={copy.performance} />
                {firstLoad ? (
                    <LoadingSkeleton rows={4} variant="metric" style={styles.loadingContent} />
                ) : (
                    <View style={styles.metricsGrid}>
                        <MetricCard label={copy.revenue} value={`${revenue.toLocaleString()}₺`} style={styles.metricCard} />
                        <MetricCard label={copy.itemsSold} value={itemsSold} style={styles.metricCard} />
                        <MetricCard label={copy.grossProfit} value={`${profit.toLocaleString()}₺`} tone="success" style={styles.metricCard} />
                        <MetricCard label={copy.expenses} value={`${todayExpenses.toLocaleString()}₺`} tone="danger" style={styles.metricCard} />
                    </View>
                )}

                {/* Net Profit Banner */}
                {!firstLoad ? <View style={[styles.netProfitBanner, isNetPositive ? styles.netPositive : styles.netNegative]}>
                    <Text style={[styles.netProfitLabel, isNetPositive ? styles.profitTextGreen : styles.profitTextRed]}>{copy.netProfit}</Text>
                    <Text style={[styles.netProfitValue, isNetPositive ? styles.profitTextGreen : styles.profitTextRed]}>
                        {isNetPositive ? '' : '−'}{Math.abs(netProfit).toLocaleString()}₺
                    </Text>
                </View> : null}
            </View>

            {/* ── Quick Access ── */}
            <View style={styles.navSection}>
                <SectionHeader title={copy.salesExpenses} />
                <TouchableOpacity
                    style={styles.navRow}
                    onPress={() => navigation.navigate('SalesHistory')}
                >
                    <Text style={styles.navRowText}>{copy.salesHistory}</Text>
                    <Text style={styles.navArrow}>→</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.navRow}
                    onPress={() => navigation.navigate('Expenses')}
                >
                    <Text style={styles.navRowText}>{copy.expenses}</Text>
                    <Text style={styles.navArrow}>→</Text>
                </TouchableOpacity>
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
    title: {
        ...v.type.title,
        color: colors.text.primary,
        marginBottom: SPACING.xl,
    },
    metricsSection: {
        marginBottom: SPACING.xl + SPACING.xs,
    },
    loadingContent: {
        width: '100%',
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.md,
    },
    metricCard: {
        width: '47%' as unknown as number,
    },
    profitTextGreen: { color: colors.status.success.fg },
    profitTextRed: { color: colors.status.danger.fg },
    // ── Net Profit Banner ──
    netProfitBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: RADIUS.md,
        padding: SPACING.lg,
        marginTop: SPACING.md,
        borderWidth: 1,
    },
    netPositive: {
        ...v.successSurface,
    },
    netNegative: {
        ...v.dangerSurface,
    },
    // Color comes from profitTextGreen/Red at the call site — this only
    // sets weight, since the banner is a status surface (text must use
    // that status's `.fg`, never text.primary).
    netProfitLabel: {
        ...v.type.body,
        fontWeight: '700',
    },
    netProfitValue: {
        ...v.type.title,
    },
    // ── Navigation ──
    navSection: {
        marginBottom: SPACING.xl,
    },
    // Plain divider accent, not status — neutral (matches other screens' card rails).
    navRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...v.cardCompact,
        marginBottom: SPACING.sm,
        borderLeftWidth: 3,
        borderLeftColor: colors.border.strong,
    },
    navRowText: {
        ...v.type.body,
        fontWeight: '700',
        color: colors.text.primary,
    },
    navArrow: {
        ...v.type.heading,
        color: colors.text.secondary,
    },
    bottomSpacer: {
        height: SPACING.xxl + SPACING.sm,
    },
});
}
