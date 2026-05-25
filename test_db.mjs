import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gnzilcwhkrkmjmmnrxjf.supabase.co'
const SUPABASE_KEY = 'sb_publishable_73q14jD3e_3zfUp618JYJQ_oJUHBK5Y'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const { data, error } = await supabase.from('products').select('*');
  if (error) {
    console.error('Error fetching products:', error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

run();
