import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
} from 'react-native';
import { supabase } from '../src/core/supabase/client';
import { productsService, PRODUCT_TYPES, PRODUCT_COLORS, ProductType } from '../src/services/productsService';
import { productionService, ProductStock } from '../src/services/productionService';
import { stockService } from '../src/services/stockService';
import { useAppSettings } from '../src/core/settings/AppSettingsContext';

const SIZES = ['XS', 'S', 'M', 'L', 'XL'] as const;
const BAG_STOCK_KEY = 'bag-stock';
const BAG_STOCK_SIZE = '';

type ProductWithStock = ProductStock & {
    price: number;
    cost: number;
    product_type: ProductType | null;
    color: string | null;
};

export default function ProductManagement() {
    const { colors, language, themeMode } = useAppSettings();
    const styles = useMemo(() => makeStyles(colors, themeMode), [colors, themeMode]);
    const copy = language === 'tr' ? {
        warning: 'Uyarı',
        error: 'Hata',
        success: 'Başarılı',
        duplicate: 'Tekrarlı ürün',
        productNameRequired: 'Ürün adı gerekli.',
        duplicateProduct: 'Bu isimde bir ürün zaten var.',
        createFailed: 'Ürün oluşturulamadı.',
        productAdded: 'Ürün eklendi.',
        updateFailed: 'Ürün güncellenemedi.',
        productUpdated: 'Ürün güncellendi.',
        somethingWrong: 'Bir şeyler ters gitti.',
        enterQuantity: 'En az bir adet girin.',
        productionFailed: 'Üretim kaydedilemedi.',
        adjustFailed: (size: string) => `Stok ayarlanamadı. Beden: ${size}.`,
        actionSaved: (type: 'production' | 'adjustment') => `${type === 'production' ? 'Üretim' : 'Stok ayarı'} kaydedildi.`,
        cost: 'Maliyet',
        stock: 'Stok',
        total: 'Toplam',
        edit: 'Düzenle',
        production: '+ Üretim',
        adjust: '± Ayarla',
        search: 'Ürün ara...',
        newProduct: 'Yeni Ürün',
        productName: 'Ürün adı',
        productType: 'ÜRÜN TİPİ',
        color: 'RENK',
        price: 'Fiyat',
        addProduct: 'ÜRÜN EKLE',
        noMatching: 'Eşleşen ürün yok.',
        noProducts: 'Henüz ürün yok.',
        editProduct: 'Ürünü Düzenle',
        salePrice: 'SATIŞ FİYATI',
        saveChanges: 'DEĞİŞİKLİKLERİ KAYDET',
        cancel: 'İptal',
        recordProduction: 'Üretim Kaydı',
        adjustStock: 'Stok Ayarla',
        productionHint: 'Bedene göre üretilen adetleri girin',
        bagProductionHint: 'Çanta için toplam stok adedini girin',
        adjustmentHint: 'Stok düzeltmek için +/- değer girin (örn. -3)',
        bagAdjustmentHint: 'Çanta toplam stoğunu düzeltmek için +/- değer girin',
        saveProduction: 'ÜRETİMİ KAYDET',
        saveAdjustment: 'STOK AYARINI KAYDET',
        colors: {
            Black: 'Siyah',
            Ecru: 'Ekru',
            Default: 'Varsayılan',
        },
    } : {
        warning: 'Warning',
        error: 'Error',
        success: 'Success',
        duplicate: 'Duplicate Product',
        productNameRequired: 'Product name is required.',
        duplicateProduct: 'A product with this name already exists.',
        createFailed: 'Could not create product.',
        productAdded: 'Product added.',
        updateFailed: 'Could not update product.',
        productUpdated: 'Product updated.',
        somethingWrong: 'Something went wrong.',
        enterQuantity: 'Enter at least one quantity.',
        productionFailed: 'Could not save production.',
        adjustFailed: (size: string) => `Could not adjust stock for size ${size}.`,
        actionSaved: (type: 'production' | 'adjustment') => `${type === 'production' ? 'Production' : 'Adjustment'} saved.`,
        cost: 'Cost',
        stock: 'Stock',
        total: 'Total',
        edit: 'Edit',
        production: '+ Production',
        adjust: '± Adjust',
        search: 'Search products...',
        newProduct: 'New Product',
        productName: 'Product Name',
        productType: 'PRODUCT TYPE',
        color: 'COLOR',
        price: 'Price',
        addProduct: 'ADD PRODUCT',
        noMatching: 'No matching products.',
        noProducts: 'No products yet.',
        editProduct: 'Edit Product',
        salePrice: 'SALE PRICE',
        saveChanges: 'SAVE CHANGES',
        cancel: 'Cancel',
        recordProduction: 'Record Production',
        adjustStock: 'Adjust Stock',
        productionHint: 'Enter quantities produced per size',
        bagProductionHint: 'Enter total stock quantity for Bag',
        adjustmentHint: 'Enter +/− values to adjust stock (e.g. -3 to remove)',
        bagAdjustmentHint: 'Enter +/− values to adjust total Bag stock',
        saveProduction: 'SAVE PRODUCTION',
        saveAdjustment: 'SAVE ADJUSTMENT',
        colors: {
            Black: 'Black',
            Ecru: 'Ecru',
            Default: 'Default',
        },
    };
    const [products, setProducts] = useState<ProductWithStock[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Add Product form
    const [showAddForm, setShowAddForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [newCost, setNewCost] = useState('');
    const [newType, setNewType] = useState<ProductType>('T-shirt');
    const [newColor, setNewColor] = useState('Black');
    const [inserting, setInserting] = useState(false);

    // Edit modal
    const [editProduct, setEditProduct] = useState<ProductWithStock | null>(null);
    const [editPrice, setEditPrice] = useState('');
    const [editCost, setEditCost] = useState('');
    const [editType, setEditType] = useState<ProductType>('T-shirt');
    const [editColor, setEditColor] = useState('Black');
    const [saving, setSaving] = useState(false);

    // Production / Adjustment modal
    const [actionProduct, setActionProduct] = useState<ProductWithStock | null>(null);
    const [actionType, setActionType] = useState<'production' | 'adjustment'>('production');
    const [actionInputs, setActionInputs] = useState<Record<string, string>>({});
    const [actionSaving, setActionSaving] = useState(false);

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const { data: productStockData, error: stockErr } = await productionService.getProductsWithStock();
            const { data: productsData, error: productsErr } = await productsService.getProducts();

            if (stockErr || productsErr || !productStockData || !productsData) return;

            const merged: ProductWithStock[] = productStockData.map(ps => {
                const p = productsData.find(pd => pd.id === ps.id);
                return {
                    ...ps,
                    price: p?.price ?? 0,
                    cost: p?.cost ?? 0,
                    product_type: (p?.product_type as ProductType) ?? null,
                    color: p?.color ?? null,
                };
            });
            setProducts(merged);
        } catch (err) {
            console.log('fetchProducts catch:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
        const channel = supabase
            .channel('product-mgmt-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchProducts())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'stock' }, () => fetchProducts())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [fetchProducts]);

    const filteredProducts = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return products;
        return products.filter(p => p.name.toLowerCase().includes(q));
    }, [products, search]);

    function getStockQty(product: ProductWithStock, size: string): number {
        return product.stock?.find(s => s.size === size)?.quantity || 0;
    }

    function getTotalStock(product: ProductWithStock): number {
        return product.stock?.reduce((sum, s) => sum + (s.quantity || 0), 0) || 0;
    }

    function isBagProduct(product: ProductWithStock | null): boolean {
        return String(product?.product_type || '').trim().toLowerCase() === 'bag';
    }

    function getColorLabel(color: string): string {
        return copy.colors[color as keyof typeof copy.colors] || color;
    }

    // ── Add Product ──
    async function handleAddProduct() {
        if (!newName.trim()) {
            Alert.alert(copy.warning, copy.productNameRequired);
            return;
        }
        try {
            setInserting(true);
            const { error, duplicate } = await productsService.createProduct({
                name: newName.trim(),
                cost: Number(newCost) || 0,
                price: Number(newPrice) || 0,
                sku: null,
                size: null,
                product_type: newType,
                color: newColor,
            });
            if (duplicate) {
                Alert.alert(copy.duplicate, copy.duplicateProduct);
                return;
            }
            if (error) {
                Alert.alert(copy.error, copy.createFailed);
                return;
            }
            setNewName(''); setNewPrice(''); setNewCost('');
            setNewType('T-shirt'); setNewColor('Black');
            setShowAddForm(false);
            Alert.alert(copy.success, copy.productAdded);
            await fetchProducts();
        } catch {
            Alert.alert(copy.error, copy.somethingWrong);
        } finally {
            setInserting(false);
        }
    }

    // ── Edit Product ──
    function openEdit(product: ProductWithStock) {
        setEditProduct(product);
        setEditPrice(String(product.price || ''));
        setEditCost(String(product.cost || ''));
        setEditType(product.product_type || 'T-shirt');
        setEditColor(product.color || 'Black');
    }

    async function handleSaveEdit() {
        if (!editProduct) return;
        try {
            setSaving(true);
            const { error } = await productsService.updateProduct(editProduct.id, {
                price: Number(editPrice) || 0,
                cost: Number(editCost) || 0,
                product_type: editType,
                color: editColor,
            });
            if (error) {
                Alert.alert(copy.error, copy.updateFailed);
                return;
            }
            Alert.alert(copy.success, copy.productUpdated);
            setEditProduct(null);
            await fetchProducts();
        } catch {
            Alert.alert(copy.error, copy.somethingWrong);
        } finally {
            setSaving(false);
        }
    }

    // ── Production / Adjustment ──
    function openAction(product: ProductWithStock, type: 'production' | 'adjustment') {
        setActionProduct(product);
        setActionType(type);
        setActionInputs({});
    }

    async function handleSaveAction() {
        if (!actionProduct) return;
        const sizes: { size: string; qty: number }[] = [];
        if (isBagProduct(actionProduct)) {
            const val = parseInt(actionInputs[BAG_STOCK_KEY] || '0', 10);
            if (val !== 0) sizes.push({ size: BAG_STOCK_SIZE, qty: val });
        } else {
            for (const sz of SIZES) {
                const val = parseInt(actionInputs[sz] || '0', 10);
                if (val !== 0) sizes.push({ size: sz, qty: val });
            }
        }
        if (sizes.length === 0) {
            Alert.alert(copy.warning, copy.enterQuantity);
            return;
        }
        try {
            setActionSaving(true);
            if (actionType === 'production') {
                const { success, error } = await productionService.recordProduction(actionProduct.id, actionProduct.name, sizes);
                if (!success || error) { Alert.alert(copy.error, copy.productionFailed); return; }
            } else {
                for (const s of sizes) {
                    const { success, error } = await stockService.adjustStock(actionProduct.id, s.size, s.qty, 'Manual Adjustment', 'adjustment');
                    if (!success || error) { Alert.alert(copy.error, copy.adjustFailed(s.size)); return; }
                }
            }
            Alert.alert(copy.success, copy.actionSaved(actionType));
            setActionProduct(null); setActionInputs({});
            await fetchProducts();
        } catch {
            Alert.alert(copy.error, copy.somethingWrong);
        } finally {
            setActionSaving(false);
        }
    }

    const availableColors = PRODUCT_COLORS[newType] || ['Black', 'Ecru'];
    const editAvailableColors = PRODUCT_COLORS[editType] || ['Black', 'Ecru'];

    // Update color when type changes
    function handleNewTypeChange(t: ProductType) {
        setNewType(t);
        const availableProductColors = PRODUCT_COLORS[t];
        if (!availableProductColors.includes(newColor)) setNewColor(availableProductColors[0]);
    }
    function handleEditTypeChange(t: ProductType) {
        setEditType(t);
        const availableProductColors = PRODUCT_COLORS[t];
        if (!availableProductColors.includes(editColor)) setEditColor(availableProductColors[0]);
    }

    function renderProduct({ item }: { item: ProductWithStock }) {
        const isBag = isBagProduct(item);
        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                        <Text style={styles.productName}>{item.name}</Text>
                        <View style={styles.metaRow}>
                            {item.product_type && (
                                <View style={styles.typeBadge}>
                                    <Text style={styles.typeBadgeText}>{item.product_type}</Text>
                                </View>
                            )}
                            {item.color && (
                                <Text style={styles.colorText}>{getColorLabel(item.color)}</Text>
                            )}
                            <Text style={styles.priceText}>{item.price}₺</Text>
                            <Text style={styles.costText}>{copy.cost} {item.cost}₺</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
                        <Text style={styles.editBtnText}>{copy.edit}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.stockRow}>
                    {isBag ? (
                        <View style={[styles.stockCell, styles.bagStockCell]}>
                            <Text style={styles.stockLabel}>{copy.stock}</Text>
                            <Text style={[styles.stockValue, styles.stockValueTotal]}>{getTotalStock(item)}</Text>
                        </View>
                    ) : (
                        <>
                            {SIZES.map(sz => (
                                <View key={sz} style={styles.stockCell}>
                                    <Text style={styles.stockLabel}>{sz}</Text>
                                    <Text style={styles.stockValue}>{getStockQty(item, sz)}</Text>
                                </View>
                            ))}
                            <View style={[styles.stockCell, styles.stockCellTotal]}>
                                <Text style={styles.stockLabel}>{copy.total}</Text>
                                <Text style={[styles.stockValue, styles.stockValueTotal]}>{getTotalStock(item)}</Text>
                            </View>
                        </>
                    )}
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.productionBtn} onPress={() => openAction(item, 'production')}>
                        <Text style={styles.productionBtnText}>{copy.production}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.adjustBtn} onPress={() => openAction(item, 'adjustment')}>
                        <Text style={styles.adjustBtnText}>{copy.adjust}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.topRow}>
                <TextInput
                    placeholder={copy.search}
                    value={search}
                    onChangeText={setSearch}
                    style={styles.searchInput}
                    placeholderTextColor="#9ca3af"
                />
                <TouchableOpacity style={styles.addButton} onPress={() => setShowAddForm(!showAddForm)}>
                    <Text style={styles.addButtonText}>{showAddForm ? '✕' : '+'}</Text>
                </TouchableOpacity>
            </View>

            {showAddForm && (
                <View style={styles.addForm}>
                    <Text style={styles.addFormTitle}>{copy.newProduct}</Text>

                    <TextInput placeholder={copy.productName} value={newName} onChangeText={setNewName} style={styles.input} placeholderTextColor="#9ca3af" />

                    <Text style={styles.fieldLabel}>{copy.productType}</Text>
                    <View style={styles.pillRow}>
                        {PRODUCT_TYPES.map(t => (
                            <TouchableOpacity key={t} style={[styles.pill, newType === t && styles.pillActive]} onPress={() => handleNewTypeChange(t)}>
                                <Text style={[styles.pillText, newType === t && styles.pillTextActive]}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.fieldLabel}>{copy.color}</Text>
                    <View style={styles.pillRow}>
                        {availableColors.map(c => (
                            <TouchableOpacity key={c} style={[styles.pill, newColor === c && styles.pillActive]} onPress={() => setNewColor(c)}>
                                <Text style={[styles.pillText, newColor === c && styles.pillTextActive]}>{getColorLabel(c)}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.row}>
                        <TextInput placeholder={copy.price} value={newPrice} onChangeText={setNewPrice} keyboardType="numeric" style={[styles.input, styles.halfInput]} placeholderTextColor="#9ca3af" />
                        <TextInput placeholder={copy.cost} value={newCost} onChangeText={setNewCost} keyboardType="numeric" style={[styles.input, styles.halfInput]} placeholderTextColor="#9ca3af" />
                    </View>
                    <TouchableOpacity style={[styles.submitBtn, inserting && styles.disabledBtn]} onPress={handleAddProduct} disabled={inserting}>
                        {inserting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{copy.addProduct}</Text>}
                    </TouchableOpacity>
                </View>
            )}

            {loading ? (
                <ActivityIndicator style={styles.loader} size="large" color="#4f46e5" />
            ) : (
                <FlatList
                    data={filteredProducts}
                    keyExtractor={item => String(item.id)}
                    renderItem={renderProduct}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={<Text style={styles.emptyText}>{search ? copy.noMatching : copy.noProducts}</Text>}
                />
            )}

            {/* Edit Modal */}
            <Modal visible={!!editProduct} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <ScrollView keyboardShouldPersistTaps="handled">
                            <Text style={styles.modalTitle}>{copy.editProduct}</Text>
                            <Text style={styles.modalSubtitle}>{editProduct?.name}</Text>

                            <Text style={styles.fieldLabel}>{copy.productType}</Text>
                            <View style={styles.pillRow}>
                                {PRODUCT_TYPES.map(t => (
                                    <TouchableOpacity key={t} style={[styles.pill, editType === t && styles.pillActive]} onPress={() => handleEditTypeChange(t)}>
                                        <Text style={[styles.pillText, editType === t && styles.pillTextActive]}>{t}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.fieldLabel}>{copy.color}</Text>
                            <View style={styles.pillRow}>
                                {editAvailableColors.map(c => (
                                    <TouchableOpacity key={c} style={[styles.pill, editColor === c && styles.pillActive]} onPress={() => setEditColor(c)}>
                                        <Text style={[styles.pillText, editColor === c && styles.pillTextActive]}>{getColorLabel(c)}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.fieldLabel}>{copy.salePrice}</Text>
                            <TextInput value={editPrice} onChangeText={setEditPrice} keyboardType="numeric" style={styles.input} />
                            <Text style={styles.fieldLabel}>{copy.cost.toUpperCase()}</Text>
                            <TextInput value={editCost} onChangeText={setEditCost} keyboardType="numeric" style={styles.input} />

                            <TouchableOpacity style={[styles.submitBtn, saving && styles.disabledBtn]} onPress={handleSaveEdit} disabled={saving}>
                                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{copy.saveChanges}</Text>}
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditProduct(null)}>
                                <Text style={styles.cancelBtnText}>{copy.cancel}</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Production / Adjustment Modal */}
            <Modal visible={!!actionProduct} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>
                            {actionType === 'production' ? copy.recordProduction : copy.adjustStock}
                        </Text>
                        <Text style={styles.modalSubtitle}>{actionProduct?.name}</Text>
                        <Text style={styles.modalHint}>
                            {actionType === 'production'
                                ? (isBagProduct(actionProduct) ? copy.bagProductionHint : copy.productionHint)
                                : (isBagProduct(actionProduct) ? copy.bagAdjustmentHint : copy.adjustmentHint)}
                        </Text>

                        <View style={styles.sizeInputRow}>
                            {isBagProduct(actionProduct) ? (
                                <View style={[styles.sizeInputGroup, styles.bagInputGroup]}>
                                    <Text style={styles.sizeInputLabel}>{copy.stock}</Text>
                                    <Text style={styles.sizeInputCurrent}>
                                        {actionProduct ? getTotalStock(actionProduct) : 0}
                                    </Text>
                                    <TextInput
                                        value={actionInputs[BAG_STOCK_KEY] || ''}
                                        onChangeText={val => setActionInputs(prev => ({ ...prev, [BAG_STOCK_KEY]: val }))}
                                        keyboardType="numeric"
                                        placeholder="0"
                                        style={styles.sizeInput}
                                        placeholderTextColor="#9ca3af"
                                    />
                                </View>
                            ) : (
                                SIZES.map(sz => (
                                    <View key={sz} style={styles.sizeInputGroup}>
                                        <Text style={styles.sizeInputLabel}>{sz}</Text>
                                        <Text style={styles.sizeInputCurrent}>
                                            {actionProduct ? getStockQty(actionProduct, sz) : 0}
                                        </Text>
                                        <TextInput
                                            value={actionInputs[sz] || ''}
                                            onChangeText={val => setActionInputs(prev => ({ ...prev, [sz]: val }))}
                                            keyboardType="numeric"
                                            placeholder="0"
                                            style={styles.sizeInput}
                                            placeholderTextColor="#9ca3af"
                                        />
                                    </View>
                                ))
                            )}
                        </View>

                        <TouchableOpacity style={[styles.submitBtn, actionSaving && styles.disabledBtn]} onPress={handleSaveAction} disabled={actionSaving}>
                            {actionSaving ? <ActivityIndicator color="#fff" /> : (
                                <Text style={styles.submitBtnText}>
                                    {actionType === 'production' ? copy.saveProduction : copy.saveAdjustment}
                                </Text>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => { setActionProduct(null); setActionInputs({}); }}>
                            <Text style={styles.cancelBtnText}>{copy.cancel}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

function makeStyles(colors: ReturnType<typeof useAppSettings>['colors'], themeMode: 'light' | 'dark') {
return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    topRow: { flexDirection: 'row', padding: 16, paddingBottom: 8, gap: 10 },
    searchInput: { flex: 1, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 10, padding: 12, fontSize: 14, color: colors.text },
    addButton: { width: 46, height: 46, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    addButtonText: { color: '#fff', fontSize: 22, fontWeight: '600' },
    addForm: { marginHorizontal: 16, marginBottom: 12, backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border },
    addFormTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: colors.text },
    fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.subtext, letterSpacing: 0.6, marginBottom: 6, marginTop: 8 },
    pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
    pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border },
    pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    pillText: { fontSize: 13, fontWeight: '600', color: colors.subtext },
    pillTextActive: { color: '#fff' },
    input: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted, borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 10, color: colors.text },
    row: { flexDirection: 'row', gap: 10 },
    halfInput: { flex: 1 },
    submitBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 4 },
    disabledBtn: { opacity: 0.6 },
    submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },
    card: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, marginHorizontal: 16, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
    cardHeaderLeft: { flex: 1 },
    productName: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
    typeBadge: { backgroundColor: themeMode === 'dark' ? '#252b4a' : '#eef2ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    typeBadgeText: { fontSize: 12, fontWeight: '700', color: colors.primary },
    colorText: { fontSize: 12, color: colors.subtext, fontWeight: '500' },
    priceText: { fontSize: 12, fontWeight: '700', color: colors.text },
    costText: { fontSize: 12, color: colors.subtext },
    editBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: themeMode === 'dark' ? '#252b4a' : '#eef2ff' },
    editBtnText: { fontSize: 13, fontWeight: '600', color: colors.primary },
    stockRow: { flexDirection: 'row', gap: 4, marginBottom: 10 },
    stockCell: { flex: 1, alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: 6, paddingVertical: 8 },
    stockCellTotal: { backgroundColor: themeMode === 'dark' ? '#252b4a' : '#eef2ff' },
    bagStockCell: { alignItems: 'flex-start', paddingHorizontal: 14, borderRadius: 10, backgroundColor: themeMode === 'dark' ? '#252b4a' : '#eef2ff' },
    stockLabel: { fontSize: 12, fontWeight: '600', color: colors.subtext, marginBottom: 2 },
    stockValue: { fontSize: 16, fontWeight: '700', color: colors.text },
    stockValueTotal: { color: colors.primary },
    actionRow: { flexDirection: 'row', gap: 8 },
    productionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: themeMode === 'dark' ? '#183025' : '#f0fdf4', borderWidth: 1, borderColor: themeMode === 'dark' ? '#2e6b4d' : '#bbf7d0', alignItems: 'center' },
    productionBtnText: { fontSize: 13, fontWeight: '600', color: colors.success },
    adjustBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: themeMode === 'dark' ? '#322818' : '#fef3c7', borderWidth: 1, borderColor: themeMode === 'dark' ? '#6f4e26' : '#fde68a', alignItems: 'center' },
    adjustBtnText: { fontSize: 13, fontWeight: '600', color: colors.warning },
    listContent: { paddingTop: 4, paddingBottom: 40 },
    emptyText: { textAlign: 'center', color: colors.subtext, marginTop: 40, fontSize: 14 },
    loader: { marginTop: 40 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40, maxHeight: '90%' },
    modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 4, color: colors.text },
    modalSubtitle: { fontSize: 14, color: colors.subtext, marginBottom: 16 },
    modalHint: { fontSize: 12, color: colors.subtext, marginBottom: 16 },
    sizeInputRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
    sizeInputGroup: { flex: 1, alignItems: 'center' },
    bagInputGroup: { alignItems: 'stretch' },
    sizeInputLabel: { fontSize: 12, fontWeight: '600', color: colors.subtext, marginBottom: 2 },
    sizeInputCurrent: { fontSize: 12, color: colors.subtext, marginBottom: 4 },
    sizeInput: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted, borderRadius: 8, padding: 8, fontSize: 14, textAlign: 'center', width: '100%', color: colors.text },
    cancelBtn: { marginTop: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: 10 },
    cancelBtnText: { fontSize: 16, fontWeight: '600', color: colors.text },
});
}
