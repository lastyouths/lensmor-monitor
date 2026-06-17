import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

const url = urlMatch ? urlMatch[1].replace(/['"]/g, '').trim() : '';
const key = keyMatch ? keyMatch[1].replace(/['"]/g, '').trim() : '';

const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase
    .from('reports')
    .delete()
    .eq('url', 'http://localhost:3000/sandbox');
    
  console.log('Deleted sandbox reports:', error || 'Success');
}
run();
