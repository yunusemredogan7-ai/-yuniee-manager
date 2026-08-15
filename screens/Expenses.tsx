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
    ScrollView,
} from 'react-native';
import { supabase } from '../src/core/supabase/client';
import {
    expensesService,
    Expense,
    EXPENSE_CATEGORIES,
    ExpenseCategory,
} from '../src/services/expensesService';
import { useAppSettings } from '../src/core/settings/AppSettingsContext';
import { createVisualSystem } from '../src/core/theme/visualSystem';
import { ConfirmDialog, EmptyState, FilterChip, LoadingSkeleton, SearchInput, SyncStatus } from '../src/components/ui';
import { RADIUS, SPACING, hitSlopFor } from '../src/core/theme/tokens';

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
        search: 'Gider ara',
        all: 'Tümü',
        synced: 'Senkron',
        refreshing: 'Yenileniyor...',
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
        search: 'Search costs',
        all: 'All',
        synced: 'Synced',
        refreshing: 'Refreshing...',
    };
    const categoryLabels: Record<ExpenseCategory, string> = React.useMemo(() => language === 'tr'
        ? ({
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
        })
        : ({
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
        }), [language]);
    const getCategoryLabel = useCallback((cat: string) => {
        if (cat === 'Advertising') return language === 'tr' ? 'Reklam' : 'Ads';
        return categoryLabels[cat as ExpenseCategory] || cat;
    }, [categoryLabels, language]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [expenseSearch, setExpenseSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>('all');
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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
            setLastUpdated(new Date());
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

    function handleDeleteExpense(id: number) {
        setDeleteId(id);
    }

    async function confirmDeleteExpense() {
        if (!deleteId) return;
        const id = deleteId;
        setDeleteId(null);
        const { error } = await expensesService.deleteExpense(id);
        if (error) {
            Alert.alert(copy.error, copy.deleteFailed);
        } else {
            fetchExpenses();
        }
    }

    function renderExpense({ item }: { item: Expense }) {
        const date = new Date(item.created_at).toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });

        return (
            <View style={styles.card}>
                <View style={styles.cardTop}>
                    {/* Category is a plain tag, not a status — text differentiates, not color. */}
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{getCategoryLabel(item.category)}</Text>
                    </View>
                    <Text style={styles.dateText}>{date}</Text>
                </View>
                <View style={styles.cardBottom}>
                    <View style={styles.cardInfo}>
                        <Text style={styles.amountText}>{Number(item.amount).toLocaleString()}₺</Text>
                        {item.note ? <Text style={styles.noteText}>{item.note}</Text> : null}
                    </View>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteExpense(item.id)} hitSlop={hitSlopFor(32)}>
                        <Text style={styles.deleteBtnText}>✕</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const filteredExpenses = React.useMemo(() => {
        const q = expenseSearch.trim().toLowerCase();
        return expenses.filter(expense => {
            const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
            const haystack = [expense.category, getCategoryLabel(expense.category), expense.note, expense.amount].join(' ').toLowerCase();
            const matchesSearch = !q || haystack.includes(q);
            return matchesCategory && matchesSearch;
        });
    }, [categoryFilter, expenseSearch, expenses, getCategoryLabel]);

    const firstLoad = loading && expenses.length === 0;

    return (
        <View style={styles.container}>
            <View style={styles.screenHeader}>
                <Text style={styles.screenTitle}>{copy.title}</Text>
                <Text style={styles.screenSubtitle}>{copy.subtitle}</Text>
                <SyncStatus timestamp={lastUpdated} syncing={refreshing || loading} label={copy.synced} syncingLabel={copy.refreshing} style={styles.syncStatus} />
            </View>

            {/* Total + Add */}
            {firstLoad ? (
                <LoadingSkeleton rows={1} variant="metric" style={styles.loadingContent} />
            ) : (
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
            )}

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
                            <ActivityIndicator color={colors.status.danger.fg} />
                        ) : (
                            <Text style={styles.submitBtnText}>{copy.addExpense}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* Expenses List */}
            {!firstLoad ? <View style={styles.tools}>
                <SearchInput value={expenseSearch} onChangeText={setExpenseSearch} placeholder={copy.search} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    <FilterChip label={copy.all} selected={categoryFilter === 'all'} onPress={() => setCategoryFilter('all')} count={expenses.length} />
                    {EXPENSE_CATEGORIES.map(cat => (
                        <FilterChip
                            key={cat}
                            label={getCategoryLabel(cat)}
                            selected={categoryFilter === cat}
                            onPress={() => setCategoryFilter(categoryFilter === cat ? 'all' : cat)}
                            count={expenses.filter(expense => expense.category === cat).length}
                            tone="danger"
                        />
                    ))}
                </ScrollView>
            </View> : null}
            <FlatList
                data={filteredExpenses}
                keyExtractor={item => String(item.id)}
                renderItem={renderExpense}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    firstLoad ? (
                        <LoadingSkeleton rows={4} style={styles.loadingContent} />
                    ) : <EmptyState
                        icon="₺"
                        title={copy.noExpenses}
                        description={copy.empty}
                        actionLabel={copy.newExpense}
                        onAction={() => setShowForm(true)}
                    />
                }
            />
            <ConfirmDialog
                visible={deleteId !== null}
                title={copy.deleteTitle}
                message={copy.areYouSure}
                confirmLabel={copy.delete}
                cancelLabel={copy.cancel}
                destructive
                onConfirm={confirmDeleteExpense}
                onCancel={() => setDeleteId(null)}
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
    loadingContent: {
        width: '100%',
        paddingHorizontal: SPACING.lg,
    },
    topSection: {
        flexDirection: 'row',
        padding: SPACING.lg,
        paddingTop: SPACING.sm,
        paddingBottom: SPACING.sm,
        gap: SPACING.md,
    },
    screenHeader: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.lg,
        paddingBottom: SPACING.xs,
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
    syncStatus: { marginTop: SPACING.sm },
    // Money going out reads as the danger tone throughout this whole screen
    // (a deliberate, consistent status framing, not decoration) — so its
    // text uses status.danger.fg, never text.primary.
    totalCard: {
        flex: 1,
        ...v.card,
        ...v.dangerSurface,
        padding: SPACING.lg,
        borderLeftWidth: 3,
    },
    totalLabel: {
        ...v.type.label,
        color: colors.status.danger.fg,
        textTransform: 'uppercase',
        marginBottom: SPACING.xs,
    },
    totalValue: {
        ...v.type.title,
        color: colors.status.danger.fg,
    },
    // A solid saturated danger fill can't stay contrast-safe in both themes
    // (see ConfirmDialog) — this uses the tint+fg pairing instead.
    addToggle: {
        width: 52,
        height: 52,
        borderRadius: RADIUS.sm,
        ...v.dangerSurface,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
    },
    addToggleText: {
        color: colors.status.danger.fg,
        ...v.type.title,
    },
    form: {
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
        backgroundColor: colors.bg.surface,
        borderRadius: RADIUS.md,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: colors.status.danger.bg,
        borderLeftWidth: 3,
        borderLeftColor: colors.status.danger.fg,
    },
    formTitle: {
        ...v.type.title,
        marginBottom: SPACING.md,
        color: colors.text.primary,
    },
    input: {
        ...v.input,
        marginBottom: SPACING.sm,
    },
    inputLabel: {
        ...v.type.label,
        color: colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: SPACING.xs,
    },
    categoryRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        marginBottom: SPACING.md,
    },
    // Category is a plain tag, not a status — selection reads as the app's
    // ordinary chip-selected state (the brand accent), same as any other
    // pick-one-of-N control (ProductManagement's type/color pills, etc.).
    categoryChip: {
        minHeight: 44,
        justifyContent: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.pill,
        borderWidth: 1,
        borderColor: colors.border.default,
        backgroundColor: colors.bg.raised,
    },
    categoryChipActive: {
        borderColor: colors.accent.bg,
        backgroundColor: colors.accent.bg,
    },
    categoryChipText: {
        ...v.type.label,
        color: colors.text.secondary,
    },
    categoryChipTextActive: {
        color: colors.accent.fg,
    },
    submitBtn: {
        ...v.dangerSurface,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.sm,
        borderWidth: 1,
        alignItems: 'center',
        marginTop: SPACING.xs,
    },
    disabledBtn: {
        opacity: 0.6,
    },
    submitBtnText: {
        color: colors.status.danger.fg,
        ...v.type.label,
    },
    listContent: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.xxl + SPACING.sm,
    },
    tools: {
        paddingHorizontal: SPACING.lg,
        gap: SPACING.sm,
        marginBottom: SPACING.md,
    },
    filterRow: {
        gap: SPACING.sm,
        paddingRight: SPACING.xs,
    },
    // Plain divider accent, not status — neutral (matches other screens' card rails).
    card: {
        ...v.cardCompact,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        borderLeftWidth: 3,
        borderLeftColor: colors.border.strong,
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    // Category is a plain tag, not a status — neutral, text differentiates.
    categoryBadge: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: RADIUS.sm,
        borderWidth: 1,
        borderColor: colors.border.default,
        backgroundColor: colors.bg.raised,
    },
    categoryText: {
        ...v.type.caption,
        fontWeight: '700',
        color: colors.text.primary,
    },
    dateText: {
        ...v.type.caption,
        color: colors.text.secondary,
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
        ...v.type.title,
        color: colors.text.primary,
    },
    noteText: {
        ...v.type.label,
        color: colors.text.secondary,
        marginTop: 2,
    },
    // A genuine danger-tinted action (delete).
    deleteBtn: {
        width: 32,
        height: 32,
        borderRadius: RADIUS.sm,
        backgroundColor: colors.status.danger.bg,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: SPACING.md,
    },
    deleteBtnText: {
        ...v.type.heading,
        color: colors.status.danger.fg,
    },
});
}
