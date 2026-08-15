import React, { useMemo, useState, useCallback, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    ScrollView,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { productionService, ProductStock } from "../src/services/productionService";
import { useAppSettings } from "../src/core/settings/AppSettingsContext";
import { createVisualSystem } from "../src/core/theme/visualSystem";
import { EmptyState, ErrorState, FilterChip, LoadingSkeleton, StatusBadge, SyncStatus, WarningCard } from "../src/components/ui";
import { RADIUS, SPACING } from "../src/core/theme/tokens";

const FOCUS_FRESH_MS = 15000;

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
        packagingMaterials: 'Paketleme Malzemeleri',
        productRecipes: 'Ürün Reçeteleri',
        loadFailed: 'Stok bilgileri yüklenemedi',
        retry: 'Tekrar dene',
        noFilteredStock: 'Seçili filtrelerde stok bulunamadı.',
        all: 'Tümü',
        lowOnly: 'Sadece düşük stok',
        warnings: 'Stok uyarıları',
        lowStockWarning: 'Düşük veya negatif stok görünen ürünleri kontrol edin.',
        negativeStock: 'Negatif stok',
        synced: 'Senkron',
        refreshing: 'Yenileniyor...',
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
        packagingMaterials: 'Packaging Materials',
        productRecipes: 'Product Recipes',
        loadFailed: 'Could not load stock data',
        retry: 'Retry',
        noFilteredStock: 'No stock matches the selected filters.',
        all: 'All',
        lowOnly: 'Low stock only',
        warnings: 'Stock warnings',
        lowStockWarning: 'Review products showing low or negative stock.',
        negativeStock: 'Negative stock',
        synced: 'Synced',
        refreshing: 'Refreshing...',
    };
    const [products, setProducts] = useState<ProductStock[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [typeFilter, setTypeFilter] = useState('all');
    const [sizeFilter, setSizeFilter] = useState('all');
    const [lowOnly, setLowOnly] = useState(false);
    const fetchingRef = useRef(false);
    const lastFetchRef = useRef(0);
    const navigation = useNavigation<any>();

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
            const { data, error } = await productionService.getProductsWithStock();
            if (error) {
                console.log('Stock fetchData error:', error);
                setErrorMessage(copy.loadFailed);
                return;
            }
            setErrorMessage('');
            if (data) setProducts(data);
            setLastUpdated(new Date());
            lastFetchRef.current = Date.now();
        } catch (err) {
            console.log('Stock fetchData catch:', err);
            setErrorMessage(copy.loadFailed);
        } finally {
            setLoading(false);
            setRefreshing(false);
            fetchingRef.current = false;
        }
    }, [copy.loadFailed]);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchData(true);
    };

    const stockStats = useMemo(() => {
        let totalUnitsValue = 0;
        let warningCountValue = 0;
        products.forEach(product => {
            const total = product.stock?.reduce((sum, stock) => sum + (stock.quantity || 0), 0) || 0;
            totalUnitsValue += total;
            if (total < 10 || product.stock?.some(stock => stock.quantity < 0)) warningCountValue += 1;
        });
        return { totalProducts: products.length, totalUnits: totalUnitsValue, warningCount: warningCountValue };
    }, [products]);
    const { totalProducts, totalUnits, warningCount } = stockStats;

    const productTypes = useMemo(() => {
        const values = new Set<string>();
        products.forEach(product => { if (product.product_type) values.add(product.product_type); });
        return Array.from(values);
    }, [products]);

    const stockSizes = useMemo(() => {
        const values = new Set<string>();
        products.forEach(product => product.stock?.forEach(stock => { if (stock.size) values.add(stock.size); }));
        return Array.from(values).sort();
    }, [products]);

    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const total = product.stock?.reduce((sum, stock) => sum + (stock.quantity || 0), 0) || 0;
            const matchesType = typeFilter === 'all' || product.product_type === typeFilter;
            const matchesSize = sizeFilter === 'all' || product.stock?.some(stock => stock.size === sizeFilter);
            const matchesLow = !lowOnly || total < 10 || product.stock?.some(stock => stock.quantity < 0);
            return matchesType && matchesSize && matchesLow;
        });
    }, [lowOnly, products, sizeFilter, typeFilter]);

    const firstLoad = loading && products.length === 0;

    if (errorMessage) {
        return (
            <ScrollView
                style={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <Text style={styles.title}>{copy.title}</Text>
                <Text style={styles.subtitle}>{copy.subtitle}</Text>
                <ErrorState
                    title={errorMessage}
                    description={copy.addProducts}
                    retryLabel={copy.retry}
                    onRetry={fetchData}
                />
            </ScrollView>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View style={styles.titleRow}>
                <Text style={styles.title}>{copy.title}</Text>
                <SyncStatus timestamp={lastUpdated} syncing={refreshing || loading} label={copy.synced} syncingLabel={copy.refreshing} />
            </View>
            <Text style={styles.subtitle}>{copy.subtitle}</Text>

            {warningCount > 0 ? (
                <WarningCard
                    title={`${warningCount} ${copy.warnings}`}
                    description={copy.lowStockWarning}
                    tone="warning"
                    style={styles.warningCard}
                />
            ) : null}

            {firstLoad ? (
                <LoadingSkeleton rows={2} variant="metric" style={styles.inlineSkeleton} />
            ) : (
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
            )}

            {!firstLoad ? <View style={styles.tools}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    <FilterChip label={copy.all} selected={typeFilter === 'all' && sizeFilter === 'all' && !lowOnly} onPress={() => { setTypeFilter('all'); setSizeFilter('all'); setLowOnly(false); }} count={products.length} />
                    <FilterChip label={copy.lowOnly} selected={lowOnly} onPress={() => setLowOnly(prev => !prev)} tone="warning" count={warningCount} />
                    {productTypes.map(type => (
                        <FilterChip key={type} label={type} selected={typeFilter === type} onPress={() => setTypeFilter(typeFilter === type ? 'all' : type)} tone="primary" />
                    ))}
                    {stockSizes.map(size => (
                        <FilterChip key={size} label={size || copy.total} selected={sizeFilter === size} onPress={() => setSizeFilter(sizeFilter === size ? 'all' : size)} />
                    ))}
                </ScrollView>
            </View> : null}

            {/* Detailed Stock View */}
            <View style={styles.productListContainer}>
                {firstLoad ? (
                    <LoadingSkeleton rows={4} style={styles.inlineSkeleton} />
                ) : products.length === 0 ? (
                    <EmptyState icon="□" title={copy.noProducts} description={copy.addProducts} />
                ) : filteredProducts.length === 0 ? (
                    <EmptyState icon="□" title={copy.noProducts} description={copy.noFilteredStock} />
                ) : (
                    filteredProducts.map(p => {
                        const total = p.stock?.reduce((s, st) => s + (st.quantity || 0), 0) || 0;
                        const isProductLowStock = total < 10;
                        const isBag = String(p.product_type || '').trim().toLowerCase() === 'bag';
                        
                        return (
                            <View key={p.id} style={[styles.previewCard, isProductLowStock && styles.previewCardLowWarning]}>
                                <View style={styles.previewHeader}>
                                    <Text style={styles.previewName}>{p.name}</Text>
                                    <View style={styles.productBadges}>
                                        <StatusBadge label={`${p.cost || 0}₺ ${copy.base}`} tone="primary" />
                                        <StatusBadge label={`${total} ${copy.total}`} tone={isProductLowStock ? 'warning' : 'muted'} />
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
                {/* Packaging cost configuration — lives under Stock, not Finance;
                    see the navigation-restructure notes for why. */}
                <TouchableOpacity
                    style={styles.navBtnOutline}
                    onPress={() => navigation.navigate("PackagingMaterials")}
                >
                    <Text style={styles.navBtnOutlineText}>{copy.packagingMaterials}</Text>
                    <Text style={styles.navBtnOutlineArrow}>→</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.navBtnOutline}
                    onPress={() => navigation.navigate("ProductRecipes")}
                >
                    <Text style={styles.navBtnOutlineText}>{copy.productRecipes}</Text>
                    <Text style={styles.navBtnOutlineArrow}>→</Text>
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
        padding: SPACING.lg,
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
    },
    subtitle: {
        ...v.type.body,
        color: colors.text.secondary,
        marginBottom: SPACING.xl,
        marginTop: 2,
    },
    statsRow: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginBottom: SPACING.xl,
    },
    warningCard: {
        marginBottom: SPACING.md,
    },
    tools: {
        gap: SPACING.sm,
        marginBottom: SPACING.md,
    },
    inlineSkeleton: {
        marginBottom: SPACING.md,
    },
    filterRow: {
        gap: SPACING.sm,
        paddingRight: SPACING.xs,
    },
    // Products / Total Units are plain counts, not a status — neutral. Low
    // Stock (only rendered when > 0) is a genuine warning-grade count.
    statCard: {
        flex: 1,
        ...v.card,
        borderLeftWidth: 3,
        borderLeftColor: colors.border.strong,
    },
    statCardSecondary: {},
    statCardDanger: {
        ...v.dangerSurface,
    },
    statLabel: {
        ...v.type.label,
        color: colors.text.secondary,
        textTransform: 'uppercase',
        marginBottom: SPACING.xs,
    },
    statValue: {
        ...v.type.title,
        color: colors.text.primary,
    },
    statValueDanger: {
        color: colors.status.danger.fg,
    },
    productListContainer: {
        marginTop: SPACING.sm,
    },
    // Plain divider accent, not status — neutral (matches Orders/Dashboard cards).
    previewCard: {
        ...v.card,
        marginBottom: SPACING.md,
        borderLeftWidth: 3,
        borderLeftColor: colors.border.strong,
    },
    previewCardLowWarning: {
        ...v.dangerSurface,
    },
    previewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    previewName: {
        ...v.type.heading,
        color: colors.text.primary,
        flex: 1,
    },
    productBadges: {
        flexDirection: 'row',
        gap: SPACING.xs,
    },
    noStockText: {
        ...v.type.body,
        color: colors.text.secondary,
        fontStyle: 'italic',
        marginTop: SPACING.xs,
    },
    sizesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    sizeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bg.raised,
        borderWidth: 1,
        borderColor: colors.border.default,
        borderRadius: RADIUS.sm,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.sm,
        minWidth: 60,
        justifyContent: 'space-between',
        gap: SPACING.sm,
    },
    sizeItemLow: {
        backgroundColor: colors.status.danger.bg,
        borderColor: colors.status.danger.fg,
    },
    sizeLabel: {
        ...v.type.label,
        fontWeight: '700',
        color: colors.text.primary,
    },
    sizeLabelLow: {
        color: colors.status.danger.fg,
    },
    sizeQty: {
        ...v.type.label,
        color: colors.text.secondary,
    },
    sizeQtyLow: {
        color: colors.status.danger.fg,
    },
    bagStockSummary: {
        backgroundColor: colors.bg.raised,
        borderWidth: 1,
        borderColor: colors.border.default,
        borderRadius: RADIUS.sm,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bagStockLabel: {
        ...v.type.label,
        color: colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    bagStockValue: {
        ...v.type.heading,
        color: colors.text.primary,
    },
    navSection: {
        marginTop: SPACING.lg,
        gap: SPACING.sm,
    },
    navBtn: {
        ...v.primaryButton,
        paddingHorizontal: SPACING.xl,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    navBtnText: {
        color: colors.accent.fg,
        ...v.type.label,
    },
    navBtnArrow: {
        color: colors.accent.fg,
        ...v.type.heading,
    },
    navBtnOutline: {
        ...v.secondaryButton,
        borderColor: colors.accent.bg,
        paddingHorizontal: SPACING.xl,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    navBtnOutlineText: {
        color: colors.accent.bg,
        ...v.type.label,
    },
    navBtnOutlineArrow: {
        color: colors.accent.bg,
        ...v.type.heading,
    },
    bottomSpacer: {
        height: SPACING.xxl + SPACING.sm,
    },
});
}
