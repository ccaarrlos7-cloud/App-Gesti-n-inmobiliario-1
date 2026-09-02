import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('properties')
    .select('purchase_document_url, mortgage_document_url, rental_contract_url')
    .eq('id', '11111111-1111-1111-1111-111111111111');
  console.log("Error:", error);
}
test();
