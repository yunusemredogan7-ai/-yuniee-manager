import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SUPABASE_URL = 'https://gnzilcwhkrkmjmmnrxjf.supabase.co'
export const SUPABASE_KEY = 'sb_publishable_73q14jD3e_3zfUp618JYJQ_oJUHBK5Y'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})