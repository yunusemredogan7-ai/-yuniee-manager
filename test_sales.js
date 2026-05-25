const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
    const { data } = await supabase
        .from('orders')
        .select(`
            id,
            customer_name,
            packaging_cost,
            order_items (
                quantity,
                price,
                products ( name, cost )
            )
        `)
        .eq('status', 'Delivered')
        .order('id', { ascending: false })
        .limit(2);
        
    console.log(JSON.stringify(data, null, 2));
}

check();
