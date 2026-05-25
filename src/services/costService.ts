import { supabase } from '../core/supabase/client';
import { ProductType } from './productsService';

export type PackagingMaterial = {
    id: number;
    name: string;
    unit_type: string;
    unit_cost: number;
    active: boolean;
    created_at: string;
};

export type PackagingQuantityMode = 'per_item' | 'fixed';

export type ProductPackagingRule = {
    id: number;
    product_type: ProductType | null;
    material_id: number | null;
    product_id: number | null;
    quantity: number;
    quantity_mode: PackagingQuantityMode;
    min_qty: number;
    max_qty: number | null;
    active: boolean;
    created_at: string;
    updated_at: string | null;
    packaging_materials?: PackagingMaterial | PackagingMaterial[] | null;
};

// ── Material name keys (must match what admin created in packaging_materials table) ──
const MAT_STRING = 'String';
const MAT_TISSUE = 'Tissue Paper';
const MAT_POUCH = 'Pouch';
const MAT_STICKER = 'Sticker';

type MaterialBreakdown = { name: string; quantity: number }[];
type StoredBreakdown = { name: string; quantity: number; unitCost: number }[];

/**
 * Product-type-based packaging rule engine.
 * Returns a list of { materialName, quantity } for a given product type and order quantity.
 */
function getPackagingBreakdown(productType: ProductType, qty: number): MaterialBreakdown {
    switch (productType) {
        case 'T-shirt': {
            const pouches = qty <= 4 ? 1 : 2;
            const stickers = qty <= 4 ? 2 : 4;
            return [
                { name: MAT_STRING, quantity: qty },
                { name: MAT_TISSUE, quantity: qty },
                { name: MAT_POUCH, quantity: pouches },
                { name: MAT_STICKER, quantity: stickers },
            ];
        }
        case 'Hoodie':
        case 'Sweat': {
            return [
                { name: MAT_POUCH, quantity: qty },
                { name: MAT_STRING, quantity: qty },
                { name: MAT_TISSUE, quantity: qty },
                { name: MAT_STICKER, quantity: qty * 2 },
            ];
        }
        case 'Bag': {
            const pouches = qty <= 2 ? 1 : 2;
            const stickers = qty <= 2 ? 2 : 4;
            return [
                { name: MAT_STRING, quantity: qty },
                { name: MAT_TISSUE, quantity: qty },
                { name: MAT_POUCH, quantity: pouches },
                { name: MAT_STICKER, quantity: stickers },
            ];
        }
        default:
            return [];
    }
}

function getRuleMaterial(rule: ProductPackagingRule): PackagingMaterial | null {
    const relation = rule.packaging_materials;
    if (Array.isArray(relation)) return relation[0] || null;
    return relation || null;
}

function ruleApplies(rule: ProductPackagingRule, qty: number): boolean {
    if (!rule.active) return false;
    if (qty < (Number(rule.min_qty) || 1)) return false;
    if (rule.max_qty !== null && qty > Number(rule.max_qty)) return false;
    return true;
}

function getStoredBreakdown(rules: ProductPackagingRule[], qty: number): StoredBreakdown {
    return rules
        .filter(rule => ruleApplies(rule, qty))
        .map(rule => {
            const material = getRuleMaterial(rule);
            if (!material || material.active === false) return null;
            const quantity = rule.quantity_mode === 'fixed'
                ? Number(rule.quantity) || 0
                : (Number(rule.quantity) || 0) * qty;
            return {
                name: material.name,
                quantity,
                unitCost: Number(material.unit_cost) || 0,
            };
        })
        .filter((item): item is StoredBreakdown[number] => !!item && item.quantity > 0);
}

/**
 * Returns a readable summary of the packaging rule for a product type.
 */
export function getPackagingRuleSummary(productType: ProductType): string {
    switch (productType) {
        case 'T-shirt':
            return 'String + Tissue per item. Pouch + Sticker: 1-4 items → 1 pouch, 2 stickers; 5-8 items → 2 pouches, 4 stickers.';
        case 'Hoodie':
        case 'Sweat':
            return '1 Pouch, 1 String, 1 Tissue, 2 Stickers per item.';
        case 'Bag':
            return 'String + Tissue per item. Pouch + Sticker: 1-2 items → 1 pouch, 2 stickers; 3-4 items → 2 pouches, 4 stickers.';
        default:
            return 'No packaging rules defined.';
    }
}

export const costService = {
    // ── Packaging Materials CRUD ──

    async getPackagingMaterials(): Promise<{ data: PackagingMaterial[] | null, error: unknown }> {
        const { data, error } = await supabase
            .from('packaging_materials')
            .select('*')
            .order('name');
        return { data: data as PackagingMaterial[] | null, error };
    },

    async getActivePackagingMaterials(): Promise<{ data: PackagingMaterial[] | null, error: unknown }> {
        const { data, error } = await supabase
            .from('packaging_materials')
            .select('*')
            .eq('active', true)
            .order('name');
        return { data: data as PackagingMaterial[] | null, error };
    },

    async addPackagingMaterial(material: { name: string; unit_type: string; unit_cost: number; active?: boolean }) {
        const { data, error } = await supabase
            .from('packaging_materials')
            .insert(material)
            .select()
            .single();
        return { data, error };
    },

    async updatePackagingMaterial(id: number, updates: Partial<PackagingMaterial>) {
        const { data, error } = await supabase
            .from('packaging_materials')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        return { data, error };
    },

    async deletePackagingMaterial(id: number) {
        const { error } = await supabase
            .from('packaging_materials')
            .delete()
            .eq('id', id);
        return { success: !error, error };
    },

    // ── Product-Type Packaging Rules CRUD ──

    async getProductPackagingRules(): Promise<{ data: ProductPackagingRule[] | null, error: unknown }> {
        const { data, error } = await supabase
            .from('product_packaging_rules')
            .select(`
                *,
                packaging_materials (*)
            `)
            .order('product_type', { ascending: true })
            .order('min_qty', { ascending: true })
            .order('id', { ascending: true });
        return { data: data as ProductPackagingRule[] | null, error };
    },

    async addProductPackagingRule(rule: {
        product_type: ProductType;
        material_id: number;
        quantity: number;
        quantity_mode: PackagingQuantityMode;
        min_qty?: number;
        max_qty?: number | null;
        active?: boolean;
    }) {
        const { data, error } = await supabase
            .from('product_packaging_rules')
            .insert({
                product_type: rule.product_type,
                material_id: rule.material_id,
                quantity: rule.quantity,
                quantity_mode: rule.quantity_mode,
                min_qty: rule.min_qty ?? 1,
                max_qty: rule.max_qty ?? null,
                active: rule.active ?? true,
                product_id: null,
            } as any)
            .select()
            .single();
        return { data, error };
    },

    async updateProductPackagingRule(id: number, updates: Partial<Pick<ProductPackagingRule, 'material_id' | 'quantity' | 'quantity_mode' | 'min_qty' | 'max_qty' | 'active'>>) {
        const { data, error } = await supabase
            .from('product_packaging_rules')
            .update(updates as any)
            .eq('id', id)
            .select()
            .single();
        return { data, error };
    },

    async deleteProductPackagingRule(id: number) {
        const { error } = await supabase
            .from('product_packaging_rules')
            .delete()
            .eq('id', id);
        return { success: !error, error };
    },

    // ── Cost Calculation (Product-Type-Based Rule Engine) ──

    /**
     * Calculates total packaging cost for an order.
     * Groups items by product_type, evaluates rules per type, sums costs.
     * For mixed orders: each product type is calculated independently then summed.
     */
    async calculateOrderPackagingCost(
        items: { product_id: number; quantity: number }[]
    ): Promise<number> {
        if (!items || items.length === 0) return 0;

        // 1. Fetch product types for all items
        const productIds = items.map(i => i.product_id);
        const { data: products } = await supabase
            .from('products')
            .select('id, product_type')
            .in('id', productIds);

        if (!products) return 0;

        // 2. Fetch stored product-type packaging rules. If the schema has not
        // been migrated yet, fall back to the original rule engine.
        const productTypes = Array.from(new Set(products.map(p => p.product_type).filter(Boolean))) as ProductType[];
        const { data: storedRules } = await supabase
            .from('product_packaging_rules')
            .select(`
                *,
                packaging_materials (*)
            `)
            .in('product_type', productTypes)
            .eq('active', true);

        const rulesByType = new Map<ProductType, ProductPackagingRule[]>();
        for (const rule of ((storedRules || []) as ProductPackagingRule[])) {
            if (!rule.product_type) continue;
            const pType = rule.product_type as ProductType;
            rulesByType.set(pType, [...(rulesByType.get(pType) || []), rule]);
        }

        // 3. Fetch active material unit costs for fallback rules.
        const { data: materials } = await supabase
            .from('packaging_materials')
            .select('name, unit_cost')
            .eq('active', true);

        if (!materials) return 0;

        const costMap = new Map<string, number>();
        for (const mat of materials) {
            costMap.set(mat.name, Number(mat.unit_cost) || 0);
        }

        // 4. Group items by product_type
        const typeGroups = new Map<string, number>();
        for (const item of items) {
            const product = products.find(p => p.id === item.product_id);
            const pType = product?.product_type as ProductType | null;
            if (!pType) continue; // Skip products without a type
            const current = typeGroups.get(pType) || 0;
            typeGroups.set(pType, current + item.quantity);
        }

        // 5. Calculate cost per type group
        let totalCost = 0;
        for (const [pType, qty] of typeGroups.entries()) {
            const storedBreakdown = getStoredBreakdown(rulesByType.get(pType as ProductType) || [], qty);
            if (storedBreakdown.length > 0) {
                for (const { quantity, unitCost } of storedBreakdown) {
                    totalCost += unitCost * quantity;
                }
                continue;
            }

            const fallbackBreakdown = getPackagingBreakdown(pType as ProductType, qty);
            for (const { name, quantity } of fallbackBreakdown) {
                const unitCost = costMap.get(name) || 0;
                totalCost += unitCost * quantity;
            }
        }

        return Number(totalCost.toFixed(2));
    },

    /**
     * Calculate packaging cost for a single product type and quantity.
     * Used for UI previews.
     */
    async calculateSingleTypeCost(productType: ProductType, qty: number): Promise<number> {
        const { data: materials } = await supabase
            .from('packaging_materials')
            .select('name, unit_cost')
            .eq('active', true);

        if (!materials) return 0;

        const costMap = new Map<string, number>();
        for (const mat of materials) {
            costMap.set(mat.name, Number(mat.unit_cost) || 0);
        }

        const breakdown = getPackagingBreakdown(productType, qty);
        let cost = 0;
        for (const { name, quantity } of breakdown) {
            cost += (costMap.get(name) || 0) * quantity;
        }
        return Number(cost.toFixed(2));
    },

    async calculateSingleTypeCostFromRules(productType: ProductType, qty: number): Promise<number> {
        const { data } = await supabase
            .from('product_packaging_rules')
            .select(`
                *,
                packaging_materials (*)
            `)
            .eq('product_type', productType)
            .eq('active', true);

        const storedBreakdown = getStoredBreakdown((data || []) as ProductPackagingRule[], qty);
        if (storedBreakdown.length > 0) {
            return Number(storedBreakdown.reduce((sum, item) => sum + item.quantity * item.unitCost, 0).toFixed(2));
        }

        return this.calculateSingleTypeCost(productType, qty);
    },

    /**
     * Get the breakdown details for display purposes.
     */
    getBreakdownForType: getPackagingBreakdown,
    getStoredBreakdownForRules: getStoredBreakdown,
};
