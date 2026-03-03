-- Extensão para geração segura e eficiente de IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. ROOMS ──────────────────────────────────────────────────────────
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    capacity INT NOT NULL DEFAULT 1,
    occupied INT NOT NULL DEFAULT 0,
    rent_value NUMERIC(10,2) NOT NULL,
    description TEXT,
    suite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- ── 2. RESIDENTS ────────────────────────────────────────────────────────
CREATE TABLE residents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID UNIQUE, -- Link para o usuário autenticado nativo do auth.users
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'Morador', -- Admin / Morador
    status TEXT DEFAULT 'Ativo',
    entry_date DATE,
    birth_date DATE,
    cpf TEXT,
    document_number TEXT,
    origin_address TEXT,
    work_address TEXT,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    mac_address TEXT,
    internet_active BOOLEAN DEFAULT false,
    internet_renewal_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- ── 3. FURNITURE ─────────────────────────────────────────────────────
CREATE TABLE furniture (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    condition TEXT,
    purchase_date DATE,
    serial_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- ── 4. ROOM MEDIA ────────────────────────────────────────────────────
CREATE TABLE room_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'image',
    storage_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- ── 5. PAYMENTS ──────────────────────────────────────────────────────
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id UUID REFERENCES residents(id) ON DELETE SET NULL,
    month TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    due_date DATE NOT NULL,
    payment_date DATE,
    status TEXT NOT NULL DEFAULT 'Pendente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- ── 6. MAINTENANCE REQUESTS ───────────────────────────────────────────
CREATE TABLE maintenance_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    requested_by UUID REFERENCES residents(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'Aberto',
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- ── 7. COMPLAINTS ─────────────────────────────────────────────────────
CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id UUID REFERENCES residents(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Em Análise',
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- ── 8. NOTICES ────────────────────────────────────────────────────────
CREATE TABLE notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Normal',
    author_id UUID REFERENCES residents(id) ON DELETE CASCADE,
    is_pinned BOOLEAN DEFAULT false,
    is_general BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- ── 9. NOTICE COMMENTS ────────────────────────────────────────────────
CREATE TABLE notice_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notice_id UUID REFERENCES notices(id) ON DELETE CASCADE,
    resident_id UUID REFERENCES residents(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- ── 10. CALENDAR EVENTS ───────────────────────────────────────────────
CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    location TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- ── 11. CALENDAR EVENT RESIDENTS (M-N rel) ────────────────────────────
CREATE TABLE calendar_event_residents (
    event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
    resident_id UUID REFERENCES residents(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, resident_id)
);

-- ── 12. LAUNDRY SCHEDULES ─────────────────────────────────────────────
CREATE TABLE laundry_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID REFERENCES residents(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'Agendado' CHECK (status IN ('Agendado', 'Concluído', 'Cancelado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- ── CONFIGURANDO SEGURANÇA (RLS BÁSICO) ───────────────────────────────
-- Obs: Em ambiente normal você ajustaria as políticas de segurança.
--      Como essa implementação inicial usa um "bypass" por enquanto:
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE furniture ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notice_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_event_residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE laundry_schedules ENABLE ROW LEVEL SECURITY;

-- Liberando acesso total para simplificar neste primeiro momento:
CREATE POLICY "Public Access" ON rooms FOR ALL USING (true);
CREATE POLICY "Public Access" ON residents FOR ALL USING (true);
CREATE POLICY "Public Access" ON furniture FOR ALL USING (true);
CREATE POLICY "Public Access" ON room_media FOR ALL USING (true);
CREATE POLICY "Public Access" ON payments FOR ALL USING (true);
CREATE POLICY "Public Access" ON maintenance_requests FOR ALL USING (true);
CREATE POLICY "Public Access" ON complaints FOR ALL USING (true);
CREATE POLICY "Public Access" ON notices FOR ALL USING (true);
CREATE POLICY "Public Access" ON notice_comments FOR ALL USING (true);
CREATE POLICY "Public Access" ON calendar_events FOR ALL USING (true);
CREATE POLICY "Public Access" ON calendar_event_residents FOR ALL USING (true);
CREATE POLICY "Public Access" ON laundry_schedules FOR ALL USING (true);

-- Criar buckets de storage caso ainda não existam:
insert into storage.buckets (id, name, public) values ('room-media', 'room-media', true) on conflict do nothing;
create policy "Public Access" on storage.objects for all using ( bucket_id = 'room-media' );
