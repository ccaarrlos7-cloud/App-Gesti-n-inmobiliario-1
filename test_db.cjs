const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://usjwjjhblkzmdxmjaaas.supabase.co', 'sb_publishable_2LDAFADOplQ7kgKU9lnKUg_fhSVj4ue');
supabase.from('profiles').select('*').limit(5).then(res => console.log('Profiles:', res.data, res.error));
