import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    RefreshControl,
    ScrollView
} from 'react-native';
import { stockMovementsService, StockMovement } from '../src/services/stockMovementsService';
import { supabase } from '../src/core/supabase/client';
import { useAppSettings } from '../src/core/settings/AppSettingsContext';
import { createVisualSystem } from '../src/core/theme/visualSystem';
import { EmptyState, FilterChip, LoadingSkeleton, SearchInput, StatusBadge } from '../src/components/ui';
import { SPACING } from '../src/core/theme/tokens';

export default function StockMovements() {
    const { colors, language, themeMode } = useAppSettings();
    const styles = React.useMemo(() => makeStyles(colors, themeMode), [colors, themeMode]);
    const copy = language === 'tr' ? {
        title: 'Stok Hareketleri',
        subtitle: 'Üretim, manuel ayar ve stok giriş/çıkış geçmişi.',
        size: 'Beden',
        empty: 'Stok hareketi bulunamadı.',
        quantityChange: 'Stok değişimi',
        movementTypes: {
            production: 'ÜRETİM',
            sale: 'SATIŞ',
            adjustment: 'AYAR',
            return: 'İADE',
        },
        sources: {
            'Manual Adjustment': 'Manuel stok ayarı',
            'Production Entry': 'Üretim girişi',
        },
        search: 'Stok hareketi ara',
        all: 'Tümü',
    } : {
        title: 'Stock Movements',
        subtitle: 'Production entries, manual adjustments, and inventory in/out trail.',
        size: 'Size',
        empty: 'No stock movements found.',
        quantityChange: 'Stock change',
        movementTypes: {
            production: 'PRODUCTION',
            sale: 'SALE',
            adjustment: 'ADJUSTMENT',
            return: 'RETURN',
        },
        sources: {
            'Manual Adjustment': 'Manual Adjustment',
            'Production Entry': 'Production Entry',
        },
        search: 'Search movements',
        all: 'All',
    };
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [movementSearch, setMovementSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    const fetchMovements = useCallback(async () => {
        try {
            const { data, error } = await stockMovementsService.getMovements();
            if (error) {
                console.log('fetchMovements error:', error);
                return;
            }
            if (data) {
                setMovements(data);
            }
        } catch (error) {
            console.log('fetchMovements catch:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchMovements();

        const channel = supabase
            .channel('stock_movements_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_movements' }, () => {
                fetchMovements();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchMovements]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchMovements();
    };

    const filteredMovements = React.useMemo(() => {
        const q = movementSearch.trim().toLowerCase();
        return movements.filter(movement => {
            const matchesType = typeFilter === 'all' || movement.type === typeFilter;
            const haystack = [movement.product_name, movement.size, movement.source, movement.type, movement.quantity].join(' ').toLowerCase();
            const matchesSearch = !q || haystack.includes(q);
            return matchesType && matchesSearch;
        });
    }, [movementSearch, movements, typeFilter]);

    function getTypeTone(type: string): 'success' | 'danger' | 'warning' | 'primary' | 'muted' {
        switch (type) {
            case 'production': return 'success';
            case 'sale': return 'danger';
            case 'adjustment': return 'warning';
            case 'return': return 'primary';
            default: return 'muted';
        }
    }

    function getFilterTone(type: string): 'default' | 'primary' | 'success' | 'warning' | 'danger' {
        const tone = getTypeTone(type);
        return tone === 'muted' ? 'default' : tone;
    }

    function getTypeLabel(type: string) {
        return copy.movementTypes[type as keyof typeof copy.movementTypes] || type.toUpperCase();
    }

    function getSourceLabel(source: string) {
        return copy.sources[source as keyof typeof copy.sources] || source;
    }

    function renderItem({ item }: { item: StockMovement }) {
        const date = new Date(item.created_at).toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        const isPositive = item.quantity > 0;

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <StatusBadge label={date} tone="muted" />
                    <StatusBadge label={getTypeLabel(item.type)} tone={getTypeTone(item.type)} dot />
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.productInfo}>
                        <Text style={styles.productName}>{item.product_name}</Text>
                        <Text style={styles.sizeText}>{copy.size}: {item.size}</Text>
                    </View>
                    <View style={styles.qtyBlock}>
                        <Text style={styles.qtyLabel}>{copy.quantityChange}</Text>
                        <Text style={[
                            styles.qtyText,
                            isPositive ? styles.qtyPositive : styles.qtyNegative
                        ]}>
                            {isPositive ? '+' : ''}{item.quantity}
                        </Text>
                    </View>
                </View>

                {item.source && (
                    <Text style={styles.sourceText}>{getSourceLabel(item.source)}</Text>
                )}
            </View>
        );
    }

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <LoadingSkeleton rows={5} style={styles.loadingContent} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={filteredMovements}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <View style={styles.screenHeader}>
                        <Text style={styles.screenTitle}>{copy.title}</Text>
                        <Text style={styles.screenSubtitle}>{copy.subtitle}</Text>
                        <View style={styles.tools}>
                            <SearchInput value={movementSearch} onChangeText={setMovementSearch} placeholder={copy.search} />
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                                <FilterChip label={copy.all} selected={typeFilter === 'all'} onPress={() => setTypeFilter('all')} count={movements.length} />
                                {Object.keys(copy.movementTypes).map(type => (
                                    <FilterChip
                                        key={type}
                                        label={getTypeLabel(type)}
                                        selected={typeFilter === type}
                                        onPress={() => setTypeFilter(typeFilter === type ? 'all' : type)}
                                        count={movements.filter(movement => movement.type === type).length}
                                        tone={getFilterTone(type)}
                                    />
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                }
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <EmptyState icon="↕" title={copy.empty} description={copy.subtitle} />
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
        marginBottom: SPACING.md,
        borderLeftWidth: 3,
        borderLeftColor: colors.border.strong,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    cardBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        ...v.type.heading,
        color: colors.text.primary,
        marginBottom: SPACING.xs,
    },
    sizeText: {
        ...v.type.label,
        color: colors.text.secondary,
    },
    qtyText: {
        ...v.type.title,
        textAlign: 'right',
    },
    qtyBlock: {
        alignItems: 'flex-end',
        marginLeft: SPACING.md,
    },
    qtyLabel: {
        ...v.type.caption,
        color: colors.text.secondary,
        fontWeight: '700',
        marginBottom: 2,
    },
    qtyPositive: {
        color: colors.status.success.fg,
    },
    qtyNegative: {
        color: colors.status.danger.fg,
    },
    sourceText: {
        marginTop: SPACING.sm,
        ...v.type.caption,
        color: colors.text.secondary,
        fontStyle: 'italic',
    },
});
}
