import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('properties').select().limit(1);
  if (error) {
    console.error("Error:", error);
    return;
  }
  if (data.length > 0) {
    console.log("Columns:", Object.keys(data[0]));
  } else {
    // Try to insert a dummy property
    const dummy = {
      title: "Test",
      address: "Test",
      price: 100,
      status: "Vacío",
      type: "Piso",
      user_id: "00000000-0000-0000-0000-000000000000"
    };
    const { error: insertError } = await supabase.from('properties').insert(dummy);
    console.log("Insert Error:", insertError);
  }
}
test();
