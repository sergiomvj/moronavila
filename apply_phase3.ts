import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function run() {
    console.log('Running phase 3 schema updates...');

    // 1. Add fields to residents
    let res = await supabase.rpc('run_sql', { sql_query: "ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS photo_url text; ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS instagram text;" });
    if (res.error) {
        console.log('Trying fallback executing via REST...');
    }
}

run();
