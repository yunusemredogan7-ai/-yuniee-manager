import { supabase } from '../core/supabase/client';

export const PRODUCT_TYPES = ['T-shirt', 'Hoodie', 'Sweat', 'Bag'] as const;
export type ProductType = typeof PRODUCT_TYPES[number];

export const PRODUCT_COLORS: Record<ProductType, string[]> = {
    'T-shirt': ['Black', 'Ecru'],
    'Hoodie': ['Black', 'Ecru'],
    'Sweat': ['Black', 'Ecru'],
    'Bag': ['Default'],
};

export type Product = {
    id: number;
    name: string;
    sku: string | null;
    size: string | null;
    cost: number;
    price: number;
    product_type: ProductType | null;
    color: string | null;
    created_at: string;
};

export const productsService = {
    async getProducts(): Promise<{ data: Product[] | null, error: unknown }> {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('id', { ascending: false });
        return { data, error };
    },

    async createProduct(product: {
        name: string;
        cost: number;
        price: number;
        sku: string | null;
        size: string | null;
        product_type: ProductType | null;
        color: string | null;
    }): Promise<{ data: Product | null, error: unknown, duplicate?: boolean }> {
        // Pre-check for duplicate name (case-insensitive)
        const { data: existing, error: checkError } = await supabase
            .from('products')
            .select('id')
            .ilike('name', product.name.trim())
            .maybeSingle();

        if (checkError) {
            return { data: null, error: checkError };
        }

        if (existing) {
            return { data: null, error: new Error('Product already exists'), duplicate: true };
        }

        const { data, error } = await supabase
            .from('products')
            .insert(product)
            .select()
            .single();
        return { data, error };
    },

    async updateProduct(id: number, updates: Partial<Omit<Product, 'id' | 'created_at'>>): Promise<{ success: boolean, error: unknown }> {
        const { error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id);
        return { success: !error, error };
    },
};
