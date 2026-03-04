import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRoles() {
    const emails = ['sergiomvj@gmail.com', 'lenapscastro@gmail.com'];
    for (const email of emails) {
        console.log(`Atualizando ${email}...`);
        const { data, error } = await supabase
            .from('residents')
            .update({ role: 'Administrador' })
            .eq('email', email)
            .select();

        if (error) {
            console.error('Erro:', error.message);
        } else {
            console.log('Sucesso:', data);
        }
    }
}

fixRoles();
