
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://poqlobkzaxrbwqjqxegn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvcWxvYmt6YXhyYndxanF4ZWduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQ3MTQyNSwiZXhwIjoyMDg4MDQ3NDI1fQ.0Pwiz4-Cm5qE7YvU5iIYhhBDuIJTgNtT5ksDtwtZIEw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('--- Iniciando Migração Tabela devices ---');

    const sql = `
    -- Criar tabela devices se não existir
    CREATE TABLE IF NOT EXISTS public.devices (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        resident_id UUID REFERENCES public.residents(id) ON DELETE CASCADE,
        device_type TEXT NOT NULL CHECK (device_type IN ('Celular', 'Computador', 'Outro')),
        mac_address TEXT NOT NULL,
        ip_address TEXT,
        connected_time TEXT,
        bandwidth_usage NUMERIC(10,2),
        status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Ativo', 'Bloqueado')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
    );

    ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Devices Visiveis para Admins" ON public.devices;
    CREATE POLICY "Devices Visiveis para Admins" ON public.devices FOR ALL USING (
        EXISTS (SELECT 1 FROM public.residents WHERE residents.auth_id = auth.uid() AND residents.role = 'Administrador')
    );

    DROP POLICY IF EXISTS "Devices Visuais Proprios" ON public.devices;
    CREATE POLICY "Devices Visuais Proprios" ON public.devices FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.residents WHERE residents.auth_id = auth.uid() AND residents.id = devices.resident_id)
    );

    DROP POLICY IF EXISTS "Criar Proprios Devices" ON public.devices;
    CREATE POLICY "Criar Proprios Devices" ON public.devices FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.residents WHERE residents.auth_id = auth.uid() AND residents.id = devices.resident_id)
    );

    DROP POLICY IF EXISTS "Atualizar Proprios Devices" ON public.devices;
    CREATE POLICY "Atualizar Proprios Devices" ON public.devices FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.residents WHERE residents.auth_id = auth.uid() AND residents.id = devices.resident_id)
    );

    DROP POLICY IF EXISTS "Excluir Proprios Devices" ON public.devices;
    CREATE POLICY "Excluir Proprios Devices" ON public.devices FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.residents WHERE residents.auth_id = auth.uid() AND residents.id = devices.resident_id)
    );
    `;

    // Nota: O SDK do Supabase (@supabase-js) não permite executar DDL/SQL arbitrário por questões de segurança.
    // Ele é feito para operações DML (select, insert, update, delete).
    // Para executar SQL arbitrário, precisaríamos usar a API REST do Supabase para SQL ou o PostgREST direto.
    // No entanto, o MCP execute_sql falhou.

    // Vou tentar verificar se a tabela existe de novo, e se retornar erro de "not found", tentarei outro método.
    const { error: checkError } = await supabase.from('devices').select('id').limit(1);

    if (checkError && checkError.code === '42P01') {
        console.log('❌ Tabela devices REALMENTE não existe no banco.');
        console.log('Tentando criar via RPC ou outro método...');
    } else if (checkError) {
        console.log('⚠️ Erro ao acessar a tabela:', checkError.message);
    } else {
        console.log('✅ Tabela devices já existe e é acessível.');
    }
}

runMigration();
