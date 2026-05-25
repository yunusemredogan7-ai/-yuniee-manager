import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    ScrollView,
    Modal,
} from 'react-native';
import { supabase } from '../src/core/supabase/client';
import { ordersService } from '../src/services/ordersService';
import { productsService } from '../src/services/productsService';
import { customersService } from '../src/services/customersService';
import { useAppSettings } from '../src/core/settings/AppSettingsContext';

type Product = {
    id: number;
    name: string;
    price: number;
    cost: number;
    product_type?: string | null;
};

type Customer = {
    id: number;
    name: string;
    phone: string;
    address: string;
};

type CartItem = {
    key: string;
    product: Product;
    size: string;
    quantity: number;
};

const SIZES = ['XS', 'S', 'M', 'L', 'XL'] as const;
type Size = (typeof SIZES)[number];

const SOURCES = ['Instagram', 'Trendyol', 'Website', 'Friends'] as const;
const STATUSES = ['Preparing', 'Ready', 'Shipped', 'Delivered', 'Cancelled'] as const;

export default function Orders() {
    const { colors, language, themeMode } = useAppSettings();
    const styles = React.useMemo(() => makeStyles(colors, themeMode), [colors, themeMode]);
    const copy = language === 'tr' ? {
        newOrder: 'Yeni Sipariş',
        customer: 'MÜŞTERİ',
        customerName: 'Müşteri adı',
        phone: 'Telefon',
        address: 'Adres',
        addItem: 'ÜRÜN EKLE',
        chooseProduct: 'Ürün seç',
        searchProducts: 'Ürün ara',
        noMatchingProducts: 'Eşleşen ürün yok.',
        size: 'Beden',
        quantity: 'Adet',
        addItemButton: 'Ürün ekle',
        orderItems: 'SİPARİŞ ÜRÜNLERİ',
        line: 'satır',
        lines: 'satır',
        each: 'adet',
        options: 'SEÇENEKLER',
        source: 'Kaynak',
        noteOptional: 'Not (opsiyonel)',
        notePlaceholder: 'Örn. Hediye paketi, hızlı teslimat...',
        subtotal: 'Ürün toplamı',
        item: 'ürün',
        items: 'ürün',
        packagingHint: 'Paketleme maliyeti sipariş kaydedildiğinde hesaplanır ve sipariş kartında gösterilir.',
        addToContinue: 'Devam etmek için ürün ekle',
        createOrder: 'Sipariş oluştur',
        recentOrders: 'Son Siparişler',
        noOrders: 'Henüz sipariş yok',
        createFirst: 'İlk siparişini yukarıdan oluştur.',
        noItems: 'Ürün yok',
        packaging: 'paketleme',
        updateStatus: 'Sipariş Durumunu Güncelle',
        cancel: 'İptal',
        current: 'Mevcut',
        checksStock: 'stok kontrol eder',
        statusLabels: {
            Preparing: 'Hazırlanıyor',
            Ready: 'Hazır',
            Shipped: 'Kargoda',
            Delivered: 'Teslim Edildi',
            Cancelled: 'İptal Edildi',
        },
        change: 'Değiştir',
        warning: 'Uyarı',
        error: 'Hata',
        success: 'Başarılı',
        selectProduct: 'Lütfen bir ürün seç.',
        qtyAtLeast: 'Adet en az 1 olmalı.',
        customerRequired: 'Müşteri adı gerekli.',
        addAtLeastOne: 'Siparişe en az bir ürün ekleyin.',
        createFailed: 'Sipariş oluşturulamadı.',
        created: 'Sipariş oluşturuldu',
        somethingWrong: 'Bir şeyler ters gitti.',
        verifyStockFailed: 'Stok uygunluğu kontrol edilemedi.',
        cannotDeliver: 'Teslim edilemez',
        insufficientStock: 'Yetersiz stok.',
        available: 'mevcut',
        need: 'gerekli',
        deliveryFailed: 'Teslimat Başarısız',
        updateFailed: 'Durum güncellenemedi.',
    } : {
        newOrder: 'New Order',
        customer: 'CUSTOMER',
        customerName: 'Customer Name',
        phone: 'Phone',
        address: 'Address',
        addItem: 'ADD ITEM',
        chooseProduct: 'Choose a product',
        searchProducts: 'Search products',
        noMatchingProducts: 'No matching products.',
        size: 'Size',
        quantity: 'Quantity',
        addItemButton: 'Add item',
        orderItems: 'ORDER ITEMS',
        line: 'line',
        lines: 'lines',
        each: 'each',
        options: 'OPTIONS',
        source: 'Source',
        noteOptional: 'Note (optional)',
        notePlaceholder: 'e.g. Gift wrap, fast delivery...',
        subtotal: 'Items subtotal',
        item: 'item',
        items: 'items',
        packagingHint: 'Packaging is calculated when the order is saved and shown on the order card.',
        addToContinue: 'Add an item to continue',
        createOrder: 'Create order',
        recentOrders: 'Recent Orders',
        noOrders: 'No orders yet',
        createFirst: 'Create your first order above.',
        noItems: 'No items',
        packaging: 'packaging',
        updateStatus: 'Update Order Status',
        cancel: 'Cancel',
        current: 'Current',
        checksStock: 'checks stock',
        statusLabels: {
            Preparing: 'Preparing',
            Ready: 'Ready',
            Shipped: 'Shipped',
            Delivered: 'Delivered',
            Cancelled: 'Cancelled',
        },
        change: 'Change',
        warning: 'Warning',
        error: 'Error',
        success: 'Success',
        selectProduct: 'Please select a product.',
        qtyAtLeast: 'Quantity must be at least 1.',
        customerRequired: 'Customer name is required.',
        addAtLeastOne: 'Please add at least one item to the order.',
        createFailed: 'Could not create order.',
        created: 'Order created',
        somethingWrong: 'Something went wrong.',
        verifyStockFailed: 'Could not verify stock availability.',
        cannotDeliver: 'Cannot deliver',
        insufficientStock: 'Insufficient stock.',
        available: 'available',
        need: 'need',
        deliveryFailed: 'Delivery Failed',
        updateFailed: 'Could not update status.',
    };
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // Customer fields
    const [customerName, setCustomerName] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [note, setNote] = useState('');
    const [source, setSource] = useState<string>('Instagram');

    // Item builder fields
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [productSearch, setProductSearch] = useState('');
    const [selectedSize, setSelectedSize] = useState<Size | ''>('M');
    const [qty, setQty] = useState('1');
    const [showProductDropdown, setShowProductDropdown] = useState(false);

    // Cart
    const [cart, setCart] = useState<CartItem[]>([]);

    // Orders list
    const [orders, setOrders] = useState<any[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(true);

    // Status Modal
    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const [statusOrderSelected, setStatusOrderSelected] = useState<any>(null);

    // --- Data fetching ---

    const fetchProducts = useCallback(async () => {
        try {
            setLoadingProducts(true);
            const { data, error } = await productsService.getProducts();
            if (error) return;
            setProducts((data as unknown) as Product[]);
        } catch { /* silent */ } finally { setLoadingProducts(false); }
    }, []);

    const fetchOrders = useCallback(async () => {
        try {
            setLoadingOrders(true);
            const { data, error } = await ordersService.getOrders(30);
            if (error) return;
            const mapped = data?.map(o => {
                const orderItems = Array.isArray(o.order_items) ? o.order_items : [];
                const itemStrings = orderItems.map((item: Record<string, unknown>) => {
                    const prodData = item.products as Record<string, unknown> | null;
                    const productName = prodData ? String(prodData.name || 'Unknown') : 'Unknown';
                    const size = String(item.size || '');
                    const itemQty = Number(item.quantity || 0);
                    return size ? `${productName} — ${size} × ${itemQty}` : `${productName} × ${itemQty}`;
                });
                return {
                    id: o.id,
                    customer_name: o.customer_name,
                    items: itemStrings.length > 0 ? itemStrings : [copy.noItems],
                    status: o.status,
                    source: o.source || null,
                    note: o.note || null,
                    packaging_cost: Number(o.packaging_cost) || 0,
                    total_price: Number(o.total_price) || 0,
                    created_at: o.created_at as string,
                };
            }) || [];
            setOrders(mapped);
        } catch { /* silent */ } finally { setLoadingOrders(false); }
    }, [copy.noItems]);

    const fetchCustomers = useCallback(async () => {
        try {
            const { data, error } = await customersService.getCustomers();
            if (error) return;
            setCustomers((data as unknown) as Customer[]);
        } catch { /* silent */ }
    }, []);

    useFocusEffect(useCallback(() => {
        fetchOrders(); fetchProducts(); fetchCustomers();
    }, [fetchOrders, fetchProducts, fetchCustomers]));

    useEffect(() => {
        fetchProducts(); fetchOrders(); fetchCustomers();
        const ch1 = supabase.channel('orders-rt')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
            .subscribe();
        const ch2 = supabase.channel('products-rt-orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchProducts())
            .subscribe();
        return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
    }, [fetchProducts, fetchOrders, fetchCustomers]);

    // --- Computed ---

    const filteredCustomers = useMemo(() => {
        const q = customerName.trim().toLowerCase();
        if (!q || selectedCustomer?.name === customerName) return [];
        return customers.filter(c => c.name.toLowerCase().includes(q));
    }, [customers, customerName, selectedCustomer]);

    const filteredProducts = useMemo(() => {
        const q = productSearch.trim().toLowerCase();
        if (!q) return products;
        return products.filter(p => p.name.toLowerCase().includes(q));
    }, [products, productSearch]);

    const cartTotal = useMemo(() =>
        cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    , [cart]);

    const cartItemCount = useMemo(() =>
        cart.reduce((sum, item) => sum + item.quantity, 0)
    , [cart]);

    function isBagProduct(product: Product | null) {
        if (!product) return false;
        const type = String(product.product_type || '').trim().toLowerCase();
        return type === 'bag' || product.name.trim().toLowerCase().includes('bag');
    }

    const selectedProductIsBag = isBagProduct(selectedProduct);

    // --- Cart actions ---

    function handleAddToCart() {
        if (!selectedProduct) {
            Alert.alert(copy.warning, copy.selectProduct);
            return;
        }
        const quantity = parseInt(qty, 10) || 0;
        if (quantity <= 0) {
            Alert.alert(copy.warning, copy.qtyAtLeast);
            return;
        }

        const itemSize = isBagProduct(selectedProduct) ? '' : selectedSize;
        const newItem: CartItem = {
            key: `${selectedProduct.id}-${itemSize || 'no-size'}-${Date.now()}`,
            product: selectedProduct,
            size: itemSize,
            quantity,
        };

        setCart(prev => [...prev, newItem]);
        // Reset item builder for next add
        setSelectedProduct(null);
        setSelectedSize('M');
        setQty('1');
    }

    function handleRemoveFromCart(key: string) {
        setCart(prev => prev.filter(item => item.key !== key));
    }

    function selectProduct(product: Product) {
        setSelectedProduct(product);
        setProductSearch('');
        setShowProductDropdown(false);
        setSelectedSize(isBagProduct(product) ? '' : 'M');
    }

    function selectCustomer(customer: Customer) {
        setSelectedCustomer(customer);
        setCustomerName(customer.name);
        setPhone(customer.phone);
        setAddress(customer.address);
    }

    function resetForm() {
        setSelectedProduct(null);
        setProductSearch('');
        setSelectedSize('M');
        setQty('1');
        setSource('Instagram');
        setCustomerName('');
        setSelectedCustomer(null);
        setPhone('');
        setAddress('');
        setNote('');
        setCart([]);
    }

    // --- Create order ---

    async function handleCreateOrder() {
        if (!customerName.trim()) {
            Alert.alert(copy.warning, copy.customerRequired);
            return;
        }
        if (cart.length === 0) {
            Alert.alert(copy.warning, copy.addAtLeastOne);
            return;
        }

        try {
            setSubmitting(true);

            // Save customer if new
            const existing = customers.find(c => c.name.toLowerCase() === customerName.trim().toLowerCase());
            if (!existing) {
                const { error: custErr } = await customersService.createCustomer({
                    name: customerName.trim(),
                    phone: phone.trim(),
                    address: address.trim(),
                });
                if (!custErr) fetchCustomers();
            }

            // Build items array
            const items = cart.map(ci => ({
                product_id: ci.product.id,
                size: ci.size,
                quantity: ci.quantity,
                price: ci.product.price,
            }));

            const { error: insertError } = await ordersService.createOrder(
                customerName.trim(),
                items,
                cartTotal,
                note.trim(),
                source
            );

            if (insertError) {
                Alert.alert(copy.error, copy.createFailed);
                return;
            }

            Alert.alert(copy.success, `${copy.created} · ${cart.length} ${cart.length === 1 ? copy.item : copy.items}.`);
            resetForm();
        } catch {
            Alert.alert(copy.error, copy.somethingWrong);
        } finally {
            setSubmitting(false);
        }
    }

    // --- Status update ---

    async function handleStatusUpdate(order: any, newStatus: string) {
        try {
            if (newStatus === 'Delivered') {
                const { items, error: stockErr } = await ordersService.getOrderWithStock(order.id);
                if (stockErr || !items) {
                    Alert.alert(copy.error, copy.verifyStockFailed);
                    return;
                }
                const insufficient = items.filter(item => item.available_stock < item.quantity);
                if (insufficient.length > 0) {
                    const details = insufficient.map(i => `${i.product_name}${i.size ? ` ${i.size}` : ''}: ${i.available_stock} ${copy.available}, ${copy.need} ${i.quantity}`).join('\n');
                    Alert.alert(copy.cannotDeliver, `${copy.insufficientStock}\n\n${details}`);
                    return;
                }
                const { error, success } = await ordersService.deliverOrder(order.id);
                if (error || !success) {
                    const msg = error && typeof error === 'object' && 'message' in error ? String((error as any).message) : 'Could not deliver order.';
                    Alert.alert(copy.deliveryFailed, msg);
                    return;
                }
            } else {
                const { error, success } = await ordersService.updateOrderStatus(order.id, newStatus as any);
                if (error || !success) {
                    Alert.alert(copy.error, copy.updateFailed);
                    return;
                }
            }
            fetchOrders();
        } catch {
            Alert.alert(copy.error, copy.somethingWrong);
        } finally {
            setStatusModalVisible(false);
            setStatusOrderSelected(null);
        }
    }

    function getStatusBadgeStyle(status: string) {
        switch (status) {
            case 'Preparing': return { backgroundColor: '#FEF3C7' };
            case 'Ready': return { backgroundColor: '#E0E7FF' };
            case 'Shipped': return { backgroundColor: '#DBEAFE' };
            case 'Delivered': return { backgroundColor: '#D1FAE5' };
            case 'Cancelled': return { backgroundColor: '#FEE2E2' };
            default: return { backgroundColor: '#F3F4F6' };
        }
    }

    function getStatusTextStyle(status: string) {
        switch (status) {
            case 'Preparing': return { color: '#92400E' };
            case 'Ready': return { color: '#3730A3' };
            case 'Shipped': return { color: '#1E40AF' };
            case 'Delivered': return { color: '#065F46' };
            case 'Cancelled': return { color: '#991B1B' };
            default: return { color: '#555' };
        }
    }

    function getStatusLabel(status: string) {
        const normalized = STATUSES.find(s => s.toLowerCase() === String(status).toLowerCase());
        return normalized ? copy.statusLabels[normalized] : status;
    }

    return (
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>{copy.newOrder}</Text>

            {/* ═══ SECTION 1: Customer ═══ */}
            <View style={styles.section}>
                <Text style={styles.sectionLabel}>{copy.customer}</Text>
                <TextInput
                    placeholder={copy.customerName}
                    value={customerName}
                    onChangeText={text => {
                        setCustomerName(text);
                        if (selectedCustomer && text !== selectedCustomer.name) setSelectedCustomer(null);
                    }}
                    style={styles.input}
                    placeholderTextColor="#9ca3af"
                />
                {!selectedCustomer && customerName.trim().length > 0 && filteredCustomers.length > 0 && (
                    <View style={styles.dropdown}>
                        {filteredCustomers.map(c => (
                            <TouchableOpacity key={c.id} style={styles.dropdownItem} onPress={() => selectCustomer(c)}>
                                <Text style={styles.dropdownText}>{c.name}</Text>
                                {c.phone ? <Text style={styles.dropdownSub}>{c.phone}</Text> : null}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
                <View style={styles.row}>
                    <TextInput placeholder={copy.phone} value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={[styles.input, styles.halfInput]} placeholderTextColor="#9ca3af" />
                    <TextInput placeholder={copy.address} value={address} onChangeText={setAddress} style={[styles.input, styles.halfInput]} placeholderTextColor="#9ca3af" />
                </View>
            </View>

            {/* ═══ SECTION 2: Add Item ═══ */}
            <View style={styles.section}>
                <Text style={styles.sectionLabel}>{copy.addItem}</Text>

                <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setShowProductDropdown(!showProductDropdown)}>
                    <Text style={selectedProduct ? styles.triggerTextSelected : styles.triggerTextPlaceholder}>
                        {selectedProduct ? `${selectedProduct.name}  ·  ${selectedProduct.price}₺` : copy.chooseProduct}
                    </Text>
                </TouchableOpacity>

                {showProductDropdown && (
                    <View style={styles.dropdown}>
                        <TextInput
                            placeholder={copy.searchProducts}
                            value={productSearch}
                            onChangeText={setProductSearch}
                            style={styles.dropdownSearch}
                            placeholderTextColor="#9ca3af"
                        />
                        {loadingProducts ? <ActivityIndicator style={styles.loaderSmall} /> :
                        filteredProducts.length === 0 ? <Text style={styles.dropdownEmpty}>{copy.noMatchingProducts}</Text> :
                        filteredProducts.map(p => (
                            <TouchableOpacity key={p.id} style={styles.dropdownItem} onPress={() => selectProduct(p)}>
                                <Text style={styles.dropdownText}>{p.name}</Text>
                                <Text style={styles.dropdownPrice}>{p.price}₺</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <View style={styles.itemControls}>
                    {!selectedProductIsBag && (
                        <>
                            <Text style={styles.inlineLabel}>{copy.size}</Text>
                            <View style={styles.sizeGroup}>
                                {SIZES.map(sz => (
                                    <TouchableOpacity
                                        key={sz}
                                        style={[styles.sizeBtn, selectedSize === sz && styles.sizeBtnActive]}
                                        onPress={() => setSelectedSize(sz)}
                                    >
                                        <Text style={[styles.sizeBtnText, selectedSize === sz && styles.sizeBtnTextActive]}>{sz}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    )}
                    <View style={styles.qtyAddRow}>
                        <View>
                            <Text style={styles.inlineLabel}>{copy.quantity}</Text>
                            <View style={styles.qtyGroup}>
                                <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(String(Math.max(1, (parseInt(qty, 10) || 1) - 1)))}>
                                    <Text style={styles.qtyBtnText}>−</Text>
                                </TouchableOpacity>
                                <TextInput value={qty} onChangeText={setQty} keyboardType="numeric" style={styles.qtyInput} />
                                <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(String((parseInt(qty, 10) || 0) + 1))}>
                                    <Text style={styles.qtyBtnText}>+</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.addItemBtn} onPress={handleAddToCart}>
                            <Text style={styles.addItemBtnText}>{copy.addItemButton}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* ═══ SECTION 3: Cart ═══ */}
            {cart.length > 0 && (
                <View style={styles.cartSection}>
                    <View style={styles.cartHeader}>
                        <Text style={styles.sectionLabel}>{copy.orderItems}</Text>
                        <Text style={styles.cartCount}>{cart.length} {cart.length === 1 ? copy.line : copy.lines}</Text>
                    </View>
                    {cart.map((ci, idx) => (
                        <View key={ci.key} style={styles.cartItem}>
                            <View style={styles.cartItemNum}>
                                <Text style={styles.cartItemNumText}>{idx + 1}</Text>
                            </View>
                            <View style={styles.cartItemLeft}>
                                <Text style={styles.cartItemName}>{ci.product.name}</Text>
                                <Text style={styles.cartItemMeta}>
                                    {ci.size ? `${copy.size} ${ci.size} · ` : ''}{copy.quantity} {ci.quantity} · {ci.product.price}₺ {copy.each}
                                </Text>
                            </View>
                            <Text style={styles.cartItemPrice}>{(ci.product.price * ci.quantity).toLocaleString()}₺</Text>
                            <TouchableOpacity style={styles.cartRemoveBtn} onPress={() => handleRemoveFromCart(ci.key)}>
                                <Text style={styles.cartRemoveText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}

            {/* ═══ SECTION 4: Options ═══ */}
            <View style={styles.section}>
                <Text style={styles.sectionLabel}>{copy.options}</Text>
                <Text style={styles.inlineLabel}>{copy.source}</Text>
                <View style={styles.sourceRow}>
                    {SOURCES.map(s => (
                        <TouchableOpacity
                            key={s}
                            style={[styles.sourceBtn, source === s && styles.sourceBtnActive]}
                            onPress={() => setSource(s)}
                        >
                            <Text style={[styles.sourceBtnText, source === s && styles.sourceBtnTextActive]}>{s}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <Text style={[styles.inlineLabel, styles.noteLabelSpacing]}>{copy.noteOptional}</Text>
                <TextInput
                    placeholder={copy.notePlaceholder}
                    value={note}
                    onChangeText={setNote}
                    style={[styles.input, styles.textArea]}
                    multiline
                    placeholderTextColor="#9ca3af"
                />
            </View>

            {/* ═══ Totals + Submit ═══ */}
            {cart.length > 0 && (
                <View style={styles.totalsCard}>
                    <View style={styles.totalsRow}>
                        <Text style={styles.totalsLabel}>{copy.subtotal} · {cartItemCount} {cartItemCount === 1 ? copy.item : copy.items}</Text>
                        <Text style={styles.totalsValue}>{cartTotal.toLocaleString()}₺</Text>
                    </View>
                    <Text style={styles.totalsHint}>{copy.packagingHint}</Text>
                </View>
            )}

            <TouchableOpacity
                style={[styles.submitBtn, (submitting || cart.length === 0) && styles.submitBtnDisabled]}
                onPress={handleCreateOrder}
                disabled={submitting || cart.length === 0}
            >
                {submitting ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.submitBtnText}>
                        {cart.length === 0 ? copy.addToContinue : `${copy.createOrder} · ${cartTotal.toLocaleString()}₺`}
                    </Text>
                )}
            </TouchableOpacity>

            {/* ═══ Recent Orders ═══ */}
            <Text style={styles.recentTitle}>{copy.recentOrders}</Text>

            {loadingOrders ? (
                <ActivityIndicator style={styles.loaderSmall} />
            ) : orders.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>📦</Text>
                    <Text style={styles.emptyTitle}>{copy.noOrders}</Text>
                    <Text style={styles.emptyDesc}>{copy.createFirst}</Text>
                </View>
            ) : (
                orders.map(order => {
                    const cust = customers.find(c => c.name === order.customer_name);
                    const custPhone = cust?.phone || '';
                    const dateStr = order.created_at
                        ? new Date(order.created_at).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        }) : '';

                    return (
                        <View key={order.id} style={styles.orderCard}>
                            {/* Header */}
                            <View style={styles.orderHeader}>
                                <View style={styles.orderHeaderLeft}>
                                    <Text style={styles.orderCustomer}>{order.customer_name}</Text>
                                    <View style={styles.orderSubline}>
                                        {custPhone ? <Text style={styles.orderPhone}>{custPhone}</Text> : null}
                                        {order.source ? <Text style={styles.orderSource}>{order.source}</Text> : null}
                                    </View>
                                </View>
                                <TouchableOpacity
                                    onPress={() => { setStatusOrderSelected(order); setStatusModalVisible(true); }}
                                    style={[styles.statusBadge, getStatusBadgeStyle(order.status)]}
                                >
                                    <Text style={[styles.statusText, getStatusTextStyle(order.status)]}>
                                        {getStatusLabel(order.status)} · {copy.change}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Items */}
                            <View style={styles.orderItems}>
                                {order.items.map((item: string, idx: number) => (
                                    <Text key={idx} style={styles.orderItemText}>• {item}</Text>
                                ))}
                            </View>

                            {/* Note */}
                            {order.note ? (
                                <View style={styles.orderNote}>
                                    <Text style={styles.orderNoteText}>{order.note}</Text>
                                </View>
                            ) : null}

                            {/* Footer */}
                            <View style={styles.orderFooter}>
                                <View style={styles.orderMeta}>
                                    <Text style={styles.orderId}>#{order.id}</Text>
                                    <Text style={styles.orderDate}>{dateStr}</Text>
                                </View>
                                <View style={styles.orderPricing}>
                                    {order.packaging_cost > 0 ? (
                                        <Text style={styles.pkgCost}>+{order.packaging_cost}₺ {copy.packaging}</Text>
                                    ) : null}
                                    <Text style={styles.orderTotal}>{order.total_price.toLocaleString()}₺</Text>
                                </View>
                            </View>
                        </View>
                    );
                })
            )}

            {/* Status Modal */}
            <Modal visible={statusModalVisible && !!statusOrderSelected} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>{copy.updateStatus}</Text>
                        <Text style={styles.modalSubtitle}>
                            Order #{statusOrderSelected?.id} — {statusOrderSelected?.customer_name}
                        </Text>
                        {STATUSES.map(ns => {
                            const isCurrent = ns === statusOrderSelected?.status;
                            const isDelivered = ns === 'Delivered';
                            return (
                                <TouchableOpacity
                                    key={ns}
                                    style={[
                                        styles.modalOption,
                                        isCurrent && styles.modalOptionActive,
                                        isDelivered && styles.modalOptionDelivered,
                                    ]}
                                    onPress={() => handleStatusUpdate(statusOrderSelected, ns)}
                                >
                                    <Text style={[styles.modalOptionText, isCurrent && styles.modalOptionTextActive]}>
                                        {getStatusLabel(ns)} {isCurrent && `(${copy.current})`} {isDelivered && !isCurrent ? `· ${copy.checksStock}` : ''}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                        <TouchableOpacity style={styles.modalCancel} onPress={() => { setStatusModalVisible(false); setStatusOrderSelected(null); }}>
                            <Text style={styles.modalCancelText}>{copy.cancel}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <View style={styles.bottomSpacer} />
        </ScrollView>
    );
}

function makeStyles(colors: ReturnType<typeof useAppSettings>['colors'], themeMode: 'light' | 'dark') {
return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scrollContent: { padding: 20 },
    title: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5, marginBottom: 16 },

    // ── Sections ──
    section: {
        backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 12,
        borderWidth: 1, borderColor: colors.border, borderLeftWidth: 3, borderLeftColor: themeMode === 'dark' ? '#34466b' : '#bfdbfe',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    },
    sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.subtext, letterSpacing: 1, marginBottom: 12 },
    inlineLabel: { fontSize: 12, fontWeight: '700', color: colors.subtext, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },

    // ── Inputs ──
    input: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted, borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 10, color: colors.text },
    halfInput: { flex: 1 },
    row: { flexDirection: 'row', gap: 10 },
    textArea: { minHeight: 56 },
    noteLabelSpacing: { marginTop: 10 },

    // ── Dropdowns ──
    dropdown: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, marginTop: -6, marginBottom: 8, maxHeight: 230, overflow: 'hidden' },
    dropdownSearch: { borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surfaceMuted, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.text },
    dropdownItem: { paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dropdownText: { fontSize: 15, color: colors.text },
    dropdownSub: { fontSize: 12, color: colors.subtext },
    dropdownPrice: { fontSize: 13, fontWeight: '700', color: colors.primary },
    dropdownEmpty: { padding: 14, color: colors.subtext, textAlign: 'center' },
    dropdownTrigger: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted, borderRadius: 8, padding: 14, marginBottom: 10 },
    triggerTextPlaceholder: { color: colors.subtext, fontSize: 15 },
    triggerTextSelected: { color: colors.text, fontSize: 15, fontWeight: '600' },

    // ── Item builder ──
    itemControls: { gap: 8, marginTop: 4 },
    sizeGroup: { flexDirection: 'row', gap: 6 },
    sizeBtn: { flex: 1, paddingVertical: 9, borderRadius: 6, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted, alignItems: 'center' },
    sizeBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    sizeBtnText: { fontSize: 12, fontWeight: '600', color: colors.subtext },
    sizeBtnTextActive: { color: '#fff' },
    qtyAddRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 4 },
    qtyGroup: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    qtyBtn: { width: 32, height: 32, borderRadius: 6, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    qtyBtnText: { fontSize: 16, fontWeight: '600', color: colors.text },
    qtyInput: { width: 36, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted, borderRadius: 6, padding: 6, fontSize: 14, textAlign: 'center', color: colors.text },
    addItemBtn: { flex: 1, backgroundColor: colors.success, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, alignItems: 'center', shadowColor: colors.success, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2 },
    addItemBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    // ── Source ──
    sourceRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
    sourceBtn: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted },
    sourceBtnActive: { backgroundColor: themeMode === 'dark' ? '#252b4a' : '#eef2ff', borderColor: colors.primary },
    sourceBtnText: { fontSize: 13, fontWeight: '600', color: colors.subtext },
    sourceBtnTextActive: { color: colors.primary },

    // ── Cart ──
    cartSection: {
        backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 12,
        borderWidth: 1, borderColor: colors.border, borderLeftWidth: 3, borderLeftColor: colors.primary,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    },
    cartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    cartCount: { fontSize: 12, fontWeight: '600', color: colors.primary, backgroundColor: themeMode === 'dark' ? '#252b4a' : '#eef2ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    cartItem: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.surfaceMuted, borderRadius: 10, padding: 10, marginBottom: 6,
        borderWidth: 1, borderColor: colors.border,
    },
    cartItemNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: themeMode === 'dark' ? '#252b4a' : '#eef2ff', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    cartItemNumText: { fontSize: 11, fontWeight: '700', color: colors.primary },
    cartItemLeft: { flex: 1 },
    cartItemName: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 1 },
    cartItemMeta: { fontSize: 11, color: colors.subtext },
    cartItemPrice: { fontSize: 14, fontWeight: '700', color: colors.text, marginRight: 8 },
    cartRemoveBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: themeMode === 'dark' ? '#352026' : '#fee2e2', alignItems: 'center', justifyContent: 'center' },
    cartRemoveText: { fontSize: 11, fontWeight: '700', color: colors.danger },

    // ── Totals ──
    totalsCard: { backgroundColor: themeMode === 'dark' ? '#202542' : '#f4f6ff', borderRadius: 10, padding: 14, marginBottom: 4, borderWidth: 1, borderColor: themeMode === 'dark' ? '#313a67' : '#e0e7ff' },
    totalsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
    totalsLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.primary },
    totalsValue: { fontSize: 20, fontWeight: '800', color: colors.primary, letterSpacing: -0.3 },
    totalsHint: { fontSize: 11, color: colors.subtext, marginTop: 6, lineHeight: 15 },

    // ── Submit ──
    submitBtn: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 8, shadowColor: colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.14, shadowRadius: 6, elevation: 3 },
    submitBtnDisabled: { opacity: 0.5 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

    // ── Recent Orders ──
    recentTitle: { fontSize: 18, fontWeight: '700', marginTop: 32, marginBottom: 12, color: colors.text },

    orderCard: {
        backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
        borderWidth: 1, borderColor: colors.border, borderLeftWidth: 3, borderLeftColor: themeMode === 'dark' ? '#34466b' : '#dbe8ff',
    },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    orderHeaderLeft: { flex: 1, marginRight: 12 },
    orderCustomer: { fontSize: 16, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
    orderSubline: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
    orderPhone: { fontSize: 12, color: colors.subtext },
    orderSource: { fontSize: 11, color: colors.primary, fontWeight: '600', backgroundColor: themeMode === 'dark' ? '#252b4a' : '#eef2ff', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, overflow: 'hidden' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    statusText: { fontSize: 12, fontWeight: '700' },

    orderItems: { marginBottom: 2 },
    orderItemText: { fontSize: 13, color: colors.text, lineHeight: 20 },

    orderNote: { backgroundColor: themeMode === 'dark' ? '#322818' : '#fffbeb', padding: 10, borderRadius: 8, marginTop: 8, borderLeftWidth: 3, borderLeftColor: colors.warning },
    orderNoteText: { fontSize: 13, color: colors.warning, lineHeight: 18 },

    orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
    orderMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    orderId: { fontSize: 12, color: colors.subtext, fontWeight: '600' },
    orderDate: { fontSize: 11, color: colors.subtext },
    orderPricing: { alignItems: 'flex-end' },
    pkgCost: { fontSize: 11, fontWeight: '600', color: colors.subtext, marginBottom: 1 },
    orderTotal: { fontSize: 17, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },

    // ── Empty ──
    emptyContainer: { alignItems: 'center', paddingTop: 40, paddingBottom: 20 },
    emptyIcon: { fontSize: 36, marginBottom: 8 },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
    emptyDesc: { fontSize: 13, color: colors.subtext },

    // ── Modal ──
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24, paddingBottom: 40 },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
    modalSubtitle: { fontSize: 14, color: colors.subtext, marginBottom: 20 },
    modalOption: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    modalOptionActive: { backgroundColor: colors.surfaceMuted },
    modalOptionDelivered: { backgroundColor: themeMode === 'dark' ? '#183025' : '#f0fdf4' },
    modalOptionText: { fontSize: 16, color: colors.text },
    modalOptionTextActive: { fontWeight: '700', color: colors.primary },
    modalCancel: { marginTop: 20, paddingVertical: 14, alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: 8 },
    modalCancelText: { fontSize: 16, fontWeight: '600', color: colors.text },

    // ── Misc ──
    loaderSmall: { padding: 12 },
    bottomSpacer: { height: 40 },
});
}
