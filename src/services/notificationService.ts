import { AppNotification, NotificationEventType, PushNotificationEvent, PushNotificationPayload } from '../core/notifications/notificationTypes';
import { Task } from './todoService';

type OrderLike = {
    id: number | string;
    customer_name?: string | null;
    status?: string | null;
    source?: string | null;
    items?: string[];
};

type LowStockLike = {
    id: number | string;
    name?: string | null;
    totalStock?: number;
};

type ProductLike = {
    id: number | string;
    name?: string | null;
    cost?: number | null;
};

const NOT_CONFIGURED_REASON = 'Real push delivery is not configured. Native iOS permissions, token storage, and a backend push provider are required.';

function daysUntil(dateStr: string): number {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(`${dateStr}T00:00:00`);
    due.setHours(0, 0, 0, 0);
    return Math.floor((due.getTime() - now.getTime()) / 86400000);
}

export const notificationService = {
    preparePushEvent(
        type: NotificationEventType,
        payload: PushNotificationPayload,
        targetAudience: PushNotificationEvent['targetAudience'] = 'all_owners'
    ): PushNotificationEvent {
        return {
            type,
            payload,
            targetAudience,
            deliveryStatus: 'not_configured',
            reason: NOT_CONFIGURED_REASON,
        };
    },

    async sendPreparedPush(event: PushNotificationEvent): Promise<PushNotificationEvent> {
        if (__DEV__) {
            console.log('[push:not-configured]', event.type, event.payload.title);
        }
        return {
            ...event,
            deliveryStatus: 'not_configured',
            reason: NOT_CONFIGURED_REASON,
        };
    },

    notifyNewOrderCreated(order: OrderLike): PushNotificationEvent {
        return this.preparePushEvent('new_order_created', {
            title: `New order #${order.id}`,
            body: `${order.customer_name || 'Customer'} · ${order.source || 'No source'}`,
            data: { orderId: String(order.id), status: order.status || null },
        }, 'all_owners');
    },

    notifyOrderReadyToPack(order: OrderLike): PushNotificationEvent {
        return this.preparePushEvent('order_ready_to_pack', {
            title: `Order #${order.id} is ready to pack`,
            body: `${order.customer_name || 'Customer'} · ${(order.items || []).join(', ')}`,
            data: { orderId: String(order.id), status: order.status || null },
        }, 'irem');
    },

    notifyPackingTaskCreated(order: OrderLike): PushNotificationEvent {
        return this.preparePushEvent('order_ready_to_pack', {
            title: `Packing task created`,
            body: `Order #${order.id} · ${order.customer_name || 'Customer'}`,
            data: { orderId: String(order.id) },
        }, 'irem');
    },

    notifyLowStock(product: LowStockLike): PushNotificationEvent {
        return this.preparePushEvent('low_stock_detected', {
            title: `${product.name || 'Product'} is low stock`,
            body: `${product.totalStock || 0} units remaining`,
            data: { productId: String(product.id), totalStock: product.totalStock || 0 },
        }, 'all_owners');
    },

    notifyPackagingMaterialLow(materialName: string): PushNotificationEvent {
        return this.preparePushEvent('packaging_material_low', {
            title: 'Packaging material needs attention',
            body: materialName,
            data: { materialName },
        }, 'all_owners');
    },

    notifyUnpaidOrderReminder(order: OrderLike): PushNotificationEvent {
        return this.preparePushEvent('unpaid_order_attention', {
            title: `Payment follow-up needed`,
            body: `Order #${order.id} · ${order.customer_name || 'Customer'}`,
            data: { orderId: String(order.id) },
        }, 'all_owners');
    },

    notifyTaskWaiting(task: Task): PushNotificationEvent {
        return this.preparePushEvent('task_waiting', {
            title: task.title,
            body: task.waiting_reason || 'Task moved to waiting',
            data: { taskId: task.id, scope: task.task_scope },
        }, task.task_scope === 'irem' ? 'irem' : task.task_scope === 'yemre' ? 'yemre' : 'shared');
    },

    buildOrderNotifications(orders: OrderLike[]): AppNotification[] {
        return orders.flatMap(order => {
            const status = String(order.status || '');
            const notifications: AppNotification[] = [];

            if (status === 'Ready') {
                notifications.push({
                    id: `order-ready-pack-${order.id}`,
                    type: 'order_ready_to_pack',
                    category: 'packing',
                    severity: 'warning',
                    title: `Order #${order.id} is ready to pack`,
                    message: `${order.customer_name || 'Customer'} · ${order.source || 'No source'}`,
                    target: { screen: 'Orders' },
                });
            }

            if (status && !['Delivered', 'Cancelled'].includes(status)) {
                notifications.push({
                    id: `order-active-${order.id}`,
                    type: 'new_order_created',
                    category: 'order',
                    severity: status === 'Preparing' ? 'info' : 'warning',
                    title: `Order #${order.id} needs follow-up`,
                    message: `${order.customer_name || 'Customer'} · ${status}`,
                    target: { screen: 'Orders' },
                });
            }

            return notifications;
        });
    },

    buildLowStockNotifications(products: LowStockLike[]): AppNotification[] {
        return products.map(product => ({
            id: `low-stock-${product.id}`,
            type: 'low_stock_detected',
            category: 'stock',
            severity: (product.totalStock || 0) <= 3 ? 'danger' : 'warning',
            title: `${product.name || 'Product'} is low stock`,
            message: `${product.totalStock || 0} units remaining`,
            target: { screen: 'Stock' },
        }));
    },

    buildTaskNotifications(tasks: Task[]): AppNotification[] {
        const notifications: AppNotification[] = [];
        for (const task of tasks) {
            if (task.status === 'waiting') {
                notifications.push({
                    id: `task-waiting-${task.id}`,
                    type: 'task_waiting',
                    category: 'task',
                    severity: 'warning',
                    title: task.title,
                    message: task.waiting_reason || 'Waiting task needs follow-up',
                    target: { screen: 'Tasks' },
                });
            }
            if (task.status !== 'done' && task.due_date && daysUntil(task.due_date) < 0) {
                notifications.push({
                    id: `task-overdue-${task.id}`,
                    type: 'task_overdue',
                    category: 'task',
                    severity: 'danger',
                    title: task.title,
                    message: 'Task is overdue',
                    target: { screen: 'Tasks' },
                });
            }
        }
        return notifications;
    },

    buildProductCostNotifications(products: ProductLike[]): AppNotification[] {
        return products
            .filter(product => Number(product.cost || 0) <= 0)
            .map(product => ({
                id: `missing-cost-${product.id}`,
                type: 'missing_product_cost',
                category: 'product',
                severity: 'warning',
                title: `${product.name || 'Product'} has no cost`,
                message: 'Profit will be less reliable until cost is filled.',
                target: { screen: 'Stock' },
            }));
    },

    isPushReady(): boolean {
        return false;
    },

    getPushReadiness() {
        return {
            ready: false,
            reason: NOT_CONFIGURED_REASON,
            missing: [
                'Native notification permission/token library or native bridge',
                'APNs/FCM/Expo credentials',
                'Supabase push token storage table',
                'Backend sender such as Supabase Edge Function',
            ],
        };
    },
};
