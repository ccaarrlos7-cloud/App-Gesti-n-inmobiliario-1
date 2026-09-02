import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('properties')
    .select('non_existent_column_123')
    .eq('id', '11111111-1111-1111-1111-111111111111');
  console.log("Error:", error);
}
test();
