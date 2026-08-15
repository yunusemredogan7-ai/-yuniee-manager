export type NotificationSeverity = 'info' | 'warning' | 'danger' | 'success';

export type NotificationCategory =
    | 'order'
    | 'packing'
    | 'stock'
    | 'task'
    | 'finance'
    | 'product'
    | 'system';

export type NotificationTarget = {
    screen: string;
    params?: Record<string, unknown>;
};

export type NotificationEventType =
    | 'new_order_created'
    | 'order_ready_to_pack'
    | 'low_stock_detected'
    | 'packaging_material_low'
    | 'unpaid_order_attention'
    | 'task_waiting'
    | 'task_overdue'
    | 'missing_product_cost';

export type PushDeliveryStatus = 'prepared' | 'sent' | 'skipped' | 'not_configured';

export type PushNotificationPayload = {
    title: string;
    body: string;
    data?: Record<string, string | number | boolean | null>;
};

export type PushNotificationEvent = {
    type: NotificationEventType;
    payload: PushNotificationPayload;
    targetAudience: 'all_owners' | 'irem' | 'yemre' | 'shared';
    deliveryStatus: PushDeliveryStatus;
    reason?: string;
};

export type AppNotification = {
    id: string;
    type: NotificationEventType;
    category: NotificationCategory;
    severity: NotificationSeverity;
    title: string;
    message?: string;
    target?: NotificationTarget;
    createdAt?: string;
};
