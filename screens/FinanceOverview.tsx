import React, { useState, useCallback } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    RefreshControl,
    ScrollView,
} from 'react-native';
import { dashboardService } from '../src/services/dashboardService';
import { expensesService } from '../src/services/expensesService';
import { useAppSettings } from '../src/core/settings/AppSettingsContext';

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
        costManagement: 'MALİYET YÖNETİMİ',
        packagingMaterials: 'Paketleme Malzemeleri',
        productRecipes: 'Ürün Reçeteleri',
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
        costManagement: 'COST MANAGEMENT',
        packagingMaterials: 'Packaging Materials',
        productRecipes: 'Product Recipes',
    };
    const navigation = useNavigation<any>();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [revenue, setRevenue] = useState(0);
    const [profit, setProfit] = useState(0);
    const [itemsSold, setItemsSold] = useState(0);
    const [todayExpenses, setTodayExpenses] = useState(0);

    const fetchData = useCallback(async () => {
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
        } catch (err) {
            console.log('FinanceOverview fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const netProfit = profit - todayExpenses;
    const isNetPositive = netProfit >= 0;

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={colors.success} />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <Text style={styles.title}>{copy.title}</Text>

            {/* ── Metrics ── */}
            <View style={styles.metricsSection}>
                <Text style={styles.sectionLabel}>{copy.performance}</Text>
                <View style={styles.metricsGrid}>
                    <View style={styles.metricCard}>
                        <Text style={styles.metricLabel}>{copy.revenue}</Text>
                        <Text style={styles.metricValue}>{revenue.toLocaleString()}₺</Text>
                    </View>
                    <View style={styles.metricCard}>
                        <Text style={styles.metricLabel}>{copy.itemsSold}</Text>
                        <Text style={styles.metricValue}>{itemsSold}</Text>
                    </View>
                    <View style={[styles.metricCard, styles.metricAccent]}>
                        <Text style={styles.metricLabel}>{copy.grossProfit}</Text>
                        <Text style={[styles.metricValue, styles.profitTextGreen]}>
                            {profit.toLocaleString()}₺
                        </Text>
                    </View>
                    <View style={[styles.metricCard, styles.metricExpense]}>
                        <Text style={styles.metricLabel}>{copy.expenses}</Text>
                        <Text style={[styles.metricValue, styles.expenseText]}>
                            {todayExpenses.toLocaleString()}₺
                        </Text>
                    </View>
                </View>

                {/* Net Profit Banner */}
                <View style={[styles.netProfitBanner, isNetPositive ? styles.netPositive : styles.netNegative]}>
                    <Text style={styles.netProfitLabel}>{copy.netProfit}</Text>
                    <Text style={[styles.netProfitValue, isNetPositive ? styles.profitTextGreen : styles.profitTextRed]}>
                        {isNetPositive ? '' : '−'}{Math.abs(netProfit).toLocaleString()}₺
                    </Text>
                </View>
            </View>

            {/* ── Quick Access ── */}
            <View style={styles.navSection}>
                <Text style={styles.sectionLabel}>{copy.salesExpenses}</Text>
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

            <View style={styles.navSection}>
                <Text style={styles.sectionLabel}>{copy.costManagement}</Text>
                <TouchableOpacity
                    style={styles.navRow}
                    onPress={() => navigation.navigate('PackagingMaterials')}
                >
                    <Text style={styles.navRowText}>{copy.packagingMaterials}</Text>
                    <Text style={styles.navArrow}>→</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.navRow}
                    onPress={() => navigation.navigate('ProductRecipes')}
                >
                    <Text style={styles.navRowText}>{copy.productRecipes}</Text>
                    <Text style={styles.navArrow}>→</Text>
                </TouchableOpacity>
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
        marginBottom: 24,
    },
    // ── Sections ──
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.subtext,
        letterSpacing: 1,
        marginBottom: 10,
    },
    metricsSection: {
        marginBottom: 28,
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    metricCard: {
        width: '47%' as unknown as number,
        backgroundColor: themeMode === 'dark' ? '#182338' : '#f3f7ff',
        borderRadius: 14,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: themeMode === 'dark' ? '#34466b' : '#dbe8ff',
    },
    metricAccent: {
        borderLeftWidth: 3,
        borderLeftColor: colors.success,
        backgroundColor: themeMode === 'dark' ? '#17291f' : '#f2fbf5',
        borderColor: themeMode === 'dark' ? '#335f44' : '#d7f0df',
    },
    metricExpense: {
        borderLeftWidth: 3,
        borderLeftColor: colors.danger,
        backgroundColor: themeMode === 'dark' ? '#352026' : '#fff5f5',
        borderColor: themeMode === 'dark' ? '#6f3038' : '#fecaca',
    },
    metricLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.subtext,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    metricValue: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.text,
        letterSpacing: -0.5,
    },
    profitTextGreen: { color: colors.success },
    profitTextRed: { color: colors.danger },
    expenseText: { color: colors.danger },
    // ── Net Profit Banner ──
    netProfitBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 14,
        padding: 18,
        marginTop: 10,
        borderWidth: 1.5,
    },
    netPositive: {
        backgroundColor: themeMode === 'dark' ? '#183025' : '#f0fdf4',
        borderColor: themeMode === 'dark' ? '#2e6b4d' : '#86efac',
    },
    netNegative: {
        backgroundColor: themeMode === 'dark' ? '#352026' : '#fef2f2',
        borderColor: themeMode === 'dark' ? '#6f3038' : '#fca5a5',
    },
    netProfitLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
    },
    netProfitValue: {
        fontSize: 26,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    // ── Navigation ──
    navSection: {
        marginBottom: 24,
    },
    navRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
        borderWidth: 1,
        borderColor: colors.border,
        borderLeftWidth: 3,
        borderLeftColor: themeMode === 'dark' ? '#34466b' : '#dbe8ff',
    },
    navRowText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },
    navArrow: {
        fontSize: 16,
        color: colors.subtext,
        fontWeight: '600',
    },
    bottomSpacer: {
        height: 40,
    },
});
}
