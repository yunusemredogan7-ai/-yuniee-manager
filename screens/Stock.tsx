import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    RefreshControl,
    ScrollView,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { productionService, ProductStock } from "../src/services/productionService";
import { useAppSettings } from "../src/core/settings/AppSettingsContext";

export default function Stock() {
    const { colors, language, themeMode } = useAppSettings();
    const styles = React.useMemo(() => makeStyles(colors, themeMode), [colors, themeMode]);
    const copy = language === 'tr' ? {
        title: 'Stok',
        subtitle: 'Detaylı Envanter',
        products: 'Ürünler',
        totalUnits: 'Toplam Adet',
        lowStock: 'Düşük Stok',
        noProducts: 'Henüz ürün yok',
        addProducts: 'Ürünleri Ürün Yönetimi üzerinden ekleyin.',
        noSizes: 'Henüz beden stoğu girilmedi.',
        noStock: 'Henüz stok girilmedi.',
        base: 'Maliyet',
        total: 'Toplam',
        productManagement: 'Ürün Yönetimi',
        stockMovements: 'Stok Hareketleri',
    } : {
        title: 'Stock',
        subtitle: 'Detailed Inventory',
        products: 'Products',
        totalUnits: 'Total Units',
        lowStock: 'Low Stock',
        noProducts: 'No products yet',
        addProducts: 'Add products via Product Management.',
        noSizes: 'No sizes logged yet.',
        noStock: 'No stock logged yet.',
        base: 'Base',
        total: 'Total',
        productManagement: 'Product Management',
        stockMovements: 'Stock Movements',
    };
    const [products, setProducts] = useState<ProductStock[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation<any>();

    const fetchData = useCallback(async () => {
        try {
            const { data, error } = await productionService.getProductsWithStock();
            if (error) {
                console.log('Stock fetchData error:', error);
                return;
            }
            if (data) setProducts(data);
        } catch (err) {
            console.log('Stock fetchData catch:', err);
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

    const totalProducts = products.length;
    const totalUnits = products.reduce((sum, p) => {
        return sum + (p.stock?.reduce((s, st) => s + (st.quantity || 0), 0) || 0);
    }, 0);

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
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.subtitle}>{copy.subtitle}</Text>

            {/* Stats */}
            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>{copy.products}</Text>
                    <Text style={styles.statValue}>{totalProducts}</Text>
                </View>
                <View style={[styles.statCard, styles.statCardSecondary]}>
                    <Text style={styles.statLabel}>{copy.totalUnits}</Text>
                    <Text style={styles.statValue}>{totalUnits}</Text>
                </View>
                {products.filter(p => (p.stock?.reduce((s, st) => s + (st.quantity || 0), 0) || 0) < 10).length > 0 && (
                    <View style={[styles.statCard, styles.statCardDanger]}>
                        <Text style={styles.statLabel}>{copy.lowStock}</Text>
                        <Text style={[styles.statValue, styles.statValueDanger]}>
                            {products.filter(p => (p.stock?.reduce((s, st) => s + (st.quantity || 0), 0) || 0) < 10).length}
                        </Text>
                    </View>
                )}
            </View>

            {/* Detailed Stock View */}
            <View style={styles.productListContainer}>
                {products.length === 0 ? (
                    <View style={styles.emptyBlock}>
                        <Text style={styles.emptyIcon}>📦</Text>
                        <Text style={styles.emptyTitle}>{copy.noProducts}</Text>
                        <Text style={styles.emptyDesc}>{copy.addProducts}</Text>
                    </View>
                ) : (
                    products.map(p => {
                        const total = p.stock?.reduce((s, st) => s + (st.quantity || 0), 0) || 0;
                        const isProductLowStock = total < 10;
                        const isBag = String(p.product_type || '').trim().toLowerCase() === 'bag';
                        
                        return (
                            <View key={p.id} style={[styles.previewCard, isProductLowStock && styles.previewCardLowWarning]}>
                                <View style={styles.previewHeader}>
                                    <Text style={styles.previewName}>{p.name}</Text>
                                    <View style={styles.productBadges}>
                                        <Text style={styles.costBadge}>{p.cost || 0}₺ {copy.base}</Text>
                                        <Text style={styles.totalPill}>{total} {copy.total}</Text>
                                    </View>
                                </View>
                                
                                {(!p.stock || p.stock.length === 0) ? (
                                    <Text style={styles.noStockText}>{isBag ? copy.noStock : copy.noSizes}</Text>
                                ) : isBag ? (
                                    <View style={styles.bagStockSummary}>
                                        <Text style={styles.bagStockLabel}>{copy.total}</Text>
                                        <Text style={styles.bagStockValue}>{total}</Text>
                                    </View>
                                ) : (
                                    <View style={styles.sizesGrid}>
                                        {p.stock.sort((a,b) => a.size.localeCompare(b.size)).map((s, idx) => (
                                            <View key={idx} style={[styles.sizeItem, s.quantity < 10 && styles.sizeItemLow]}>
                                                <Text style={[styles.sizeLabel, s.quantity < 10 && styles.sizeLabelLow]}>{s.size}</Text>
                                                <Text style={[styles.sizeQty, s.quantity < 10 && styles.sizeQtyLow]}>{s.quantity}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        );
                    })
                )}
            </View>

            {/* Navigation */}
            <View style={styles.navSection}>
                <TouchableOpacity
                    style={styles.navBtn}
                    onPress={() => navigation.navigate("ProductManagement")}
                >
                    <Text style={styles.navBtnText}>{copy.productManagement}</Text>
                    <Text style={styles.navBtnArrow}>→</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.navBtnOutline}
                    onPress={() => navigation.navigate("StockMovements")}
                >
                    <Text style={styles.navBtnOutlineText}>{copy.stockMovements}</Text>
                    <Text style={styles.navBtnOutlineArrow}>→</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.bottomSpacer} />
        </ScrollView>
    );
}

function makeStyles(colors: ReturnType<typeof useAppSettings>['colors'], themeMode: 'light' | 'dark') {
return StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
        padding: 20,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.bg,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: colors.text,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        color: colors.subtext,
        marginBottom: 20,
        marginTop: 2,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        backgroundColor: themeMode === 'dark' ? '#182338' : '#f3f7ff',
        borderRadius: 14,
        padding: 16,
        borderLeftWidth: 3,
        borderLeftColor: colors.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: themeMode === 'dark' ? '#34466b' : '#dbe8ff',
    },
    statCardSecondary: {
        borderLeftColor: colors.success,
        backgroundColor: themeMode === 'dark' ? '#17291f' : '#f2fbf5',
        borderColor: themeMode === 'dark' ? '#335f44' : '#d7f0df',
    },
    statCardDanger: {
        borderLeftColor: colors.danger,
        backgroundColor: themeMode === 'dark' ? '#352026' : '#fef2f2',
        borderColor: themeMode === 'dark' ? '#6f3038' : '#fecaca',
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.subtext,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.text,
        letterSpacing: -0.5,
    },
    statValueDanger: {
        color: colors.danger,
    },
    productListContainer: {
        marginTop: 10,
    },
    emptyBlock: {
        alignItems: 'center',
        paddingVertical: 30,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        marginBottom: 12,
    },
    emptyIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 4,
    },
    emptyDesc: {
        fontSize: 13,
        color: colors.subtext,
    },
    previewCard: {
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: colors.border,
        borderLeftWidth: 3,
        borderLeftColor: themeMode === 'dark' ? '#34466b' : '#dbe8ff',
    },
    previewCardLowWarning: {
        borderColor: themeMode === 'dark' ? '#6f3038' : '#fca5a5',
        backgroundColor: themeMode === 'dark' ? '#352026' : '#fef2f2',
    },
    previewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    previewName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        flex: 1,
    },
    productBadges: {
        flexDirection: 'row',
        gap: 6,
    },
    costBadge: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.primary,
        backgroundColor: themeMode === 'dark' ? '#252b4a' : '#e0e7ff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    totalPill: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.text,
        backgroundColor: colors.surfaceMuted,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    noStockText: {
        fontSize: 14,
        color: colors.subtext,
        fontStyle: 'italic',
        marginTop: 4,
    },
    sizesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    sizeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surfaceMuted,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 6,
        minWidth: 60,
        justifyContent: 'space-between',
        gap: 6,
    },
    sizeItemLow: {
        backgroundColor: themeMode === 'dark' ? '#352026' : '#fee2e2',
        borderColor: themeMode === 'dark' ? '#6f3038' : '#fca5a5',
    },
    sizeLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.text,
    },
    sizeLabelLow: {
        color: colors.danger,
    },
    sizeQty: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.subtext,
    },
    sizeQtyLow: {
        color: colors.danger,
    },
    bagStockSummary: {
        backgroundColor: colors.surfaceMuted,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bagStockLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.subtext,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    bagStockValue: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text,
    },
    navSection: {
        marginTop: 20,
        gap: 10,
    },
    navBtn: {
        backgroundColor: colors.primary,
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    navBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    navBtnArrow: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    navBtnOutline: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.primary,
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    navBtnOutlineText: {
        color: colors.primary,
        fontSize: 15,
        fontWeight: '600',
    },
    navBtnOutlineArrow: {
        color: colors.primary,
        fontSize: 18,
        fontWeight: '600',
    },
    bottomSpacer: {
        height: 40,
    },
});
}
