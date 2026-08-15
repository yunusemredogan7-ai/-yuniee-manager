import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    costService,
    PackagingMaterial,
    PackagingQuantityMode,
    ProductPackagingRule,
} from '../src/services/costService';
import { PRODUCT_TYPES, ProductType } from '../src/services/productsService';
import { useAppSettings } from '../src/core/settings/AppSettingsContext';
import { createVisualSystem } from '../src/core/theme/visualSystem';
import { ConfirmDialog, LoadingSkeleton, StatusBadge, SyncStatus } from '../src/components/ui';
import { OVERLAY_SCRIM, RADIUS, SPACING } from '../src/core/theme/tokens';

type DraftRule = {
    id: number | null;
    product_type: ProductType;
    material_id: number | null;
    quantity: string;
    quantity_mode: PackagingQuantityMode;
    min_qty: string;
    max_qty: string;
    active: boolean;
};

const EMPTY_DRAFT: DraftRule = {
    id: null,
    product_type: 'T-shirt',
    material_id: null,
    quantity: '1',
    quantity_mode: 'per_item',
    min_qty: '1',
    max_qty: '',
    active: true,
};

export default function ProductRecipes() {
    const { colors, language, themeMode } = useAppSettings();
    const styles = makeStyles(colors, themeMode);
    const copy = language === 'tr' ? {
        title: 'Ürün Reçeteleri',
        subtitle: 'Paketleme kuralları ürün tipine göre çalışır. Renk ve beden paketlemeyi değiştirmez.',
        materialCosts: 'Malzeme maliyetleri',
        savedRules: 'kayıtlı kural',
        addRule: 'Kural ekle',
        noRules: 'Henüz kayıtlı kural yok. Kural kaydedilene kadar siparişler güvenli yedek mantığı kullanır.',
        active: 'Aktif',
        off: 'Kapalı',
        editRule: 'Kuralı düzenle',
        newRule: 'Yeni kural',
        material: 'Malzeme',
        quantityMode: 'Adet modu',
        perItem: 'Ürün başına',
        fixed: 'Sabit',
        quantity: 'Adet',
        minQty: 'Min adet',
        maxQty: 'Maks adet',
        none: 'Yok',
        ruleActive: 'Kural aktif',
        ruleOff: 'Kural kapalı',
        delete: 'Sil',
        cancel: 'İptal',
        save: 'Kaydet',
        saving: 'Kaydediliyor...',
        missingMaterial: 'Malzeme eksik',
        selectMaterial: 'Bir paketleme malzemesi seçin.',
        invalidRule: 'Geçersiz kural',
        checkValues: 'Adet ve aralık değerlerini kontrol edin.',
        saveFailed: 'Kural kaydedilemedi',
        migrationNeeded: 'Paketleme kuralları migration dosyasının uygulandığından emin olun.',
        deleteFailed: 'Kural silinemedi',
        tryAgain: 'Lütfen tekrar deneyin.',
        qty: 'adet',
        deleteTitle: 'Kuralı sil',
        deleteWarning: 'Bu paketleme kuralı silinecek. Bu işlem geri alınamaz.',
        synced: 'Senkron',
        refreshing: 'Yenileniyor...',
    } : {
        title: 'Product Recipes',
        subtitle: 'Packaging rules are product-type based. Color and size do not change packaging.',
        materialCosts: 'Material costs',
        savedRules: 'saved rules',
        addRule: 'Add rule',
        noRules: 'No stored rules yet. Orders will use the safe fallback logic until rules are saved.',
        active: 'Active',
        off: 'Off',
        editRule: 'Edit rule',
        newRule: 'New rule',
        material: 'Material',
        quantityMode: 'Quantity mode',
        perItem: 'Per item',
        fixed: 'Fixed',
        quantity: 'Quantity',
        minQty: 'Min qty',
        maxQty: 'Max qty',
        none: 'None',
        ruleActive: 'Rule is active',
        ruleOff: 'Rule is off',
        delete: 'Delete',
        cancel: 'Cancel',
        save: 'Save',
        saving: 'Saving...',
        missingMaterial: 'Missing material',
        selectMaterial: 'Select a packaging material.',
        invalidRule: 'Invalid rule',
        checkValues: 'Check quantity and range values.',
        saveFailed: 'Could not save rule',
        migrationNeeded: 'Make sure the packaging rules migration has been applied.',
        deleteFailed: 'Could not delete rule',
        tryAgain: 'Please try again.',
        qty: 'qty',
        deleteTitle: 'Delete rule',
        deleteWarning: 'This packaging rule will be deleted. This cannot be undone.',
        synced: 'Synced',
        refreshing: 'Refreshing...',
    };
    const [materials, setMaterials] = useState<PackagingMaterial[]>([]);
    const [rules, setRules] = useState<ProductPackagingRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [draft, setDraft] = useState<DraftRule | null>(null);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const rulesByType = useMemo(() => {
        const grouped = new Map<ProductType, ProductPackagingRule[]>();
        for (const type of PRODUCT_TYPES) grouped.set(type, []);
        for (const rule of rules) {
            const productType = rule.product_type as ProductType | null;
            if (!productType || !grouped.has(productType)) continue;
            grouped.set(productType, [...(grouped.get(productType) || []), rule]);
        }
        return grouped;
    }, [rules]);

    async function loadData() {
        setLoading(true);
        const [materialsRes, rulesRes] = await Promise.all([
            costService.getPackagingMaterials(),
            costService.getProductPackagingRules(),
        ]);
        if (materialsRes.data) setMaterials(materialsRes.data);
        if (rulesRes.data) setRules(rulesRes.data);
        setLastUpdated(new Date());
        setLoading(false);
        setRefreshing(false);
    }

    useEffect(() => {
        loadData();
    }, []);

    function openNewRule(productType: ProductType) {
        setDraft({
            ...EMPTY_DRAFT,
            product_type: productType,
            material_id: materials.find(m => m.active)?.id ?? materials[0]?.id ?? null,
        });
    }

    function openEditRule(rule: ProductPackagingRule) {
        setDraft({
            id: rule.id,
            product_type: rule.product_type as ProductType,
            material_id: rule.material_id,
            quantity: String(rule.quantity ?? 1),
            quantity_mode: rule.quantity_mode ?? 'per_item',
            min_qty: String(rule.min_qty ?? 1),
            max_qty: rule.max_qty === null ? '' : String(rule.max_qty),
            active: rule.active,
        });
    }

    async function saveRule() {
        if (!draft) return;
        if (!draft.material_id) {
            Alert.alert(copy.missingMaterial, copy.selectMaterial);
            return;
        }

        const quantity = Number(draft.quantity);
        const minQty = Number(draft.min_qty);
        const maxQty = draft.max_qty.trim() ? Number(draft.max_qty) : null;
        if (!quantity || quantity <= 0 || !minQty || minQty <= 0 || (maxQty !== null && maxQty < minQty)) {
            Alert.alert(copy.invalidRule, copy.checkValues);
            return;
        }

        setSaving(true);
        const payload = {
            product_type: draft.product_type,
            material_id: draft.material_id,
            quantity,
            quantity_mode: draft.quantity_mode,
            min_qty: minQty,
            max_qty: maxQty,
            active: draft.active,
        };

        const result = draft.id
            ? await costService.updateProductPackagingRule(draft.id, payload)
            : await costService.addProductPackagingRule(payload);

        setSaving(false);
        if (result.error) {
            Alert.alert(copy.saveFailed, copy.migrationNeeded);
            return;
        }
        setDraft(null);
        loadData();
    }

    async function deleteRule() {
        if (!draft?.id) return;
        setSaving(true);
        const { error } = await costService.deleteProductPackagingRule(draft.id);
        setSaving(false);
        if (error) {
            Alert.alert(copy.deleteFailed, copy.tryAgain);
            return;
        }
        setDraft(null);
        loadData();
    }

    function onRefresh() {
        setRefreshing(true);
        loadData();
    }

    function materialName(id: number | null) {
        return materials.find(m => m.id === id)?.name || 'Material';
    }

    function ruleSubtitle(rule: ProductPackagingRule) {
        const range = rule.max_qty ? `${rule.min_qty}-${rule.max_qty}` : `${rule.min_qty}+`;
        const mode = rule.quantity_mode === 'per_item' ? copy.perItem : copy.fixed;
        return `${rule.quantity} ${mode} · ${copy.qty} ${range}`;
    }

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <LoadingSkeleton rows={5} style={styles.loadingContent} />
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
            <Text style={styles.subtitle}>{copy.subtitle}</Text>
            <SyncStatus timestamp={lastUpdated} syncing={refreshing || loading} label={copy.synced} syncingLabel={copy.refreshing} style={styles.syncStatus} />

            <View style={styles.materialsCard}>
                <Text style={styles.sectionLabel}>{copy.materialCosts}</Text>
                <View style={styles.materialsGrid}>
                    {materials.map(material => (
                        <View key={material.id} style={[styles.materialChip, !material.active && styles.inactiveChip]}>
                            <Text style={styles.materialName}>{material.name}</Text>
                            <Text style={styles.materialCost}>{Number(material.unit_cost).toFixed(2)}₺</Text>
                        </View>
                    ))}
                </View>
            </View>

            {PRODUCT_TYPES.map(productType => {
                const typeRules = rulesByType.get(productType) || [];
                return (
                    <View key={productType} style={styles.ruleCard}>
                        <View style={styles.ruleHeader}>
                            <View>
                                <Text style={styles.ruleType}>{productType}</Text>
                                <Text style={styles.ruleMeta}>{typeRules.length} {copy.savedRules}</Text>
                            </View>
                            <TouchableOpacity style={styles.addRuleButton} onPress={() => openNewRule(productType)}>
                                <Text style={styles.addRuleText}>{copy.addRule}</Text>
                            </TouchableOpacity>
                        </View>

                        {typeRules.length === 0 ? (
                            <View style={styles.emptyRule}>
                                <Text style={styles.emptyRuleText}>{copy.noRules}</Text>
                            </View>
                        ) : (
                            typeRules.map(rule => (
                                <TouchableOpacity key={rule.id} style={styles.ruleRow} onPress={() => openEditRule(rule)}>
                                    <View style={styles.ruleDot} />
                                    <View style={styles.ruleRowBody}>
                                        <Text style={styles.ruleMaterial}>{materialName(rule.material_id)}</Text>
                                        <Text style={styles.ruleSubtitle}>{ruleSubtitle(rule)}</Text>
                                    </View>
                                    <StatusBadge label={rule.active ? copy.active : copy.off} tone={rule.active ? 'success' : 'muted'} />
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                );
            })}

            <Modal visible={!!draft} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>{draft?.id ? copy.editRule : copy.newRule}</Text>
                        <Text style={styles.modalSubtitle}>{draft?.product_type}</Text>

                        <Text style={styles.inputLabel}>{copy.material}</Text>
                        <View style={styles.choiceGrid}>
                            {materials.map(material => (
                                <TouchableOpacity
                                    key={material.id}
                                    style={[styles.choice, draft?.material_id === material.id && styles.choiceActive]}
                                    onPress={() => setDraft(current => current ? { ...current, material_id: material.id } : current)}
                                >
                                    <Text style={[styles.choiceText, draft?.material_id === material.id && styles.choiceTextActive]}>
                                        {material.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.inputLabel}>{copy.quantityMode}</Text>
                        <View style={styles.segmentRow}>
                            {(['per_item', 'fixed'] as const).map(mode => (
                                <TouchableOpacity
                                    key={mode}
                                    style={[styles.segment, draft?.quantity_mode === mode && styles.segmentActive]}
                                    onPress={() => setDraft(current => current ? { ...current, quantity_mode: mode } : current)}
                                >
                                    <Text style={[styles.segmentText, draft?.quantity_mode === mode && styles.segmentTextActive]}>
                                        {mode === 'per_item' ? copy.perItem : copy.fixed}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.inputRow}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>{copy.quantity}</Text>
                                <TextInput
                                    value={draft?.quantity}
                                    onChangeText={value => setDraft(current => current ? { ...current, quantity: value } : current)}
                                    keyboardType="numeric"
                                    style={styles.input}
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>{copy.minQty}</Text>
                                <TextInput
                                    value={draft?.min_qty}
                                    onChangeText={value => setDraft(current => current ? { ...current, min_qty: value } : current)}
                                    keyboardType="numeric"
                                    style={styles.input}
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>{copy.maxQty}</Text>
                                <TextInput
                                    value={draft?.max_qty}
                                    onChangeText={value => setDraft(current => current ? { ...current, max_qty: value } : current)}
                                    keyboardType="numeric"
                                    placeholder={copy.none}
                                    placeholderTextColor={colors.text.secondary}
                                    style={styles.input}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.activeToggle}
                            onPress={() => setDraft(current => current ? { ...current, active: !current.active } : current)}
                        >
                            <Text style={styles.activeToggleText}>{draft?.active ? copy.ruleActive : copy.ruleOff}</Text>
                        </TouchableOpacity>

                        <View style={styles.modalActions}>
                            {draft?.id ? (
                                <TouchableOpacity style={styles.deleteButton} onPress={() => setConfirmDeleteOpen(true)} disabled={saving}>
                                    <Text style={styles.deleteText}>{copy.delete}</Text>
                                </TouchableOpacity>
                            ) : null}
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setDraft(null)} disabled={saving}>
                                <Text style={styles.cancelText}>{copy.cancel}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveButton} onPress={saveRule} disabled={saving}>
                                <Text style={styles.saveText}>{saving ? copy.saving : copy.save}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            <ConfirmDialog
                visible={confirmDeleteOpen}
                title={copy.deleteTitle}
                message={copy.deleteWarning}
                confirmLabel={copy.delete}
                cancelLabel={copy.cancel}
                destructive
                onConfirm={() => {
                    setConfirmDeleteOpen(false);
                    deleteRule();
                }}
                onCancel={() => setConfirmDeleteOpen(false)}
            />
        </ScrollView>
    );
}

function makeStyles(colors: ReturnType<typeof useAppSettings>['colors'], themeMode: 'light' | 'dark') {
    const v = createVisualSystem(colors, themeMode);
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg.page },
        content: { padding: SPACING.lg, paddingBottom: SPACING.xxl + SPACING.md },
        loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg.page },
        loadingContent: { width: '100%', paddingHorizontal: SPACING.lg },
        title: { ...v.type.title, color: colors.text.primary },
        subtitle: { ...v.type.body, color: colors.text.secondary, marginTop: SPACING.xs, marginBottom: SPACING.lg },
        syncStatus: { marginBottom: SPACING.md },
        materialsCard: {
            ...v.card,
            marginBottom: SPACING.md,
        },
        sectionLabel: { ...v.type.label, color: colors.text.secondary, textTransform: 'uppercase', marginBottom: SPACING.md },
        materialsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
        materialChip: { backgroundColor: colors.bg.raised, borderColor: colors.border.default, borderWidth: 1, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.sm },
        inactiveChip: { opacity: 0.5 },
        materialName: { ...v.type.label, fontWeight: '700', color: colors.text.primary },
        // Standalone highlighted price on a neutral chip — accent, not a status.
        materialCost: { ...v.type.caption, fontWeight: '700', color: colors.accent.bg, marginTop: 2 },
        ruleCard: {
            ...v.card,
            marginBottom: SPACING.md,
        },
        ruleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md, gap: SPACING.md },
        ruleType: { ...v.type.title, color: colors.text.primary },
        ruleMeta: { ...v.type.caption, color: colors.text.secondary, marginTop: 2 },
        addRuleButton: { backgroundColor: colors.accent.bg, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm, minHeight: 44, justifyContent: 'center' },
        addRuleText: { ...v.type.caption, color: colors.accent.fg, fontWeight: '700' },
        emptyRule: { backgroundColor: colors.bg.raised, borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: colors.border.default },
        emptyRuleText: { ...v.type.label, color: colors.text.secondary },
        ruleRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg.raised, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: colors.border.default },
        // A single consistent accent-colored bullet marker, not a multi-hue system.
        ruleDot: { width: 8, height: 8, borderRadius: RADIUS.pill, backgroundColor: colors.accent.bg, marginRight: SPACING.sm },
        ruleRowBody: { flex: 1 },
        ruleMaterial: { ...v.type.body, fontWeight: '700', color: colors.text.primary },
        ruleSubtitle: { ...v.type.caption, color: colors.text.secondary, marginTop: 2 },
        modalOverlay: { flex: 1, backgroundColor: OVERLAY_SCRIM, justifyContent: 'flex-end' },
        modalCard: { backgroundColor: colors.bg.surface, borderTopLeftRadius: RADIUS.md, borderTopRightRadius: RADIUS.md, padding: SPACING.lg, paddingBottom: SPACING.xxl },
        modalTitle: { ...v.type.title, color: colors.text.primary },
        modalSubtitle: { ...v.type.body, color: colors.text.secondary, marginTop: 2, marginBottom: SPACING.lg },
        inputLabel: { ...v.type.caption, fontWeight: '700', color: colors.text.secondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: SPACING.xs },
        choiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
        // Selection reads as the app's ordinary chip-selected state (the brand accent).
        choice: { minHeight: 44, justifyContent: 'center', paddingHorizontal: SPACING.sm, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm, backgroundColor: colors.bg.raised, borderWidth: 1, borderColor: colors.border.default },
        choiceActive: { backgroundColor: colors.accent.bg, borderColor: colors.accent.bg },
        choiceText: { ...v.type.caption, fontWeight: '700', color: colors.text.secondary },
        choiceTextActive: { color: colors.accent.fg },
        segmentRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
        segment: { flex: 1, minHeight: 44, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm, backgroundColor: colors.bg.raised, borderWidth: 1, borderColor: colors.border.default, alignItems: 'center', justifyContent: 'center' },
        segmentActive: { backgroundColor: colors.accent.bg, borderColor: colors.accent.bg },
        segmentText: { ...v.type.label, fontWeight: '700', color: colors.text.secondary },
        segmentTextActive: { color: colors.accent.fg },
        inputRow: { flexDirection: 'row', gap: SPACING.sm },
        inputGroup: { flex: 1 },
        input: { ...v.input },
        activeToggle: { backgroundColor: colors.bg.raised, borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.md, borderWidth: 1, borderColor: colors.border.default, minHeight: 44, justifyContent: 'center' },
        activeToggleText: { ...v.type.body, fontWeight: '700', color: colors.text.primary, textAlign: 'center' },
        modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.lg },
        deleteButton: { marginRight: 'auto', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, minHeight: 44, justifyContent: 'center' },
        deleteText: { color: colors.status.danger.fg, fontWeight: '700' },
        cancelButton: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm, backgroundColor: colors.bg.raised, minHeight: 44, justifyContent: 'center' },
        cancelText: { color: colors.text.primary, fontWeight: '700' },
        saveButton: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm, backgroundColor: colors.accent.bg, minHeight: 44, justifyContent: 'center' },
        saveText: { color: colors.accent.fg, fontWeight: '700' },
    });
}
