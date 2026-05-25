import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gnzilcwhkrkmjmmnrxjf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_73q14jD3e_3zfUp618JYJQ_oJUHBK5Y';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const { data: orders, error: ordersErr } = await supabase
    .from('orders')
    .select('id, status')
    .neq('status', 'Delivered')
    .limit(1);

  if (ordersErr || !orders || orders.length === 0) {
    console.error('No non-delivered order found', ordersErr);
    process.exit(0);
  }

  const orderId = orders[0].id;
  console.log('Testing delivery on order:', orderId);

  const { data, error } = await supabase.rpc('deliver_order_safely', { p_order_id: orderId });
  console.log('Test RPC result data:', data);
  console.log('Test RPC result error:', JSON.stringify(error, null, 2));
  process.exit(0);
}

run();
