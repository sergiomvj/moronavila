-- 1. Atualizar Tabela de Cômodos (Rooms)
-- Internet/Serviços -> Taxa de Limpeza
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rooms' AND column_name='internet_value') THEN
        ALTER TABLE public.rooms RENAME COLUMN internet_value TO cleaning_fee;
    ELSE
        ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS cleaning_fee NUMERIC(10,2) DEFAULT 0;
    END IF;
END $$;

ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS extras_value NUMERIC(10,2) DEFAULT 0;

-- 2. Atualizar Tabela de Moradores (Residents)
ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS rent_value NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS cleaning_fee NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS extras_value NUMERIC(10,2) DEFAULT 0;

-- 3. Atualizar Tabela de Pagamentos (Payments)
-- Garantir campos para rastreamento de tipo de cobrança se necessário (opcional)
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Mensalidade'; -- 'Mensalidade' ou 'Extra'
