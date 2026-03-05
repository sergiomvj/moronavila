
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://poqlobkzaxrbwqjqxegn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvcWxvYmt6YXhyYndxanF4ZWduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQ3MTQyNSwiZXhwIjoyMDg4MDQ3NDI1fQ.0Pwiz4-Cm5qE7YvU5iIYhhBDuIJTgNtT5ksDtwtZIEw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSchema() {
    console.log('--- Corrigindo Coluna instagram e Refresh Cache ---');

    // Como o SDK não permite DDL, e o MCP está instável, vou tentar um truque:
    // Se eu não conseguir via MCP, pedirei ao usuário para rodar no painel.
    // Mas antes, vou validar se a coluna realmente não está acessível.
    const { data, error } = await supabase.from('residents').select('instagram').limit(1);

    if (error) {
        console.log('❌ Erro detectado na coluna instagram:', error.message);
    } else {
        console.log('✅ Coluna instagram está OK e acessível.');
    }
}

fixSchema();
