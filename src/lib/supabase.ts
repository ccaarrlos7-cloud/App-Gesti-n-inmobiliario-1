import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Falta la configuración de Supabase. Asegúrate de configurar SUPABASE_URL y SUPABASE_ANON_KEY en las variables de entorno.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
