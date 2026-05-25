import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from 'react-native';
import { supabase } from '../src/core/supabase/client';
import {
    expensesService,
    Expense,
    EXPENSE_CATEGORIES,
    ExpenseCategory,
} from '../src/services/expensesService';
import { useAppSettings } from '../src/core/settings/AppSettingsContext';

export default function Expenses() {
    const { colors, language, themeMode } = useAppSettings();
    const styles = React.useMemo(() => makeStyles(colors, themeMode), [colors, themeMode]);
    const copy = language === 'tr' ? {
        warning: 'Uyarı',
        error: 'Hata',
        invalidAmount: 'Lütfen geçerli bir tutar girin.',
        addFailed: 'Gider eklenemedi.',
        somethingWrong: 'Bir şeyler ters gitti.',
        deleteTitle: 'Gideri Sil',
        areYouSure: 'Emin misiniz?',
        cancel: 'İptal',
        delete: 'Sil',
        deleteFailed: 'Gider silinemedi.',
        title: 'İşletme Giderleri',
        subtitle: 'Kira, faturalar, üretim ve operasyon maliyetlerini takip edin.',
        totalExpenses: 'Toplam Operasyon Maliyeti',
        newExpense: 'Yeni İşletme Gideri',
        amount: 'Tutar (₺)',
        category: 'Kategori',
        note: 'Not (opsiyonel)',
        addExpense: 'GİDERİ KAYDET',
        noExpenses: 'Henüz işletme gideri yok',
        empty: 'İlk işletme giderini eklemek için + düğmesine dokun.',
    } : {
        warning: 'Warning',
        error: 'Error',
        invalidAmount: 'Please enter a valid amount.',
        addFailed: 'Could not add expense.',
        somethingWrong: 'Something went wrong.',
        deleteTitle: 'Delete Expense',
        areYouSure: 'Are you sure?',
        cancel: 'Cancel',
        delete: 'Delete',
        deleteFailed: 'Could not delete expense.',
        title: 'Business Overhead',
        subtitle: 'Track rent, utilities, production, and operating costs.',
        totalExpenses: 'Total Operating Cost',
        newExpense: 'New Operating Cost',
        amount: 'Amount (₺)',
        category: 'Category',
        note: 'Note (optional)',
        addExpense: 'SAVE COST',
        noExpenses: 'No operating costs yet',
        empty: 'Tap + to add your first business overhead cost.',
    };
    const categoryLabels: Record<ExpenseCategory, string> = language === 'tr'
        ? {
            Rent: 'Kira',
            Electricity: 'Elektrik',
            Water: 'Su',
            Internet: 'İnternet',
            Shipping: 'Kargo',
            Fabric: 'Kumaş',
            Printing: 'Baskı',
            Packaging: 'Paketleme',
            Ads: 'Reklam',
            General: 'Genel',
            Other: 'Diğer',
        }
        : {
            Rent: 'Rent',
            Electricity: 'Electricity',
            Water: 'Water',
            Internet: 'Internet',
            Shipping: 'Shipping',
            Fabric: 'Fabric',
            Printing: 'Printing',
            Packaging: 'Packaging',
            Ads: 'Ads',
            General: 'General',
            Other: 'Other',
        };
    const getCategoryLabel = (cat: string) => {
        if (cat === 'Advertising') return language === 'tr' ? 'Reklam' : 'Ads';
        return categoryLabels[cat as ExpenseCategory] || cat;
    };
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [totalExpenses, setTotalExpenses] = useState(0);

    // Form
    const [showForm, setShowForm] = useState(false);
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<ExpenseCategory>('General');
    const [note, setNote] = useState('');
    const [adding, setAdding] = useState(false);

    const fetchExpenses = useCallback(async () => {
        try {
            const { data, error } = await expensesService.getExpenses();
            if (error) {
                console.log('fetchExpenses error:', error);
                return;
            }
            if (data) setExpenses(data);

            const total = await expensesService.getTotalExpenses();
            setTotalExpenses(total);
        } catch (err) {
            console.log('fetchExpenses catch:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchExpenses();

        const channel = supabase
            .channel('expenses-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
                fetchExpenses();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchExpenses]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchExpenses();
    };

    async function handleAddExpense() {
        const parsedAmount = parseFloat(amount);
        if (!parsedAmount || parsedAmount <= 0) {
            Alert.alert(copy.warning, copy.invalidAmount);
            return;
        }

        try {
            setAdding(true);
            const { error } = await expensesService.addExpense({
                amount: parsedAmount,
                category,
                note: note.trim() || undefined,
            });
            if (error) {
                Alert.alert(copy.error, copy.addFailed);
                return;
            }
            setAmount('');
            setNote('');
            setCategory('General');
            setShowForm(false);
            fetchExpenses();
        } catch {
            Alert.alert(copy.error, copy.somethingWrong);
        } finally {
            setAdding(false);
        }
    }

    async function handleDeleteExpense(id: number) {
        Alert.alert(copy.deleteTitle, copy.areYouSure, [
            { text: copy.cancel, style: 'cancel' },
            {
                text: copy.delete,
                style: 'destructive',
                onPress: async () => {
                    const { error } = await expensesService.deleteExpense(id);
                    if (error) {
                        Alert.alert(copy.error, copy.deleteFailed);
                    } else {
                        fetchExpenses();
                    }
                },
            },
        ]);
    }

    function getCategoryColor(cat: string): string {
        switch (cat) {
            case 'Shipping': return '#3b82f6';
            case 'Fabric': return '#8b6fd6';
            case 'Printing': return '#d89216';
            case 'Packaging': return '#4f9d78';
            case 'Rent': return '#64748b';
            case 'Electricity': return '#eab308';
            case 'Water': return '#0ea5e9';
            case 'Internet': return '#6366f1';
            case 'Ads':
            case 'Advertising': return '#ec4899';
            case 'General': return '#6b7280';
            default: return '#94a3b8';
        }
    }

    function renderExpense({ item }: { item: Expense }) {
        const date = new Date(item.created_at).toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
        const catColor = getCategoryColor(item.category);

        return (
            <View style={styles.card}>
                <View style={styles.cardTop}>
                    <View style={[styles.categoryBadge, { backgroundColor: catColor + '18', borderColor: catColor + '40' }]}>
                        <Text style={[styles.categoryText, { color: catColor }]}>{getCategoryLabel(item.category)}</Text>
                    </View>
                    <Text style={styles.dateText}>{date}</Text>
                </View>
                <View style={styles.cardBottom}>
                    <View style={styles.cardInfo}>
                        <Text style={styles.amountText}>{Number(item.amount).toLocaleString()}₺</Text>
                        {item.note ? <Text style={styles.noteText}>{item.note}</Text> : null}
                    </View>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteExpense(item.id)}>
                        <Text style={styles.deleteBtnText}>✕</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={colors.danger} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.screenHeader}>
                <Text style={styles.screenTitle}>{copy.title}</Text>
                <Text style={styles.screenSubtitle}>{copy.subtitle}</Text>
            </View>

            {/* Total + Add */}
            <View style={styles.topSection}>
                <View style={styles.totalCard}>
                    <Text style={styles.totalLabel}>{copy.totalExpenses}</Text>
                    <Text style={styles.totalValue}>{totalExpenses.toLocaleString()}₺</Text>
                </View>
                <TouchableOpacity
                    style={styles.addToggle}
                    onPress={() => setShowForm(!showForm)}
                >
                    <Text style={styles.addToggleText}>{showForm ? '✕' : '+'}</Text>
                </TouchableOpacity>
            </View>

            {/* Add Form */}
            {showForm && (
                <View style={styles.form}>
                    <Text style={styles.formTitle}>{copy.newExpense}</Text>
                    <TextInput
                        placeholder={copy.amount}
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                        style={styles.input}
                    />
                    <Text style={styles.inputLabel}>{copy.category}</Text>
                    <View style={styles.categoryRow}>
                        {EXPENSE_CATEGORIES.map(cat => (
                            <TouchableOpacity
                                key={cat}
                                style={[
                                    styles.categoryChip,
                                    category === cat && styles.categoryChipActive,
                                    category === cat && { backgroundColor: getCategoryColor(cat) },
                                ]}
                                onPress={() => setCategory(cat)}
                            >
                                <Text style={[
                                    styles.categoryChipText,
                                    category === cat && styles.categoryChipTextActive,
                                ]}>{getCategoryLabel(cat)}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TextInput
                        placeholder={copy.note}
                        value={note}
                        onChangeText={setNote}
                        style={styles.input}
                    />
                    <TouchableOpacity
                        style={[styles.submitBtn, adding && styles.disabledBtn]}
                        onPress={handleAddExpense}
                        disabled={adding}
                    >
                        {adding ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitBtnText}>{copy.addExpense}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* Expenses List */}
            <FlatList
                data={expenses}
                keyExtractor={item => String(item.id)}
                renderItem={renderExpense}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>📊</Text>
                        <Text style={styles.emptyTitle}>{copy.noExpenses}</Text>
                        <Text style={styles.emptyDesc}>{copy.empty}</Text>
                    </View>
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
    topSection: {
        flexDirection: 'row',
        padding: 16,
        paddingTop: 8,
        paddingBottom: 8,
        gap: 10,
    },
    screenHeader: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 4,
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
    totalCard: {
        flex: 1,
        backgroundColor: themeMode === 'dark' ? '#352026' : '#fff5f5',
        borderRadius: 14,
        padding: 18,
        borderLeftWidth: 3,
        borderLeftColor: colors.danger,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: themeMode === 'dark' ? '#6f3038' : '#fecaca',
    },
    totalLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.subtext,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    totalValue: {
        fontSize: 26,
        fontWeight: '800',
        color: colors.danger,
        letterSpacing: -0.3,
    },
    addToggle: {
        width: 52,
        height: 52,
        borderRadius: 12,
        backgroundColor: colors.danger,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
    },
    addToggleText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '600',
    },
    form: {
        marginHorizontal: 16,
        marginBottom: 12,
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: themeMode === 'dark' ? '#6f3038' : '#fee2e2',
        borderLeftWidth: 3,
        borderLeftColor: colors.danger,
    },
    formTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 12,
        color: colors.text,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surfaceMuted,
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        marginBottom: 10,
        color: colors.text,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.subtext,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    categoryRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    categoryChip: {
        paddingHorizontal: 13,
        paddingVertical: 9,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surfaceMuted,
    },
    categoryChipActive: {
        borderColor: 'transparent',
    },
    categoryChipText: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.subtext,
    },
    categoryChipTextActive: {
        color: '#fff',
    },
    submitBtn: {
        backgroundColor: colors.danger,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 4,
    },
    disabledBtn: {
        opacity: 0.6,
    },
    submitBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
        letterSpacing: 0.5,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: colors.border,
        borderLeftWidth: 3,
        borderLeftColor: themeMode === 'dark' ? '#6f3038' : '#fee2e2',
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '700',
    },
    dateText: {
        fontSize: 12,
        color: colors.subtext,
    },
    cardBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardInfo: {
        flex: 1,
    },
    amountText: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.text,
    },
    noteText: {
        fontSize: 13,
        color: colors.subtext,
        marginTop: 2,
    },
    deleteBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: themeMode === 'dark' ? '#352026' : '#fef2f2',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
    deleteBtnText: {
        fontSize: 16,
        color: colors.danger,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyIcon: {
        fontSize: 40,
        marginBottom: 12,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 6,
    },
    emptyDesc: {
        fontSize: 14,
        color: colors.subtext,
    },
});
}
