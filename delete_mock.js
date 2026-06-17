require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase
    .from('reports')
    .delete()
    .eq('url', 'http://localhost:3000/sandbox');
    
  console.log('Deleted sandbox reports:', error || 'Success');
}
run();
