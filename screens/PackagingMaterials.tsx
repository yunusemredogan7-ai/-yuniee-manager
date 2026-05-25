import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { costService, PackagingMaterial } from '../src/services/costService';
import { useAppSettings } from '../src/core/settings/AppSettingsContext';

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
    };
    const unitLabels: Record<string, string> = language === 'tr'
        ? { piece: 'adet', meter: 'metre', gram: 'gram', pack: 'paket' }
        : { piece: 'piece', meter: 'meter', gram: 'gram', pack: 'pack' };
    const getUnitLabel = (unit: string) => unitLabels[unit] || unit;
    const [materials, setMaterials] = useState<PackagingMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [modalVisible, setModalVisible] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [name, setName] = useState('');
    const [unitType, setUnitType] = useState('piece');
    const [unitCost, setUnitCost] = useState('');

    const fetchMaterials = useCallback(async () => {
        setLoading(true);
        const { data, error } = await costService.getPackagingMaterials();
        if (error) {
            Alert.alert(copy.error, copy.loadFailed);
        } else if (data) {
            setMaterials(data as PackagingMaterial[]);
        }
        setLoading(false);
    }, [copy.error, copy.loadFailed]);

    useEffect(() => {
        fetchMaterials();
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
        if (!name.trim() || !unitType.trim() || !unitCost.trim()) {
            Alert.alert(copy.error, copy.fillFields);
            return;
        }

        const costVal = parseFloat(unitCost.replace(',', '.'));
        if (isNaN(costVal)) {
            Alert.alert(copy.error, copy.invalidCost);
            return;
        }

        setLoading(true);
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
        setModalVisible(false);
    };

    const handleDelete = (id: number) => {
        Alert.alert(copy.deleteTitle, copy.deleteWarning, [
            { text: copy.cancel, style: 'cancel' },
            { text: copy.delete, style: 'destructive', onPress: async () => {
                setLoading(true);
                const { success } = await costService.deletePackagingMaterial(id);
                if (!success) Alert.alert(copy.error, copy.deleteFailed);
                fetchMaterials();
            }}
        ]);
    };

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
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

            <FlatList
                data={materials}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyBlock}>
                        <Text style={styles.emptyText}>{copy.empty}</Text>
                    </View>
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
                            <TouchableOpacity
                                style={[styles.statusPill, item.active ? styles.statusActive : styles.statusInactive]}
                                onPress={() => toggleActive(item.id, item.active)}
                            >
                                <View style={[styles.statusDotInner, item.active ? styles.dotGreen : styles.dotGray]} />
                                <Text style={[styles.statusPillText, item.active ? styles.statusTextActive : styles.statusTextInactive]}>
                                    {item.active ? copy.active : copy.inactive}
                                </Text>
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
                                placeholderTextColor="#9ca3af"
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
                                placeholderTextColor="#9ca3af"
                            />

                            <View style={styles.modalActions}>
                                <TouchableOpacity style={styles.modalCancel} onPress={() => setModalVisible(false)}>
                                    <Text style={styles.modalCancelText}>{copy.cancel}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.modalSave} onPress={handleSave}>
                                    <Text style={styles.modalSaveText}>{copy.save}</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

function makeStyles(colors: ReturnType<typeof useAppSettings>['colors'], themeMode: 'light' | 'dark') {
return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg, padding: 20 },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
    title: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
    subtitle: { fontSize: 14, color: colors.subtext, marginBottom: 20, marginTop: 2 },
    addButton: { backgroundColor: colors.primary, padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 16 },
    addButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    listContent: { paddingBottom: 40 },
    emptyBlock: { alignItems: 'center', paddingVertical: 30, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border },
    emptyText: { color: colors.subtext, fontSize: 14 },
    // ── Card ──
    card: {
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 14,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        shadowOffset: { width: 0, height: 2 },
        borderColor: colors.border,
        borderWidth: 1,
    },
    cardInactive: {
        opacity: 0.6,
    },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardInfo: { flex: 1, marginRight: 12 },
    cardName: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
    costRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
    costValue: { fontSize: 18, fontWeight: '800', color: colors.primary, letterSpacing: -0.3 },
    costUnit: { fontSize: 13, color: colors.subtext, fontWeight: '500' },
    // ── Status pill ──
    statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
    statusActive: { backgroundColor: themeMode === 'dark' ? '#183025' : '#f0fdf4', borderColor: themeMode === 'dark' ? '#2e6b4d' : '#86efac' },
    statusInactive: { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
    statusDotInner: { width: 6, height: 6, borderRadius: 3 },
    dotGreen: { backgroundColor: colors.success },
    dotGray: { backgroundColor: colors.subtext },
    statusPillText: { fontSize: 12, fontWeight: '700' },
    statusTextActive: { color: colors.success },
    statusTextInactive: { color: colors.subtext },
    // ── Actions ──
    cardActions: { flexDirection: 'row', gap: 8, paddingTop: 12, marginTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
    editBtn: { flex: 1, backgroundColor: colors.surfaceMuted, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
    editBtnText: { color: colors.text, fontSize: 14, fontWeight: '600' },
    deleteBtn: { flex: 1, backgroundColor: themeMode === 'dark' ? '#352026' : '#fef2f2', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
    deleteBtnText: { color: colors.danger, fontSize: 14, fontWeight: '600' },
    // ── Modal ──
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
    modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20, color: colors.text },
    label: { fontSize: 12, fontWeight: '700', color: colors.subtext, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
    input: { backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, fontSize: 16, marginBottom: 16, color: colors.text },
    unitTypeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    unitTypePill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border },
    unitTypePillActive: { backgroundColor: themeMode === 'dark' ? '#252b4a' : '#eef2ff', borderColor: colors.primary },
    unitTypePillText: { fontSize: 14, fontWeight: '600', color: colors.subtext },
    unitTypePillTextActive: { color: colors.primary },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 10 },
    modalCancel: { flex: 1, paddingVertical: 14, backgroundColor: colors.surfaceMuted, borderRadius: 10, alignItems: 'center' },
    modalCancelText: { fontSize: 16, fontWeight: '600', color: colors.text },
    modalSave: { flex: 1, paddingVertical: 14, backgroundColor: colors.primary, borderRadius: 10, alignItems: 'center' },
    modalSaveText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
}
