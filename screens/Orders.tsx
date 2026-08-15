import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
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
    RefreshControl,
} from 'react-native';
import { supabase } from '../src/core/supabase/client';
import { ordersService } from '../src/services/ordersService';
import { customersService } from '../src/services/customersService';
import { todoService } from '../src/services/todoService';
import { useAppSettings } from '../src/core/settings/AppSettingsContext';
import { createVisualSystem } from '../src/core/theme/visualSystem';
import { ConfirmDialog, EmptyState, ErrorState, FilterChip, LoadingSkeleton, OrderFlowStepper, QuickActionButton, SearchInput, SectionHeader, StatusBadge, SyncStatus, WarningCard } from '../src/components/ui';
import { OVERLAY_SCRIM, SPACING, TOUCH, hitSlopFor } from '../src/core/theme/tokens';

type Product = {
    id: number;
    name: string;
    price: number;
    cost: number;
    product_type?: string | null;
    color?: string | null;
    stock?: { size: string; quantity: number }[];
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
    const scrollRef = useRef<ScrollView>(null);
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
        searchOrders: 'Müşteri, ürün veya kaynak ara',
        all: 'Tümü',
        today: 'Bugün',
        week: 'Bu hafta',
        needsAttention: 'Dikkat Gereken Siparişler',
        preparingWarning: 'Hazırlanan siparişler teslimata ilerletilmeyi bekliyor.',
        nextStatus: 'Sonraki durum',
        cancelOrder: 'Siparişi iptal et',
        confirmCancel: 'Bu sipariş iptal edilsin mi?',
        orderLabel: 'Sipariş',
        paymentNotTracked: 'Ödeme takip edilmiyor',
        flowLabels: {
            new: 'Yeni',
            production: 'Üretimde',
            ready: 'Paketlenecek',
            packed: 'Paketlendi',
            delivered: 'Teslim',
            cancelled: 'İptal',
        },
        readyToPack: 'Bu sipariş paketlemeye hazır',
        createPackingTask: 'Paketleme görevi oluştur',
        notifyIremLater: 'İrem için takip ekle',
        packingTaskCreated: 'Paketleme görevi oluşturuldu.',
        packingTaskFailed: 'Paketleme görevi oluşturulamadı.',
        availableStock: 'Mevcut stok',
        lowAfterOrder: 'Bu siparişten sonra stok düşük kalabilir.',
        negativeAfterOrder: 'Bu sipariş stoku negatife düşürebilir.',
        completeConfirm: 'Bu sipariş teslim edildi olarak işaretlenecek ve stok düşümü kontrol edilecek.',
        synced: 'Senkron',
        refreshing: 'Yenileniyor...',
        retry: 'Tekrar dene',
        ordersLoadFailed: 'Siparişler yüklenemedi.',
        ordersLoadHelp: 'Bağlantıyı kontrol edip tekrar deneyin.',
        updatingOrder: 'Güncelleniyor...',
        creatingTask: 'Görev oluşturuluyor...',
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
        searchOrders: 'Search customer, product, or channel',
        all: 'All',
        today: 'Today',
        week: 'This week',
        needsAttention: 'Orders Needing Attention',
        preparingWarning: 'Preparing orders are waiting to move forward.',
        nextStatus: 'Next status',
        cancelOrder: 'Cancel order',
        confirmCancel: 'Cancel this order?',
        orderLabel: 'Order',
        paymentNotTracked: 'Payment not tracked',
        flowLabels: {
            new: 'New',
            production: 'In production',
            ready: 'Ready to pack',
            packed: 'Packed',
            delivered: 'Delivered',
            cancelled: 'Cancelled',
        },
        readyToPack: 'This order is ready to pack',
        createPackingTask: 'Create packing task',
        notifyIremLater: 'Add Irem follow-up',
        packingTaskCreated: 'Packing task created.',
        packingTaskFailed: 'Could not create packing task.',
        availableStock: 'Available stock',
        lowAfterOrder: 'Stock may be low after this order.',
        negativeAfterOrder: 'This order may make stock negative.',
        completeConfirm: 'This order will be marked delivered and stock deduction will be checked.',
        synced: 'Synced',
        refreshing: 'Refreshing...',
        retry: 'Retry',
        ordersLoadFailed: 'Could not load orders.',
        ordersLoadHelp: 'Check the connection and try again.',
        updatingOrder: 'Updating...',
        creatingTask: 'Creating task...',
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
    const [refreshing, setRefreshing] = useState(false);
    const [ordersError, setOrdersError] = useState('');
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [busyOrderAction, setBusyOrderAction] = useState<string | null>(null);
    const [packingTaskBusyId, setPackingTaskBusyId] = useState<number | string | null>(null);
    const [orderSearch, setOrderSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sourceFilter, setSourceFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week'>('all');
    const fetchingOrdersRef = useRef(false);
    const fetchingProductsRef = useRef(false);
    const fetchingCustomersRef = useRef(false);
    const hasLoadedOrdersRef = useRef(false);
    const hasLoadedProductsRef = useRef(false);

    // Status Modal
    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const [statusOrderSelected, setStatusOrderSelected] = useState<any>(null);
    const [confirmState, setConfirmState] = useState<{
        visible: boolean;
        title: string;
        message: string;
        confirmLabel: string;
        destructive?: boolean;
        onConfirm: () => void;
    }>({ visible: false, title: '', message: '', confirmLabel: '', onConfirm: () => undefined });

    // --- Data fetching ---

    const fetchProducts = useCallback(async () => {
        if (fetchingProductsRef.current) return;
        fetchingProductsRef.current = true;
        try {
            if (!hasLoadedProductsRef.current) setLoadingProducts(true);
            const { data, error } = await supabase
                .from('products')
                .select('*, stock(size, quantity)')
                .order('id', { ascending: false });
            if (error) return;
            setProducts((data as unknown) as Product[]);
            hasLoadedProductsRef.current = true;
        } catch { /* silent */ } finally { setLoadingProducts(false); fetchingProductsRef.current = false; }
    }, []);

    const fetchOrders = useCallback(async () => {
        if (fetchingOrdersRef.current) {
            setRefreshing(false);
            return;
        }
        fetchingOrdersRef.current = true;
        try {
            if (!hasLoadedOrdersRef.current) setLoadingOrders(true);
            const { data, error } = await ordersService.getOrders(30);
            if (error) {
                setOrdersError(copy.ordersLoadFailed);
                return;
            }
            const mapped = data?.map(o => {
                const orderItems = Array.isArray(o.order_items) ? o.order_items : [];
                    const productTypes: string[] = [];
                    const itemStrings = orderItems.map((item: Record<string, unknown>) => {
                        const prodData = item.products as Record<string, unknown> | null;
                        const productName = prodData ? String(prodData.name || 'Unknown') : 'Unknown';
                        const productType = prodData ? String(prodData.product_type || '') : '';
                        if (productType && !productTypes.includes(productType)) productTypes.push(productType);
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
                    product_types: productTypes,
                    note: o.note || null,
                    packaging_cost: Number(o.packaging_cost) || 0,
                    total_price: Number(o.total_price) || 0,
                    created_at: o.created_at as string,
                };
            }) || [];
            setOrders(mapped);
            setOrdersError('');
            setLastUpdated(new Date());
            hasLoadedOrdersRef.current = true;
        } catch {
            setOrdersError(copy.ordersLoadFailed);
        } finally {
            setLoadingOrders(false);
            setRefreshing(false);
            fetchingOrdersRef.current = false;
        }
    }, [copy.noItems, copy.ordersLoadFailed]);

    const fetchCustomers = useCallback(async () => {
        if (fetchingCustomersRef.current) return;
        fetchingCustomersRef.current = true;
        try {
            const { data, error } = await customersService.getCustomers();
            if (error) return;
            setCustomers((data as unknown) as Customer[]);
        } catch { /* silent */ } finally { fetchingCustomersRef.current = false; }
    }, []);

    useFocusEffect(useCallback(() => {
        fetchOrders(); fetchProducts(); fetchCustomers();
    }, [fetchOrders, fetchProducts, fetchCustomers]));

    useEffect(() => {
        const ch1 = supabase.channel('orders-rt')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
            .subscribe();
        const ch2 = supabase.channel('products-rt-orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchProducts())
            .subscribe();
        return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
    }, [fetchProducts, fetchOrders, fetchCustomers]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchOrders();
        fetchProducts();
        fetchCustomers();
    }, [fetchCustomers, fetchOrders, fetchProducts]);

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

    const sourceOptions = useMemo(() => {
        const values = new Set<string>();
        orders.forEach(order => { if (order.source) values.add(String(order.source)); });
        SOURCES.forEach(s => values.add(s));
        return Array.from(values);
    }, [orders]);

    const typeOptions = useMemo(() => {
        const values = new Set<string>();
        products.forEach(product => { if (product.product_type) values.add(String(product.product_type)); });
        orders.forEach(order => (order.product_types || []).forEach((type: string) => values.add(type)));
        return Array.from(values);
    }, [orders, products]);

    const filteredOrders = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfWeek.getDate() - 7);
        const q = orderSearch.trim().toLowerCase();

        return orders.filter(order => {
            const createdAt = order.created_at ? new Date(order.created_at) : null;
            const haystack = [
                order.customer_name,
                order.source,
                order.status,
                ...(order.items || []),
                ...(order.product_types || []),
            ].join(' ').toLowerCase();
            const matchesSearch = !q || haystack.includes(q);
            const matchesStatus = statusFilter === 'all' || String(order.status).toLowerCase() === statusFilter.toLowerCase();
            const matchesSource = sourceFilter === 'all' || String(order.source || '').toLowerCase() === sourceFilter.toLowerCase();
            const matchesType = typeFilter === 'all' || (order.product_types || []).some((type: string) => type.toLowerCase() === typeFilter.toLowerCase());
            const matchesDate =
                dateFilter === 'all' ||
                (dateFilter === 'today' && createdAt && createdAt >= startOfToday) ||
                (dateFilter === 'week' && createdAt && createdAt >= startOfWeek);
            return matchesSearch && matchesStatus && matchesSource && matchesType && matchesDate;
        });
    }, [dateFilter, orderSearch, orders, sourceFilter, statusFilter, typeFilter]);

    const attentionOrders = useMemo(() =>
        orders.filter(order => ['Preparing', 'Ready'].includes(String(order.status)))
    , [orders]);

    function isBagProduct(product: Product | null) {
        if (!product) return false;
        const type = String(product.product_type || '').trim().toLowerCase();
        return type === 'bag' || product.name.trim().toLowerCase().includes('bag');
    }

    const selectedProductIsBag = isBagProduct(selectedProduct);
    const selectedStockQty = useMemo(() => {
        if (!selectedProduct) return null;
        if (selectedProductIsBag) {
            return selectedProduct.stock?.reduce((sum, stock) => sum + (Number(stock.quantity) || 0), 0) || 0;
        }
        return selectedProduct.stock?.find(stock => stock.size === selectedSize)?.quantity ?? 0;
    }, [selectedProduct, selectedProductIsBag, selectedSize]);
    const selectedQtyNumber = parseInt(qty, 10) || 0;
    const stockAfterSelected = selectedStockQty === null ? null : selectedStockQty - selectedQtyNumber;

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
        const busyKey = `${order.id}-${newStatus}`;
        if (busyOrderAction) return;
        try {
            setBusyOrderAction(busyKey);
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
            setBusyOrderAction(null);
            setStatusModalVisible(false);
            setStatusOrderSelected(null);
        }
    }

    function getStatusLabel(status: string) {
        const normalized = STATUSES.find(s => s.toLowerCase() === String(status).toLowerCase());
        return normalized ? copy.statusLabels[normalized] : status;
    }

    function getNextStatus(status: string) {
        const idx = STATUSES.findIndex(s => s.toLowerCase() === String(status).toLowerCase());
        if (idx < 0 || idx >= STATUSES.length - 3) return null;
        return STATUSES[idx + 1];
    }

    function confirmCancelOrder(order: any) {
        setConfirmState({
            visible: true,
            title: copy.cancelOrder,
            message: copy.confirmCancel,
            confirmLabel: copy.cancelOrder,
            destructive: true,
            onConfirm: () => handleStatusUpdate(order, 'Cancelled'),
        });
    }

    function confirmImportantStatus(order: any, status: string) {
        if (status === 'Delivered') {
            setConfirmState({
                visible: true,
                title: getStatusLabel(status),
                message: copy.completeConfirm,
                confirmLabel: getStatusLabel(status),
                onConfirm: () => handleStatusUpdate(order, status),
            });
            return;
        }
        handleStatusUpdate(order, status);
    }

    async function createPackingTask(order: any, followUp = false) {
        if (packingTaskBusyId) return;
        setPackingTaskBusyId(order.id);
        try {
            const productSummary = Array.isArray(order.items) ? order.items.join(', ') : '';
            const title = followUp
                ? `Follow up packing with Irem · Order #${order.id}`
                : `Pack order #${order.id} · ${order.customer_name}`;
            const description = [
                `${copy.customerName}: ${order.customer_name}`,
                `${copy.source}: ${order.source || '-'}`,
                `${copy.paymentNotTracked}`,
                productSummary,
            ].filter(Boolean).join('\n');
            const { error } = await todoService.addTask(title, 'todo', 'yuniee', { description });
            Alert.alert(error ? copy.error : copy.success, error ? copy.packingTaskFailed : copy.packingTaskCreated);
        } finally {
            setPackingTaskBusyId(null);
        }
    }

    return (
        <ScrollView
            ref={scrollRef}
            style={styles.container}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
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
                    placeholderTextColor={colors.text.secondary}
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
                    <TextInput placeholder={copy.phone} value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={[styles.input, styles.halfInput]} placeholderTextColor={colors.text.secondary} />
                    <TextInput placeholder={copy.address} value={address} onChangeText={setAddress} style={[styles.input, styles.halfInput]} placeholderTextColor={colors.text.secondary} />
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
                            placeholderTextColor={colors.text.secondary}
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
                                <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(String(Math.max(1, (parseInt(qty, 10) || 1) - 1)))} hitSlop={hitSlopFor(34)}>
                                    <Text style={styles.qtyBtnText}>−</Text>
                                </TouchableOpacity>
                                <TextInput value={qty} onChangeText={setQty} keyboardType="numeric" style={styles.qtyInput} />
                                <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(String((parseInt(qty, 10) || 0) + 1))} hitSlop={hitSlopFor(34)}>
                                    <Text style={styles.qtyBtnText}>+</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.addItemBtn} onPress={handleAddToCart}>
                            <Text style={styles.addItemBtnText}>{copy.addItemButton}</Text>
                        </TouchableOpacity>
                    </View>
                    {selectedProduct && selectedStockQty !== null ? (
                        <View style={styles.stockAwareness}>
                            <StatusBadge
                                label={`${copy.availableStock}: ${selectedStockQty}`}
                                tone={stockAfterSelected !== null && stockAfterSelected < 0 ? 'danger' : stockAfterSelected !== null && stockAfterSelected < 3 ? 'warning' : 'success'}
                            />
                            {stockAfterSelected !== null && stockAfterSelected < 0 ? (
                                <Text style={styles.stockAwarenessDanger}>{copy.negativeAfterOrder}</Text>
                            ) : stockAfterSelected !== null && stockAfterSelected < 3 ? (
                                <Text style={styles.stockAwarenessWarning}>{copy.lowAfterOrder}</Text>
                            ) : null}
                        </View>
                    ) : null}
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
                            <TouchableOpacity style={styles.cartRemoveBtn} onPress={() => handleRemoveFromCart(ci.key)} hitSlop={hitSlopFor(26)}>
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
                    placeholderTextColor={colors.text.secondary}
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
                    <ActivityIndicator color={colors.accent.fg} />
                ) : (
                    <Text style={styles.submitBtnText}>
                        {cart.length === 0 ? copy.addToContinue : `${copy.createOrder} · ${cartTotal.toLocaleString()}₺`}
                    </Text>
                )}
            </TouchableOpacity>

            {/* ═══ Recent Orders ═══ */}
            <SectionHeader
                title={copy.recentOrders}
                subtitle={`${filteredOrders.length}/${orders.length}`}
                right={<SyncStatus timestamp={lastUpdated} syncing={refreshing || loadingOrders} label={copy.synced} syncingLabel={copy.refreshing} />}
            />
            <QuickActionButton label={copy.createOrder} icon="+" onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })} tone="neutral" style={styles.headerQuickAction} />

            {attentionOrders.length > 0 ? (
                <WarningCard
                    title={`${attentionOrders.length} ${copy.needsAttention}`}
                    description={copy.preparingWarning}
                    tone="warning"
                    style={styles.warningCard}
                />
            ) : null}

            <View style={styles.orderTools}>
                <SearchInput value={orderSearch} onChangeText={setOrderSearch} placeholder={copy.searchOrders} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    <FilterChip label={copy.all} selected={statusFilter === 'all'} onPress={() => setStatusFilter('all')} count={orders.length} />
                    {STATUSES.map(status => (
                        <FilterChip
                            key={status}
                            label={getStatusLabel(status)}
                            selected={statusFilter === status}
                            onPress={() => setStatusFilter(status)}
                            count={orders.filter(order => order.status === status).length}
                            tone={status === 'Delivered' ? 'success' : status === 'Cancelled' ? 'danger' : status === 'Preparing' ? 'warning' : 'primary'}
                        />
                    ))}
                </ScrollView>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    {(['all', 'today', 'week'] as const).map(value => (
                        <FilterChip
                            key={value}
                            label={value === 'all' ? copy.all : value === 'today' ? copy.today : copy.week}
                            selected={dateFilter === value}
                            onPress={() => setDateFilter(value)}
                        />
                    ))}
                    {sourceOptions.map(value => (
                        <FilterChip key={value} label={value} selected={sourceFilter === value} onPress={() => setSourceFilter(sourceFilter === value ? 'all' : value)} tone="primary" />
                    ))}
                    {typeOptions.map(value => (
                        <FilterChip key={value} label={value} selected={typeFilter === value} onPress={() => setTypeFilter(typeFilter === value ? 'all' : value)} tone="success" />
                    ))}
                </ScrollView>
            </View>

            {loadingOrders ? (
                <LoadingSkeleton rows={3} />
            ) : ordersError ? (
                <ErrorState title={ordersError} description={copy.ordersLoadHelp} retryLabel={copy.retry} onRetry={fetchOrders} />
            ) : orders.length === 0 ? (
                <EmptyState
                    icon="□"
                    title={copy.noOrders}
                    description={copy.createFirst}
                />
            ) : (
                filteredOrders.length === 0 ? (
                    <EmptyState icon="⌕" title={copy.noMatchingProducts} description={copy.searchOrders} />
                ) : filteredOrders.map(order => {
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
                                        {order.source ? <StatusBadge label={order.source} tone="primary" /> : null}
                                    </View>
                                </View>
                                <TouchableOpacity
                                    onPress={() => { setStatusOrderSelected(order); setStatusModalVisible(true); }}
                                    style={styles.statusAction}
                                    hitSlop={hitSlopFor(24)}
                                >
                                    <StatusBadge
                                        label={`${getStatusLabel(order.status)} · ${copy.change}`}
                                        tone={order.status === 'Delivered' ? 'success' : order.status === 'Cancelled' ? 'danger' : order.status === 'Preparing' ? 'warning' : 'primary'}
                                    />
                                </TouchableOpacity>
                            </View>
                            <OrderFlowStepper status={order.status} labels={copy.flowLabels} />

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
                            <View style={styles.paymentRow}>
                                <StatusBadge label={copy.paymentNotTracked} tone="muted" />
                            </View>
                            {order.status === 'Ready' ? (
                                <WarningCard title={copy.readyToPack} description={order.items.join(', ')} tone="warning" style={styles.packWarning} />
                            ) : null}

                            {/* Footer */}
                            <View style={styles.orderFooter}>
                                <View style={styles.orderMeta}>
                                    <Text style={styles.orderId}>#{order.id}</Text>
                                    <StatusBadge label={dateStr} tone="muted" />
                                </View>
                                <View style={styles.orderPricing}>
                                    {order.packaging_cost > 0 ? (
                                        <Text style={styles.pkgCost}>+{order.packaging_cost}₺ {copy.packaging}</Text>
                                    ) : null}
                                    <Text style={styles.orderTotal}>{order.total_price.toLocaleString()}₺</Text>
                                </View>
                            </View>
                            <View style={styles.orderActions}>
                                {order.status === 'Ready' ? (
                                    <>
                                        <QuickActionButton
                                            label={copy.createPackingTask}
                                            icon="+"
                                            onPress={() => createPackingTask(order)}
                                            tone="warning"
                                            style={styles.orderActionButton}
                                            disabled={packingTaskBusyId === order.id}
                                        />
                                        <QuickActionButton
                                            label={copy.notifyIremLater}
                                            icon="+"
                                            onPress={() => createPackingTask(order, true)}
                                            tone="neutral"
                                            style={styles.orderActionButton}
                                            disabled={packingTaskBusyId === order.id}
                                        />
                                    </>
                                ) : null}
                                {getNextStatus(order.status) ? (
                                    <QuickActionButton
                                        label={`${copy.nextStatus}: ${getStatusLabel(getNextStatus(order.status) || '')}`}
                                        icon="→"
                                        onPress={() => confirmImportantStatus(order, getNextStatus(order.status) || order.status)}
                                        tone={getNextStatus(order.status) === 'Delivered' ? 'success' : 'primary'}
                                        style={styles.orderActionButton}
                                        disabled={busyOrderAction !== null}
                                    />
                                ) : null}
                                {order.status !== 'Cancelled' && order.status !== 'Delivered' ? (
                                    <QuickActionButton
                                        label={copy.cancelOrder}
                                        icon="×"
                                        onPress={() => confirmCancelOrder(order)}
                                        tone="neutral"
                                        style={styles.orderActionButton}
                                        disabled={busyOrderAction !== null}
                                    />
                                ) : null}
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
                            {copy.orderLabel} #{statusOrderSelected?.id} — {statusOrderSelected?.customer_name}
                        </Text>
                        {busyOrderAction ? <Text style={styles.modalBusyText}>{copy.updatingOrder}</Text> : null}
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
                                    onPress={() => confirmImportantStatus(statusOrderSelected, ns)}
                                    disabled={busyOrderAction !== null}
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
            <ConfirmDialog
                visible={confirmState.visible}
                title={confirmState.title}
                message={confirmState.message}
                confirmLabel={confirmState.confirmLabel}
                cancelLabel={copy.cancel}
                destructive={confirmState.destructive}
                onCancel={() => setConfirmState(prev => ({ ...prev, visible: false }))}
                onConfirm={() => {
                    const action = confirmState.onConfirm;
                    setConfirmState(prev => ({ ...prev, visible: false }));
                    action();
                }}
            />

            <View style={styles.bottomSpacer} />
        </ScrollView>
    );
}

function makeStyles(colors: ReturnType<typeof useAppSettings>['colors'], themeMode: 'light' | 'dark') {
const v = createVisualSystem(colors, themeMode);
return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg.page },
    scrollContent: { padding: SPACING.lg },
    title: { ...v.type.title, color: colors.text.primary, marginBottom: SPACING.lg },

    // ── Sections ── (rail is a plain divider accent, not status — neutral)
    section: {
        ...v.card, marginBottom: SPACING.md,
        borderWidth: 1, borderColor: colors.border.default, borderLeftWidth: 3, borderLeftColor: colors.border.strong,
    },
    sectionLabel: { ...v.type.label, color: colors.text.secondary, marginBottom: SPACING.md },
    inlineLabel: { ...v.type.label, color: colors.text.secondary, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: SPACING.xs },

    // ── Inputs ──
    input: { ...v.input, marginBottom: SPACING.sm },
    halfInput: { flex: 1 },
    row: { flexDirection: 'row', gap: SPACING.sm },
    textArea: { minHeight: 56 },
    noteLabelSpacing: { marginTop: SPACING.sm },

    // ── Dropdowns ──
    dropdown: { backgroundColor: colors.bg.surface, borderWidth: 1, borderColor: colors.border.default, borderRadius: v.radius.md, marginTop: -SPACING.xs, marginBottom: SPACING.sm, maxHeight: 230, overflow: 'hidden' },
    dropdownSearch: { ...v.type.body, borderBottomWidth: 1, borderBottomColor: colors.border.default, backgroundColor: colors.bg.raised, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, color: colors.text.primary },
    dropdownItem: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.md, borderBottomWidth: 1, borderBottomColor: colors.border.default, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dropdownText: { ...v.type.body, color: colors.text.primary },
    dropdownSub: { ...v.type.caption, color: colors.text.secondary },
    dropdownPrice: { ...v.type.label, color: colors.accent.bg },
    dropdownEmpty: { ...v.type.body, padding: SPACING.md, color: colors.text.secondary, textAlign: 'center' },
    dropdownTrigger: { ...v.input, justifyContent: 'center', marginBottom: SPACING.sm },
    triggerTextPlaceholder: { ...v.type.body, color: colors.text.secondary },
    triggerTextSelected: { ...v.type.body, color: colors.text.primary, fontWeight: '600' },

    // ── Item builder ──
    itemControls: { gap: SPACING.sm, marginTop: SPACING.xs },
    sizeGroup: { flexDirection: 'row', gap: SPACING.xs },
    // Adjacent siblings with a small gap: hitSlop would overlap, so the tap target is met by minHeight instead.
    sizeBtn: { flex: 1, minHeight: TOUCH.minSize, justifyContent: 'center', paddingVertical: SPACING.sm, borderRadius: v.radius.sm, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.bg.raised, alignItems: 'center' },
    sizeBtnActive: { backgroundColor: colors.accent.bg, borderColor: colors.accent.bg },
    sizeBtnText: { ...v.type.label, color: colors.text.secondary },
    sizeBtnTextActive: { color: colors.accent.fg },
    qtyAddRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: SPACING.md, marginTop: SPACING.xs },
    qtyGroup: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
    // Stepper buttons are visually 34x34; hitSlop brings the tap target to 44x44.
    qtyBtn: { width: 34, height: 34, borderRadius: v.radius.sm, backgroundColor: colors.bg.raised, borderWidth: 1, borderColor: colors.border.default, alignItems: 'center', justifyContent: 'center' },
    qtyBtnText: { ...v.type.heading, color: colors.text.primary },
    qtyInput: { width: 38, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.bg.raised, borderRadius: v.radius.sm, padding: SPACING.xs, ...v.type.body, textAlign: 'center', color: colors.text.primary },
    // A solid saturated success fill can't stay contrast-safe in both themes
    // (see ConfirmDialog) — this CTA uses the tint+fg pairing instead.
    addItemBtn: { flex: 1, ...v.primaryButton, backgroundColor: colors.status.success.bg, shadowColor: colors.status.success.bg },
    addItemBtnText: { color: colors.status.success.fg, ...v.type.label },
    stockAwareness: { marginTop: SPACING.sm, gap: SPACING.xs, alignItems: 'flex-start' },
    stockAwarenessWarning: { ...v.type.label, color: colors.status.warning.fg },
    stockAwarenessDanger: { ...v.type.label, color: colors.status.danger.fg },

    // ── Source ── (selected state reads as the "info" status tone, same as a selected FilterChip)
    sourceRow: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap', marginBottom: SPACING.sm },
    // Wrapping row with a small gap: hitSlop would overlap, so the tap target is met by minHeight instead.
    sourceBtn: { minHeight: TOUCH.minSize, justifyContent: 'center', paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: v.radius.pill, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.bg.raised },
    sourceBtnActive: { backgroundColor: colors.status.info.bg, borderColor: colors.status.info.fg },
    sourceBtnText: { ...v.type.label, color: colors.text.secondary },
    sourceBtnTextActive: { color: colors.status.info.fg },

    // ── Cart ── (rail uses the accent — the cart is the "active, about to submit" section)
    cartSection: {
        ...v.card, marginBottom: SPACING.md,
        borderWidth: 1, borderColor: colors.border.default, borderLeftWidth: 3, borderLeftColor: colors.accent.bg,
    },
    cartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
    // A count pill is decorative, not status — neutral.
    cartCount: { ...v.type.label, color: colors.text.secondary, backgroundColor: colors.bg.raised, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: v.radius.sm },
    cartItem: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.bg.raised, borderRadius: v.radius.md, padding: SPACING.md, marginBottom: SPACING.sm,
        borderWidth: 1, borderColor: colors.border.default,
    },
    // Line-item numbering is decorative, not status — neutral.
    cartItemNum: { width: 22, height: 22, borderRadius: v.radius.pill, backgroundColor: colors.bg.page, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm },
    cartItemNumText: { ...v.type.caption, fontWeight: '700', color: colors.text.primary },
    cartItemLeft: { flex: 1 },
    cartItemName: { ...v.type.body, fontWeight: '700', color: colors.text.primary, marginBottom: 1 },
    cartItemMeta: { ...v.type.caption, color: colors.text.secondary },
    cartItemPrice: { ...v.type.body, fontWeight: '700', color: colors.text.primary, marginRight: SPACING.sm },
    cartRemoveBtn: { width: 26, height: 26, borderRadius: v.radius.pill, backgroundColor: colors.status.danger.bg, alignItems: 'center', justifyContent: 'center' },
    cartRemoveText: { ...v.type.caption, fontWeight: '700', color: colors.status.danger.fg },

    // ── Totals ── (a genuine info-tinted callout — its text must use status.info.fg, not accent)
    totalsCard: { ...v.infoSurface, borderRadius: v.radius.md, padding: SPACING.md, marginBottom: SPACING.xs, borderWidth: 1 },
    totalsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: SPACING.md },
    totalsLabel: { flex: 1, ...v.type.label, color: colors.status.info.fg },
    totalsValue: { ...v.type.title, color: colors.status.info.fg },
    totalsHint: { ...v.type.caption, color: colors.text.secondary, marginTop: SPACING.xs },

    // ── Submit ──
    submitBtn: { ...v.primaryButton, marginTop: SPACING.sm },
    submitBtnDisabled: { opacity: 0.5 },
    submitBtnText: { color: colors.accent.fg, ...v.type.heading },

    // ── Recent Orders ──
    headerQuickAction: { paddingVertical: SPACING.sm },
    warningCard: { marginBottom: SPACING.md },
    orderTools: { gap: SPACING.sm, marginBottom: SPACING.md },
    filterRow: { gap: SPACING.sm, paddingRight: SPACING.xs },

    // Rail is a plain divider accent, not status — neutral (matches `section`).
    orderCard: {
        ...v.card, marginBottom: SPACING.md,
        borderWidth: 1, borderColor: colors.border.default, borderLeftWidth: 3, borderLeftColor: colors.border.strong,
    },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm },
    orderHeaderLeft: { flex: 1, marginRight: SPACING.md },
    orderCustomer: { ...v.type.heading, color: colors.text.primary },
    orderSubline: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: 3 },
    orderPhone: { ...v.type.caption, color: colors.text.secondary },
    statusAction: { alignItems: 'flex-end' },

    orderItems: { marginBottom: 2 },
    orderItemText: { ...v.type.body, color: colors.text.primary },

    // A genuine warning callout — text uses status.warning.fg, not text.primary.
    orderNote: { ...v.warningSurface, padding: SPACING.sm, borderRadius: v.radius.sm, marginTop: SPACING.sm, borderLeftWidth: 3 },
    orderNoteText: { ...v.type.label, color: colors.status.warning.fg },
    paymentRow: { marginTop: SPACING.sm, alignItems: 'flex-start' },
    packWarning: { marginTop: SPACING.sm },

    orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: SPACING.md, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: colors.border.default },
    orderMeta: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
    orderId: { ...v.type.caption, color: colors.text.secondary, fontWeight: '600' },
    orderPricing: { alignItems: 'flex-end' },
    pkgCost: { ...v.type.caption, color: colors.text.secondary, marginBottom: 1 },
    orderTotal: { ...v.type.heading, color: colors.text.primary },
    orderActions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.md },
    // QuickActionButton's own base style already guarantees a 44pt minHeight.
    orderActionButton: { flex: 1 },

    // ── Modal ──
    modalOverlay: { flex: 1, backgroundColor: OVERLAY_SCRIM, justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: colors.bg.surface, borderTopLeftRadius: v.radius.md, borderTopRightRadius: v.radius.md, padding: SPACING.xl, paddingBottom: SPACING.xxl + SPACING.sm },
    modalTitle: { ...v.type.title, marginBottom: SPACING.xs, color: colors.text.primary },
    modalSubtitle: { ...v.type.body, color: colors.text.secondary, marginBottom: SPACING.lg },
    modalOption: { paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: colors.border.default },
    modalOptionActive: { backgroundColor: colors.bg.raised },
    modalOptionDelivered: { ...v.successSurface },
    modalOptionText: { ...v.type.heading, color: colors.text.primary },
    modalOptionTextActive: { fontWeight: '700', color: colors.accent.bg },
    modalBusyText: { color: colors.text.secondary, ...v.type.label, marginBottom: SPACING.md },
    modalCancel: { ...v.secondaryButton, marginTop: SPACING.lg },
    modalCancelText: { ...v.type.heading, color: colors.text.primary },

    // ── Misc ──
    loaderSmall: { padding: SPACING.md },
    bottomSpacer: { height: SPACING.xxl + SPACING.sm },
});
}
