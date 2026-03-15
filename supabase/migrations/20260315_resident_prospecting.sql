-- Migration for Resident Prospecting Flow
-- Add new fields to rooms
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS is_common_area BOOLEAN DEFAULT false;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS is_blocked_for_repairs BOOLEAN DEFAULT false;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'Disponível';

-- Add new fields to residents
ALTER TABLE residents ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE residents ADD COLUMN IF NOT EXISTS rg TEXT;
ALTER TABLE residents ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE residents ADD COLUMN IF NOT EXISTS origin_address TEXT;
ALTER TABLE residents ADD COLUMN IF NOT EXISTS family_address TEXT;
ALTER TABLE residents ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE residents ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE residents ADD COLUMN IF NOT EXISTS occupation TEXT;
ALTER TABLE residents ADD COLUMN IF NOT EXISTS work_address TEXT;
ALTER TABLE residents ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE residents ADD COLUMN IF NOT EXISTS university TEXT;
ALTER TABLE residents ADD COLUMN IF NOT EXISTS course TEXT;
ALTER TABLE residents ADD COLUMN IF NOT EXISTS instagram TEXT;

-- Create rental_conditions table
CREATE TABLE IF NOT EXISTS rental_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID,
    deposit_months INTEGER DEFAULT 1,
    cleaning_fee_fixed DECIMAL DEFAULT 0,
    pro_rata_enabled BOOLEAN DEFAULT true,
    rules_summary TEXT,
    calculation_instructions TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for rental_conditions
ALTER TABLE rental_conditions ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read rental conditions (needed for Landing Page)
DROP POLICY IF EXISTS "Allow public read rental conditions" ON rental_conditions;
CREATE POLICY "Allow public read rental conditions" ON rental_conditions FOR SELECT USING (true);

-- Allow admins to manage rental conditions
DROP POLICY IF EXISTS "Allow admin manage rental conditions" ON rental_conditions;
CREATE POLICY "Allow admin manage rental conditions" ON rental_conditions FOR ALL USING (
    EXISTS (
        SELECT 1 FROM residents
        WHERE residents.auth_id = auth.uid()
        AND residents.role = 'Administrador'
    )
);

-- Initial data for rental conditions if not exists
INSERT INTO rental_conditions (deposit_months, cleaning_fee_fixed, pro_rata_enabled, rules_summary, calculation_instructions)
SELECT 1, 150, true, 'O calção quita o ultimo mes de aluguel após o aviso de saída. O aluguel inclui internet e água.', 'Insira a data prevista de entrada para calcular o primeiro pagamento.'
WHERE NOT EXISTS (SELECT 1 FROM rental_conditions);
