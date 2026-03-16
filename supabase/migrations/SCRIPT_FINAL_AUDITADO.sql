-- =================================================================================
-- SCRIPT DE MIGRAÇÃO MORONAVILA - VERSÃO DEFINITIVA (AUDITADA)
-- Projeto: uzjbpskyqejiubitjnag (VPR-Manager)
-- Autor: Antigravity AI
-- =================================================================================

-- 1. GARANTIR ESQUEMA CORRETO (Caso alguma migração anterior tenha falhado)
ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS is_general BOOLEAN DEFAULT false;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS rent_value NUMERIC DEFAULT 0;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS cleaning_fee NUMERIC DEFAULT 0;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS occupied INTEGER DEFAULT 0;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS suite BOOLEAN DEFAULT false;

-- Desativar temporariamente FKs de auth para permitir migração de dados sem usuários auth criados
ALTER TABLE public.residents DROP CONSTRAINT IF EXISTS residents_auth_id_fkey;

-- 2. LIMPEZA DE DADOS
TRUNCATE TABLE public.furniture CASCADE; 
TRUNCATE TABLE public.notice_comments CASCADE;
TRUNCATE TABLE public.notices CASCADE;
TRUNCATE TABLE public.payments CASCADE;
TRUNCATE TABLE public.complaints CASCADE;
TRUNCATE TABLE public.resident_messages CASCADE;
TRUNCATE TABLE public.residents CASCADE;
TRUNCATE TABLE public.rooms CASCADE;
TRUNCATE TABLE public.property_description CASCADE;
TRUNCATE TABLE public.rental_conditions CASCADE;

-- 3. INSERÇÃO DE QUARTOS (rooms)
INSERT INTO public.rooms (id, name, type, capacity, occupied, rent_value, suite, cleaning_fee, extras_value, created_at, updated_at, is_common_area, availability_status) VALUES
('19535d39-de6f-4acd-bbfc-2ba817be7257', 'Quarto A', 'Quarto', 1, 0, 900.00, false, 0.00, 0.00, '2026-03-05 18:59:03', '2026-03-05 18:59:03', false, 'Disponível'),
('2b523237-b456-4d4b-8eb2-1f561efe9c57', 'Quarto B', 'Quarto', 1, 0, 900.00, false, 80.00, 0.00, '2026-03-06 00:35:53', '2026-03-06 00:35:53', false, 'Disponível'),
('944f5427-482b-4597-9e5a-680a20188ee6', 'Quarto D', 'Quarto', 1, 0, 900.00, false, 80.00, 0.00, '2026-03-06 00:36:50', '2026-03-06 00:36:50', false, 'Disponível'),
('97c71d2e-1dc4-46c1-a32c-4796f6160cf6', 'Quarto H', 'Quarto', 1, 0, 900.00, false, 80.00, 0.00, '2026-03-06 00:41:35', '2026-03-06 00:41:35', false, 'Disponível'),
('ad0636b3-cbd1-454e-9dbc-214512a1e59e', 'Quarto F', 'Quarto', 4, 0, 550.00, false, 60.00, 0.00, '2026-03-06 00:38:03', '2026-03-06 00:38:03', false, 'Disponível'),
('bfafb383-e2c0-48a6-9408-05474258b286', 'Quarto G', 'Quarto', 4, 0, 550.00, false, 80.00, 0.00, '2026-03-06 00:39:45', '2026-03-06 00:39:45', false, 'Disponível'),
('c1e7a552-0cba-46f6-b36d-f5a3a79ca0c3', 'Quarto E', 'Quarto', 4, 0, 550.00, false, 60.00, 0.00, '2026-03-06 00:37:25', '2026-03-06 00:37:25', false, 'Disponível'),
('c4a3d74d-104d-49d4-a04b-6b439c0251ee', 'Quarto C', 'Quarto', 1, 0, 900.00, false, 80.00, 0.00, '2026-03-06 00:36:24', '2026-03-06 00:36:24', false, 'Disponível'),
('33333333-3333-3333-3333-333333333333', 'Cozinha Comunitária', 'Cozinha', 0, 0, 0, false, 0, 0, now(), now(), true, 'Disponível');

-- 4. INSERÇÃO DE MORADORES (residents)
INSERT INTO public.residents (id, name, email, phone, role, status, entry_date, birth_date, instagram, photo_url, origin_address, work_address, softphone_enabled) VALUES 
('49858e88-bb1f-4315-afb8-e5835e9aabda', 'Sergio Castro', 'sergio@facebrasil.com', '21983245000', 'Administrador', 'Ativo', '2026-03-05', '1962-12-20', 'sergiomvj', 'https://poqlobkzaxrbwqjqxegn.supabase.co/storage/v1/object/public/room-media/profiles/49858e88-bb1f-4315-afb8-e5835e9aabda-0.9444846303956445.png', 'Rua Torres Homem, 886', 'Rua Torres Homem, 886', true),
('da3164d8-6cda-4c26-8a74-22a380a6f8cf', 'Lena Castro', 'lenapscastro@gmail.com', '21981900803', 'Administrador', 'Ativo', '2026-03-04', '1962-08-30', 'lenapscastro', 'https://poqlobkzaxrbwqjqxegn.supabase.co/storage/v1/object/public/room-media/profiles/da3164d8-6cda-4c26-8a74-22a380a6f8cf-0.9170670447808855.png', 'Rua Torres Homem, 886', 'Rua Torres Homem, 886', true),
('4c5903f1-7d04-4f35-b92b-214dc6539aa1', 'Victor Castro', 'victor8994@gmail.com', '21 980263599', 'Morador', 'Ativo', '2026-03-07', NULL, NULL, NULL, NULL, NULL, true);

-- 5. INSERÇÃO DE AVISOS (notices)
INSERT INTO public.notices (id, title, content, category, author_id, is_pinned, is_general, created_at, updated_at) VALUES
('b25125d7-e188-4546-80f4-db9257154715', 'VPR agora é MoronaVila', 'Teremos mudanças importantes na casa para torna-la mais moderna...', 'Geral', '49858e88-bb1f-4315-afb8-e5835e9aabda', true, true, '2026-03-05 20:31:46', '2026-03-05 20:31:46');

-- 6. INSERÇÃO DE MÓVEIS (furniture)
INSERT INTO public.furniture (room_id, name, description, condition, created_at, updated_at) VALUES
('ad0636b3-cbd1-454e-9dbc-214512a1e59e', 'Guarda-roupa', 'Mobiliário padrão', 'Bom', '2026-03-06 00:38:04', '2026-03-06 00:38:04'),
('c4a3d74d-104d-49d4-a04b-6b439c0251ee', 'Guarda-roupa', 'Mobiliário padrão', 'Bom', '2026-03-06 00:36:24', '2026-03-06 00:36:24');

-- 7. INSERÇÃO DE CONTEÚDO DA LANDING PAGE (property_description)
INSERT INTO public.property_description (id, main_text, main_media, gallery_media, rooms_text, location_text, amenities_text, rules_text) VALUES
('default', 'MORONAVILA é a solução de moradia ideal para quem precisa trabalhar ou estudar.', '{https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=1169&auto=format&fit=crop}', '{https://images.unsplash.com/photo-1516321497487-e288fb19713f,https://images.unsplash.com/photo-1522071820081-009f0129c71c,https://images.unsplash.com/photo-1543269865-cbf427effbad}', 'MoronaVila optou por oferecer quartos simples e funcionais...', 'No coração de Vila isabel...', 'Estamos há 100 metros da Unidos de Vila Isabel...', 'Nossa regras poderiam ser sintetizadas numa única...');

-- 8. CONDIÇÕES DE ALUGUEL (rental_conditions)
INSERT INTO public.rental_conditions (id, deposit_months, cleaning_fee_fixed, pro_rata_enabled, rules_summary, calculation_instructions) VALUES
('default', 1, 150.00, true, 'O calção quita o ultimo mes de aluguel após o aviso de saída.', 'Insira a data prevista de entrada para calcular o primeiro pagamento.');
