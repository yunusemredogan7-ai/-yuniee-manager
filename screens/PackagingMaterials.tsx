import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    RefreshControl
} from 'react-native';
import { costService, PackagingMaterial } from '../src/services/costService';
import { useAppSettings } from '../src/core/settings/AppSettingsContext';
import { createVisualSystem } from '../src/core/theme/visualSystem';
import { ConfirmDialog, EmptyState, FilterChip, LoadingSkeleton, StatusBadge, SyncStatus } from '../src/components/ui';
import { OVERLAY_SCRIM, RADIUS, SPACING } from '../src/core/theme/tokens';

const UNIT_TYPES = ['piece', 'meter', 'gram', 'pack'] as const;

export default function PackagingMaterials() {
    const { colors, language, themeMode } = useAppSettings();
    const styles = React.useMemo(() => makeStyles(colors, themeMode), [colors, themeMode]);
    const copy = language === 'tr' ? {
        title: 'Paketleme Malzemeleri',
        subtitle: 'Malzemeleri ve birim maliyetlerini yönetin',
        newMaterial: '+ Yeni Malzeme',
        empty: 'Henüz malzeme tanımlanmadı',
        active: 'Aktif',
        inactive: 'Pasif',
        edit: 'Düzenle',
        delete: 'Sil',
        editMaterial: 'Malzemeyi Düzenle',
        newMaterialTitle: 'Yeni Malzeme',
        name: 'Ad',
        namePlaceholder: 'Örn. Karton kutu',
        unitType: 'Birim Tipi',
        unitCost: 'Birim Maliyet (₺)',
        cancel: 'İptal',
        save: 'Kaydet',
        error: 'Hata',
        loadFailed: 'Malzemeler yüklenemedi',
        updateFailed: 'Malzeme durumu güncellenemedi',
        fillFields: 'Lütfen tüm alanları doldurun',
        invalidCost: 'Geçersiz maliyet formatı',
        saveFailed: 'Kaydetme başarısız',
        createFailed: 'Oluşturma başarısız',
        deleteTitle: 'Malzemeyi Sil',
        deleteWarning: 'Bu işlem mevcut ürün reçetelerini etkileyebilir. Devam edilsin mi?',
        deleteFailed: 'Malzeme silinemedi',
        all: 'Tümü',
        synced: 'Senkron',
        refreshing: 'Yenileniyor...',
        saving: 'Kaydediliyor...',
    } : {
        title: 'Packaging Materials',
        subtitle: 'Define supply items and their costs',
        newMaterial: '+ New Material',
        empty: 'No materials defined yet',
        active: 'Active',
        inactive: 'Inactive',
        edit: 'Edit',
        delete: 'Delete',
        editMaterial: 'Edit Material',
        newMaterialTitle: 'New Material',
        name: 'Name',
        namePlaceholder: 'e.g. Cardboard Box',
        unitType: 'Unit Type',
        unitCost: 'Unit Cost (₺)',
        cancel: 'Cancel',
        save: 'Save',
        error: 'Error',
        loadFailed: 'Failed to load materials',
        updateFailed: 'Failed to update material status',
        fillFields: 'Please fill all fields',
        invalidCost: 'Invalid cost format',
        saveFailed: 'Update failed',
        createFailed: 'Creation failed',
        deleteTitle: 'Delete Material',
        deleteWarning: 'This may break existing product recipes. Continue?',
        deleteFailed: 'Could not delete material',
        all: 'All',
        synced: 'Synced',
        refreshing: 'Refreshing...',
        saving: 'Saving...',
    };
    const unitLabels: Record<string, string> = language === 'tr'
        ? { piece: 'adet', meter: 'metre', gram: 'gram', pack: 'paket' }
        : { piece: 'piece', meter: 'meter', gram: 'gram', pack: 'pack' };
    const getUnitLabel = (unit: string) => unitLabels[unit] || unit;
    const [materials, setMaterials] = useState<PackagingMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
    
    const [modalVisible, setModalVisible] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [name, setName] = useState('');
    const [unitType, setUnitType] = useState('piece');
    const [unitCost, setUnitCost] = useState('');

    const fetchMaterials = useCallback(async (showLoader = true) => {
        if (showLoader) setLoading(true);
        const { data, error } = await costService.getPackagingMaterials();
        if (error) {
            Alert.alert(copy.error, copy.loadFailed);
        } else if (data) {
            setMaterials(data as PackagingMaterial[]);
            setLastUpdated(new Date());
        }
        setLoading(false);
        setRefreshing(false);
    }, [copy.error, copy.loadFailed]);

    useEffect(() => {
        fetchMaterials();
    }, [fetchMaterials]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchMaterials(false);
    }, [fetchMaterials]);

    const toggleActive = async (id: number, currentStatus: boolean) => {
        const { error } = await costService.updatePackagingMaterial(id, { active: !currentStatus });
        if (error) {
            Alert.alert(copy.error, copy.updateFailed);
        } else {
            setMaterials(prev => prev.map(m => m.id === id ? { ...m, active: !currentStatus } : m));
        }
    };

    const openCreateModal = () => {
        setEditingId(null);
        setName('');
        setUnitType('piece');
        setUnitCost('');
        setModalVisible(true);
    };

    const openEditModal = (material: PackagingMaterial) => {
        setEditingId(material.id);
        setName(material.name);
        setUnitType(material.unit_type);
        setUnitCost(material.unit_cost.toString());
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (saving) return;
        if (!name.trim() || !unitType.trim() || !unitCost.trim()) {
            Alert.alert(copy.error, copy.fillFields);
            return;
        }

        const costVal = parseFloat(unitCost.replace(',', '.'));
        if (isNaN(costVal)) {
            Alert.alert(copy.error, copy.invalidCost);
            return;
        }

        setSaving(true);
        if (editingId) {
            const { error } = await costService.updatePackagingMaterial(editingId, {
                name: name.trim(),
                unit_type: unitType.trim(),
                unit_cost: costVal
            });
            if (error) Alert.alert(copy.error, copy.saveFailed);
            else fetchMaterials();
        } else {
            const { error } = await costService.addPackagingMaterial({
                name: name.trim(),
                unit_type: unitType.trim(),
                unit_cost: costVal,
                active: true
            });
            if (error) Alert.alert(copy.error, copy.createFailed);
            else fetchMaterials();
        }
        setSaving(false);
        setModalVisible(false);
    };

    const handleDelete = (id: number) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        const id = deleteId;
        setDeleteId(null);
        setLoading(true);
        const { success } = await costService.deletePackagingMaterial(id);
        if (!success) Alert.alert(copy.error, copy.deleteFailed);
        fetchMaterials();
    };

    const filteredMaterials = React.useMemo(() => {
        return materials.filter(material => {
            const matchesActive =
                activeFilter === 'all' ||
                (activeFilter === 'active' && material.active) ||
                (activeFilter === 'inactive' && !material.active);
            return matchesActive;
        });
    }, [activeFilter, materials]);

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <LoadingSkeleton rows={4} style={styles.loadingContent} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.subtitle}>{copy.subtitle}</Text>

            <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
                <Text style={styles.addButtonText}>{copy.newMaterial}</Text>
            </TouchableOpacity>
            <SyncStatus timestamp={lastUpdated} syncing={refreshing || loading} label={copy.synced} syncingLabel={copy.refreshing} style={styles.syncStatus} />
            <View style={styles.tools}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    <FilterChip label={copy.all} selected={activeFilter === 'all'} onPress={() => setActiveFilter('all')} count={materials.length} />
                    <FilterChip label={copy.active} selected={activeFilter === 'active'} onPress={() => setActiveFilter(activeFilter === 'active' ? 'all' : 'active')} tone="success" count={materials.filter(m => m.active).length} />
                    <FilterChip label={copy.inactive} selected={activeFilter === 'inactive'} onPress={() => setActiveFilter(activeFilter === 'inactive' ? 'all' : 'inactive')} count={materials.filter(m => !m.active).length} />
                </ScrollView>
            </View>

            <FlatList
                data={filteredMaterials}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <EmptyState
                        icon="+"
                        title={copy.empty}
                        description={copy.subtitle}
                        actionLabel={copy.newMaterial}
                        onAction={openCreateModal}
                    />
                }
                renderItem={({ item }) => (
                    <View style={[styles.card, !item.active && styles.cardInactive]}>
                        <View style={styles.cardTop}>
                            <View style={styles.cardInfo}>
                                <Text style={styles.cardName}>{item.name}</Text>
                                <View style={styles.costRow}>
                                    <Text style={styles.costValue}>{item.unit_cost}₺</Text>
                                    <Text style={styles.costUnit}>/ {getUnitLabel(item.unit_type)}</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => toggleActive(item.id, item.active)}>
                                <StatusBadge
                                    label={item.active ? copy.active : copy.inactive}
                                    tone={item.active ? 'success' : 'muted'}
                                    dot
                                />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.cardActions}>
                            <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
                                <Text style={styles.editBtnText}>{copy.edit}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                                <Text style={styles.deleteBtnText}>{copy.delete}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />

            {/* Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView 
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <View style={styles.modalContainer}>
                        <ScrollView keyboardShouldPersistTaps="handled">
                            <Text style={styles.modalTitle}>{editingId ? copy.editMaterial : copy.newMaterialTitle}</Text>
                            
                            <Text style={styles.label}>{copy.name}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={copy.namePlaceholder}
                                value={name}
                                onChangeText={setName}
                                placeholderTextColor={colors.text.secondary}
                            />

                            <Text style={styles.label}>{copy.unitType}</Text>
                            <View style={styles.unitTypeRow}>
                                {UNIT_TYPES.map((ut) => (
                                    <TouchableOpacity
                                        key={ut}
                                        style={[styles.unitTypePill, unitType === ut && styles.unitTypePillActive]}
                                        onPress={() => setUnitType(ut)}
                                    >
                                        <Text style={[styles.unitTypePillText, unitType === ut && styles.unitTypePillTextActive]}>
                                            {getUnitLabel(ut)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>{copy.unitCost}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0.00"
                                value={unitCost}
                                onChangeText={setUnitCost}
                                keyboardType="decimal-pad"
                                placeholderTextColor={colors.text.secondary}
                            />

                            <View style={styles.modalActions}>
                                <TouchableOpacity style={styles.modalCancel} onPress={() => setModalVisible(false)}>
                                    <Text style={styles.modalCancelText}>{copy.cancel}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.modalSave, saving && styles.disabled]} onPress={handleSave} disabled={saving}>
                                    <Text style={styles.modalSaveText}>{saving ? copy.saving : copy.save}</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
            <ConfirmDialog
                visible={deleteId !== null}
                title={copy.deleteTitle}
                message={copy.deleteWarning}
                confirmLabel={copy.delete}
                cancelLabel={copy.cancel}
                destructive
                onConfirm={confirmDelete}
                onCancel={() => setDeleteId(null)}
            />
        </View>
    );
}

function makeStyles(colors: ReturnType<typeof useAppSettings>['colors'], themeMode: 'light' | 'dark') {
const v = createVisualSystem(colors, themeMode);
return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg.page, padding: SPACING.lg },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg.page },
    loadingContent: { width: '100%', paddingHorizontal: SPACING.lg },
    title: { ...v.type.title, color: colors.text.primary },
    subtitle: { ...v.type.body, color: colors.text.secondary, marginBottom: SPACING.xl, marginTop: 2 },
    addButton: { ...v.primaryButton, marginBottom: SPACING.lg },
    addButtonText: { color: colors.accent.fg, ...v.type.label },
    syncStatus: { marginBottom: SPACING.md },
    tools: { gap: SPACING.sm, marginBottom: SPACING.md },
    filterRow: { gap: SPACING.sm, paddingRight: SPACING.xs },
    listContent: { paddingBottom: SPACING.xxl + SPACING.sm },
    // ── Card ──
    card: {
        ...v.card,
        padding: SPACING.lg,
        marginBottom: SPACING.sm,
    },
    cardInactive: {
        opacity: 0.6,
    },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardInfo: { flex: 1, marginRight: SPACING.md },
    cardName: { ...v.type.heading, color: colors.text.primary, marginBottom: SPACING.xs },
    costRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
    // Standalone highlighted price on a neutral card — accent, not a status.
    costValue: { ...v.type.heading, color: colors.accent.bg },
    costUnit: { ...v.type.label, color: colors.text.secondary },
    // ── Actions ──
    cardActions: { flexDirection: 'row', gap: SPACING.sm, paddingTop: SPACING.md, marginTop: SPACING.md, borderTopWidth: 1, borderTopColor: colors.border.default },
    editBtn: { flex: 1, minHeight: 44, justifyContent: 'center', backgroundColor: colors.bg.raised, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm, alignItems: 'center' },
    editBtnText: { color: colors.text.primary, ...v.type.body, fontWeight: '600' },
    // A genuine danger-tinted action (delete).
    deleteBtn: { flex: 1, minHeight: 44, justifyContent: 'center', ...v.dangerSurface, borderWidth: 1, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm, alignItems: 'center' },
    deleteBtnText: { color: colors.status.danger.fg, ...v.type.body, fontWeight: '600' },
    // ── Modal ──
    modalOverlay: { flex: 1, backgroundColor: OVERLAY_SCRIM, justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: colors.bg.surface, borderTopLeftRadius: RADIUS.md, borderTopRightRadius: RADIUS.md, padding: SPACING.xl, paddingBottom: SPACING.xxl + SPACING.sm },
    modalTitle: { ...v.type.title, marginBottom: SPACING.xl, color: colors.text.primary },
    label: { ...v.type.label, color: colors.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.xs },
    input: { ...v.input, marginBottom: SPACING.lg },
    unitTypeRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
    // Selection reads as the info tone, same as any other pick-one-of-N control.
    unitTypePill: { minHeight: 44, justifyContent: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.pill, backgroundColor: colors.bg.raised, borderWidth: 1, borderColor: colors.border.default },
    unitTypePillActive: { backgroundColor: colors.status.info.bg, borderColor: colors.status.info.fg },
    unitTypePillText: { ...v.type.body, fontWeight: '600', color: colors.text.secondary },
    unitTypePillTextActive: { color: colors.status.info.fg },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.md, marginTop: SPACING.sm },
    modalCancel: { flex: 1, ...v.secondaryButton },
    modalCancelText: { ...v.type.heading, color: colors.text.primary },
    modalSave: { flex: 1, ...v.primaryButton },
    modalSaveText: { ...v.type.heading, color: colors.accent.fg },
    disabled: { opacity: 0.55 },
});
}
