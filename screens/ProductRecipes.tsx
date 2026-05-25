import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
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
    const { colors, language } = useAppSettings();
    const styles = makeStyles(colors);
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
    };
    const [materials, setMaterials] = useState<PackagingMaterial[]>([]);
    const [rules, setRules] = useState<ProductPackagingRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [draft, setDraft] = useState<DraftRule | null>(null);

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
        setLoading(false);
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
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.subtitle}>{copy.subtitle}</Text>

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
                                    <Text style={[styles.ruleState, !rule.active && styles.ruleStateInactive]}>
                                        {rule.active ? copy.active : copy.off}
                                    </Text>
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
                                    placeholderTextColor={colors.subtext}
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
                                <TouchableOpacity style={styles.deleteButton} onPress={deleteRule} disabled={saving}>
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
        </ScrollView>
    );
}

function makeStyles(colors: ReturnType<typeof useAppSettings>['colors']) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        content: { padding: 20, paddingBottom: 44 },
        loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
        title: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.4 },
        subtitle: { fontSize: 14, color: colors.subtext, marginTop: 4, marginBottom: 18, lineHeight: 20 },
        materialsCard: {
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 14,
        },
        sectionLabel: { fontSize: 12, fontWeight: '800', color: colors.subtext, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
        materialsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
        materialChip: { backgroundColor: colors.surfaceMuted, borderColor: colors.border, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
        inactiveChip: { opacity: 0.5 },
        materialName: { fontSize: 13, fontWeight: '700', color: colors.text },
        materialCost: { fontSize: 12, fontWeight: '800', color: colors.primary, marginTop: 2 },
        ruleCard: {
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 12,
        },
        ruleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12 },
        ruleType: { fontSize: 18, fontWeight: '800', color: colors.text },
        ruleMeta: { fontSize: 12, color: colors.subtext, marginTop: 2 },
        addRuleButton: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
        addRuleText: { color: '#fff', fontWeight: '800', fontSize: 12 },
        emptyRule: { backgroundColor: colors.surfaceMuted, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border },
        emptyRuleText: { fontSize: 13, color: colors.subtext, lineHeight: 18 },
        ruleRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
        ruleDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginRight: 10 },
        ruleRowBody: { flex: 1 },
        ruleMaterial: { fontSize: 14, fontWeight: '800', color: colors.text },
        ruleSubtitle: { fontSize: 12, color: colors.subtext, marginTop: 2 },
        ruleState: { fontSize: 11, fontWeight: '800', color: colors.success },
        ruleStateInactive: { color: colors.subtext },
        modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
        modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 34 },
        modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
        modalSubtitle: { fontSize: 14, color: colors.subtext, marginTop: 2, marginBottom: 16 },
        inputLabel: { fontSize: 12, fontWeight: '800', color: colors.subtext, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 7 },
        choiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
        choice: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border },
        choiceActive: { backgroundColor: colors.primary, borderColor: colors.primary },
        choiceText: { fontSize: 12, fontWeight: '800', color: colors.subtext },
        choiceTextActive: { color: '#fff' },
        segmentRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
        segment: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
        segmentActive: { backgroundColor: colors.primary, borderColor: colors.primary },
        segmentText: { fontSize: 13, fontWeight: '800', color: colors.subtext },
        segmentTextActive: { color: '#fff' },
        inputRow: { flexDirection: 'row', gap: 8 },
        inputGroup: { flex: 1 },
        input: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted, color: colors.text, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, fontSize: 14 },
        activeToggle: { backgroundColor: colors.surfaceMuted, borderRadius: 12, padding: 12, marginTop: 14, borderWidth: 1, borderColor: colors.border },
        activeToggleText: { fontSize: 14, fontWeight: '800', color: colors.text, textAlign: 'center' },
        modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginTop: 18 },
        deleteButton: { marginRight: 'auto', paddingHorizontal: 12, paddingVertical: 11 },
        deleteText: { color: colors.danger, fontWeight: '800' },
        cancelButton: { paddingHorizontal: 14, paddingVertical: 11, borderRadius: 10, backgroundColor: colors.surfaceMuted },
        cancelText: { color: colors.text, fontWeight: '800' },
        saveButton: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10, backgroundColor: colors.primary },
        saveText: { color: '#fff', fontWeight: '800' },
    });
}
