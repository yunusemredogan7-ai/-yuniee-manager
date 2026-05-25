import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { stockMovementsService, StockMovement } from '../src/services/stockMovementsService';
import { supabase } from '../src/core/supabase/client';
import { useAppSettings } from '../src/core/settings/AppSettingsContext';

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
    };
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

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

    function getTypeColor(type: string) {
        switch (type) {
            case 'production': return '#16a34a'; // green
            case 'sale': return '#dc2626'; // red
            case 'adjustment': return '#d97706'; // orange
            case 'return': return '#2563eb'; // blue
            default: return '#6b7280'; // gray
        }
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
                    <Text style={styles.dateText}>{date}</Text>
                    <View style={[styles.typeBadge, { borderColor: getTypeColor(item.type) }]}>
                        <Text style={[styles.typeText, { color: getTypeColor(item.type) }]}>
                            {getTypeLabel(item.type)}
                        </Text>
                    </View>
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
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={movements}
                keyExtractor={(item) => String(item.id)}
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
                    <Text style={styles.emptyText}>{copy.empty}</Text>
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
        padding: 16,
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
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
        borderLeftWidth: 3,
        borderLeftColor: themeMode === 'dark' ? '#34466b' : '#bfdbfe',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    dateText: {
        fontSize: 12,
        color: colors.subtext,
        fontWeight: '500',
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        backgroundColor: colors.surfaceMuted,
    },
    typeText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
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
        fontSize: 15,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 4,
    },
    sizeText: {
        fontSize: 13,
        color: colors.subtext,
        fontWeight: '600',
    },
    qtyText: {
        fontSize: 18,
        fontWeight: '800',
        textAlign: 'right',
    },
    qtyBlock: {
        alignItems: 'flex-end',
        marginLeft: 12,
    },
    qtyLabel: {
        fontSize: 11,
        color: colors.subtext,
        fontWeight: '700',
        marginBottom: 2,
    },
    qtyPositive: {
        color: '#16a34a',
    },
    qtyNegative: {
        color: '#dc2626',
    },
    sourceText: {
        marginTop: 10,
        fontSize: 12,
        color: colors.subtext,
        fontStyle: 'italic',
    },
    emptyText: {
        textAlign: 'center',
        color: colors.subtext,
        marginTop: 40,
        fontSize: 14,
    },
});
}
