-- =================================================================================
-- SCRIPT DE RESTAURAÇÃO INTEGRAL MORONAVILA (BYPASS RLS - VERSÃO FINAL)
-- Projeto Destino: uzjbpskyqejiubitjnag
-- Este script desabilita temporariamente o RLS para permitir a carga de dados.
-- =================================================================================

-- 1. DESABILITAR RLS E TRIGGERS TEMPORARIAMENTE
-- Isso garante que a migração não seja bloqueada por políticas de segurança ou triggers
ALTER TABLE public.residents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.furniture DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_description DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_conditions DISABLE ROW LEVEL SECURITY;

-- Desabilita temporariamente verificações de integridade e triggers durante a carga
SET session_replication_role = 'replica';

-- 2. PREPARAÇÃO DO ESQUEMA
ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS mac_address TEXT;
ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS mac_address_pc TEXT;
ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS internet_active BOOLEAN DEFAULT false;
ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS internet_renewal_date DATE;
ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS document_number TEXT;
ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS softphone_extension TEXT;
ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS softphone_display_name TEXT;
ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS cleaning_fee NUMERIC DEFAULT 0;
ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS extras_value NUMERIC DEFAULT 0;
ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS rent_value NUMERIC DEFAULT 0;

ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS is_general BOOLEAN DEFAULT false;

ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS rent_value NUMERIC DEFAULT 0;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS cleaning_fee NUMERIC DEFAULT 0;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS extras_value NUMERIC DEFAULT 0;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS occupied INTEGER DEFAULT 0;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS suite BOOLEAN DEFAULT false;

-- 3. LIMPEZA DE DADOS
TRUNCATE TABLE public.furniture CASCADE; 
TRUNCATE TABLE public.notices CASCADE;
TRUNCATE TABLE public.residents CASCADE;
TRUNCATE TABLE public.rooms CASCADE;
TRUNCATE TABLE public.property_description CASCADE;
TRUNCATE TABLE public.rental_conditions CASCADE;

-- 4. CARGA DE QUARTOS (rooms_rows.csv)
INSERT INTO public.rooms (id, name, capacity, occupied, rent_value, description, suite, created_at, updated_at, type, cleaning_fee, extras_value) VALUES
('19535d39-de6f-4acd-bbfc-2ba817be7257', 'Quarto A', 1, 0, 900.00, NULL, false, '2026-03-05 18:59:03.867524+00', '2026-03-05 18:59:03.867524+00', 'Quarto', 0, 0.00),
('2b523237-b456-4d4b-8eb2-1f561efe9c57', 'Quarto B', 1, 0, 900.00, NULL, false, '2026-03-06 00:35:53.4386+00', '2026-03-06 00:35:53.4386+00', 'Quarto', 80, 0.00),
('944f5427-482b-4597-9e5a-680a20188ee6', 'Quarto D', 1, 0, 900.00, NULL, false, '2026-03-06 00:36:50.923898+00', '2026-03-06 00:36:50.923898+00', 'Quarto', 80, 0.00),
('97c71d2e-1dc4-46c1-a32c-4796f6160cf6', 'Quarto H', 1, 0, 900.00, NULL, false, '2026-03-06 00:41:35.167393+00', '2026-03-06 00:41:35.167393+00', 'Quarto', 80, 0.00),
('ad0636b3-cbd1-454e-9dbc-214512a1e59e', 'Quarto F', 4, 0, 550.00, NULL, false, '2026-03-06 00:38:03.184139+00', '2026-03-06 00:38:03.184139+00', 'Quarto', 60, 0.00),
('bfafb383-e2c0-48a6-9408-05474258b286', 'Quarto G', 4, 0, 550.00, NULL, false, '2026-03-06 00:39:45.678931+00', '2026-03-06 00:39:45.678931+00', 'Quarto', 80, 0.00),
('c1e7a552-0cba-46f6-b36d-f5a3a79ca0c3', 'Quarto E', 4, 0, 550.00, NULL, false, '2026-03-06 00:37:25.298008+00', '2026-03-06 00:37:25.298008+00', 'Quarto', 60, 0.00),
('c4a3d74d-104d-49d4-a04b-6b439c0251ee', 'Quarto C', 1, 0, 900.00, NULL, false, '2026-03-06 00:36:24.101086+00', '2026-03-06 00:36:24.101086+00', 'Quarto', 80, 0.00),
('33333333-3333-3333-3333-333333333333', 'Cozinha/Comum', 0, 0, 0, NULL, false, now(), now(), 'Cozinha', 0, 0);

-- 5. CARGA DE MORADORES (residents_rows.csv)
INSERT INTO public.residents (id, name, email, phone, role, status, entry_date, birth_date, cpf, document_number, origin_address, work_address, room_id, mac_address, internet_active, internet_renewal_date, created_at, updated_at, instagram, photo_url, mac_address_pc, rent_value, cleaning_fee, extras_value, softphone_extension, softphone_enabled, softphone_display_name) VALUES 
('49858e88-bb1f-4315-afb8-e5835e9aabda', 'Sergio Castro', 'sergio@facebrasil.com', '21983245000', 'Administrador', 'Ativo', '2026-03-05', '1962-12-20', NULL, NULL, 'Rua Torres Homem, 886', 'Rua Torres Homem, 886', NULL, NULL, true, NULL, '2026-03-05 18:31:38.334094+00', '2026-03-05 18:31:38.334094+00', 'sergiomvj', 'https://poqlobkzaxrbwqjqxegn.supabase.co/storage/v1/object/public/room-media/profiles/49858e88-bb1f-4315-afb8-e5835e9aabda-0.9444846303956445.png', NULL, 0.00, 0.00, 0.00, NULL, true, NULL),
('4c5903f1-7d04-4f35-b92b-214dc6539aa1', 'Victor Castro', 'victor8994@gmail.com', '21 980263599', 'Morador', 'Ativo', '2026-03-07', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, '2026-03-07 16:07:45.831884+00', '2026-03-07 16:07:45.831884+00', NULL, NULL, NULL, 0.00, 0.00, 0.00, NULL, true, NULL),
('8a8849ee-06eb-4ca5-b860-c2910b6ccca3', 'Tester', 'test@test.com', '11988887777', 'Morador', 'Ativo', '2026-03-05', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, '2026-03-05 20:31:56.809602+00', '2026-03-05 20:31:56.809602+00', NULL, NULL, NULL, 0.00, 0.00, 0.00, NULL, true, NULL),
('da3164d8-6cda-4c26-8a74-22a380a6f8cf', 'Lena Castro', 'lenapscastro@gmail.com', '21981900803', 'Administrador', 'Ativo', '2026-03-04', '1962-08-30', NULL, NULL, 'Rua Torres Homem, 886', 'Rua Torres Homem, 886', NULL, NULL, true, NULL, '2026-03-04 16:23:11.866561+00', '2026-03-04 16:23:11.866561+00', 'lenapscastro', 'https://poqlobkzaxrbwqjqxegn.supabase.co/storage/v1/object/public/room-media/profiles/da3164d8-6cda-4c26-8a74-22a380a6f8cf-0.9170670447808855.png', NULL, 0.00, 0.00, 0.00, NULL, true, NULL);

-- 6. CARGA DE MÓVEIS (32 itens)
INSERT INTO public.furniture (id, room_id, name, description, condition, created_at, updated_at) VALUES
('1b35754b-c19a-4163-a7e1-b39d9b5f313d', 'ad0636b3-cbd1-454e-9dbc-214512a1e59e', 'Guarda-roupa', 'Mobiliário padrão', 'Bom', '2026-03-06 00:38:04.464261+00', '2026-03-06 00:38:04.464261+00'),
('27ce3052-25e6-4855-93a0-395f8f312919', 'c4a3d74d-104d-49d4-a04b-6b439c0251ee', 'Guarda-roupa', 'Mobiliário padrão', 'Bom', '2026-03-06 00:36:24.562481+00', '2026-03-06 00:36:24.562481+00'),
('3450900a-1972-4a6a-951c-e0a3385e3b8f', '19535d39-de6f-4acd-bbfc-2ba817be7257', 'Cadeira', 'Mobiliário padrão', 'Bom', '2026-03-05 18:59:04.857732+00', '2026-03-05 18:59:04.857732+00'),
('35faba1d-e6ae-4651-805a-1d8037c76dcb', 'c1e7a552-0cba-46f6-b36d-f5a3a79ca0c3', 'Cama', 'Mobiliário padrão', 'Bom', '2026-03-06 00:37:25.917931+00', '2026-03-06 00:37:25.917931+00'),
('361256ff-37cc-4a14-a891-50705504c2b2', 'c1e7a552-0cba-46f6-b36d-f5a3a79ca0c3', 'Cadeira', 'Mobiliário padrão', 'Bom', '2026-03-06 00:37:26.58615+00', '2026-03-06 00:37:26.58615+00'),
('36c1b1a6-8993-4f77-83c7-aae449dec816', '19535d39-de6f-4acd-bbfc-2ba817be7257', 'Guarda-roupa', 'Mobiliário padrão', 'Bom', '2026-03-05 18:59:04.386247+00', '2026-03-05 18:59:04.386247+00'),
('3e13d6e1-0b1c-4544-8a5c-78294968cc71', 'bfafb383-e2c0-48a6-9408-05474258b286', 'Escrivaninha', 'Mobiliário padrão', 'Bom', '2026-03-06 00:39:46.721757+00', '2026-03-06 00:39:46.721757+00'),
('3e4c6a0f-8fbd-43ae-ab43-d248a8c37764', '97c71d2e-1dc4-46c1-a32c-4796f6160cf6', 'Cama', 'Mobiliário padrão', 'Bom', '2026-03-06 00:41:35.443947+00', '2026-03-06 00:41:35.443947+00'),
('542e1ce9-d0aa-45b7-ad3b-805d7eacda28', '2b523237-b456-4d4b-8eb2-1f561efe9c57', 'Cadeira', 'Mobiliário padrão', 'Bom', '2026-03-06 00:35:54.428082+00', '2026-03-06 00:35:54.428082+00'),
('67650eed-85fc-49ce-a519-45c28126a6e8', '97c71d2e-1dc4-46c1-a32c-4796f6160cf6', 'Escrivaninha', 'Mobiliário padrão', 'Bom', '2026-03-06 00:41:35.911371+00', '2026-03-06 00:41:35.911371+00'),
('72319b24-2bb1-4d11-9504-c74344967432', 'bfafb383-e2c0-48a6-9408-05474258b286', 'Cama', 'Mobiliário padrão', 'Bom', '2026-03-06 00:39:46.260904+00', '2026-03-06 00:39:46.260904+00'),
('737b201f-c601-4c53-adcf-4735455c46fe', 'ad0636b3-cbd1-454e-9dbc-214512a1e59e', 'Escrivaninha', 'Mobiliário padrão', 'Bom', '2026-03-06 00:38:04.693745+00', '2026-03-06 00:38:04.693745+00'),
('75452fec-efce-4f3b-ace2-21a7928390f7', 'c1e7a552-0cba-46f6-b36d-f5a3a79ca0c3', 'Guarda-roupa', 'Mobiliário padrão', 'Bom', '2026-03-06 00:37:26.148092+00', '2026-03-06 00:37:26.148092+00'),
('765af83f-1f83-4fda-ae9e-68073d779efd', 'ad0636b3-cbd1-454e-9dbc-214512a1e59e', 'Cadeira', 'Mobiliário padrão', 'Bom', '2026-03-06 00:38:04.930661+00', '2026-03-06 00:38:04.930661+00'),
('785ffc56-11dd-4aad-af85-746cd0004d87', 'bfafb383-e2c0-48a6-9408-05474258b286', 'Guarda-roupa', 'Mobiliário padrão', 'Bom', '2026-03-06 00:39:46.504016+00', '2026-03-06 00:39:46.504016+00'),
('78b30cc1-e0ed-439c-9a02-f91669003891', '2b523237-b456-4d4b-8eb2-1f561efe9c57', 'Guarda-roupa', 'Mobiliário padrão', 'Bom', '2026-03-06 00:35:53.977898+00', '2026-03-06 00:35:53.977898+00'),
('80a8f82b-64a9-4880-9edb-79b7e93d86e2', '944f5427-482b-4597-9e5a-680a20188ee6', 'Cadeira', 'Mobiliário padrão', 'Bom', '2026-03-06 00:36:51.868842+00', '2026-03-06 00:36:51.868842+00'),
('85cb6827-51fb-4866-91ef-003d787f7435', '944f5427-482b-4597-9e5a-680a20188ee6', 'Guarda-roupa', 'Mobiliário padrão', 'Bom', '2026-03-06 00:36:51.388802+00', '2026-03-06 00:36:51.388802+00'),
('873a64de-7c80-4b05-ae48-9d5b092ed813', '19535d39-de6f-4acd-bbfc-2ba817be7257', 'Cama', 'Mobiliário padrão', 'Bom', '2026-03-05 18:59:04.139527+00', '2026-03-05 18:59:04.139527+00'),
('9b266720-6cc0-4440-bbcd-0c249310c387', 'c4a3d74d-104d-49d4-a04b-6b439c0251ee', 'Cama', 'Mobiliário padrão', 'Bom', '2026-03-06 00:36:24.341677+00', '2026-03-06 00:36:24.341677+00'),
('9d30457c-785c-4ddb-a8cb-3221ea8bbaa3', 'bfafb383-e2c0-48a6-9408-05474258b286', 'Cadeira', 'Mobiliário padrão', 'Bom', '2026-03-06 00:39:46.936033+00', '2026-03-06 00:39:46.936033+00'),
('9ef1b2e6-262c-4df8-9e95-b0471afce824', '19535d39-de6f-4acd-bbfc-2ba817be7257', 'Escrivaninha', 'Mobiliário padrão', 'Bom', '2026-03-05 18:59:04.620211+00', '2026-03-05 18:59:04.620211+00'),
('a284c408-6250-4cc1-9d96-beb4a32a0484', '2b523237-b456-4d4b-8eb2-1f561efe9c57', 'Escrivaninha', 'Mobiliário padrão', 'Bom', '2026-03-06 00:35:54.202142+00', '2026-03-05 20:31:46.586933+00'),
('b0b9d837-9d94-4288-b463-f79d7555e4b0', 'c4a3d74d-104d-49d4-a04b-6b439c0251ee', 'Escrivaninha', 'Mobiliário padrão', 'Bom', '2026-03-06 00:36:24.790316+00', '2026-03-06 00:36:24.790316+00'),
('b7a12efe-4ca1-4ae7-ae84-a43e2eee8e00', '2b523237-b456-4d4b-8eb2-1f561efe9c57', 'Cama', 'Mobiliário padrão', 'Bom', '2026-03-06 00:35:53.752126+00', '2026-03-06 00:35:53.752126+00'),
('ba3a744d-0982-4185-812f-a3ab0a0ae3de', '944f5427-482b-4597-9e5a-680a20188ee6', 'Cama', 'Mobiliário padrão', 'Bom', '2026-03-06 00:36:51.159497+00', '2026-03-06 00:36:51.159497+00'),
('ce93f5ac-6b6c-4080-8733-d934d81a6469', '944f5427-482b-4597-9e5a-680a20188ee6', 'Escrivaninha', 'Mobiliário padrão', 'Bom', '2026-03-06 00:36:51.630987+00', '2026-03-06 00:36:51.630987+00'),
('dbf0a3ad-9d5c-4c33-aee4-9c9d0167f999', 'ad0636b3-cbd1-454e-9dbc-214512a1e59e', 'Cama', 'Mobiliário padrão', 'Bom', '2026-03-06 00:38:03.819382+00', '2026-03-06 00:38:03.819382+00'),
('e2ad5276-d560-4cf8-b9af-3ba9b3bc1171', '97c71d2e-1dc4-46c1-a32c-4796f6160cf6', 'Cadeira', 'Mobiliário padrão', 'Bom', '2026-03-06 00:41:36.1358+00', '2026-03-06 00:41:36.1358+00'),
('eca4b61e-669b-4f88-bb6e-7b01e9126cda', 'c1e7a552-0cba-46f6-b36d-f5a3a79ca0c3', 'Escrivaninha', 'Mobiliário padrão', 'Bom', '2026-03-06 00:37:26.367404+00', '2026-03-06 00:37:26.367404+00'),
('f08439e6-e194-4734-821d-38e2ff3b7621', 'c4a3d74d-104d-49d4-a04b-6b439c0251ee', 'Cadeira', 'Mobiliário padrão', 'Bom', '2026-03-06 00:36:25.019662+00', '2026-03-06 00:36:25.019662+00'),
('f2d01040-f643-4b7f-b8ad-86d3762e72bd', '97c71d2e-1dc4-46c1-a32c-4796f6160cf6', 'Guarda-roupa', 'Mobiliário padrão', 'Bom', '2026-03-06 00:41:35.691601+00', '2026-03-06 00:41:35.691601+00');

-- 7. CARGA DE AVISOS
INSERT INTO public.notices (id, title, content, category, author_id, is_pinned, is_general, created_at, updated_at) VALUES
('b25125d7-e188-4546-80f4-db9257154715', 'VPR agora é MoronaVila', 'Teremos mudanças importantes na casa para torna-la mais moderna...', 'Geral', '49858e88-bb1f-4315-afb8-e5835e9aabda', true, true, '2026-03-05 20:31:46.586933+00', '2026-03-05 20:31:46.586933+00');

-- 8. CARGA DE DESCRIÇÃO DA PROPRIEDADE
INSERT INTO public.property_description (id, main_text, main_media, gallery_media, rooms_text, location_text, amenities_text, rules_text) VALUES
('default', 'MORONAVILA é a solução de moradia ideal...', '{"https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=1169&auto=format&fit=crop"}', '{"https://images.unsplash.com/photo-1516321497487-e288fb19713f","https://images.unsplash.com/photo-1522071820081-009f0129c71c","https://images.unsplash.com/photo-1543269865-cbf427effbad"}', 'Quartos funcionais...', 'Vila Isabel...', 'Diversidade de atividades...', 'Mantenha o ambiente bom...');

-- 9. CARGA DE CONDIÇÕES DE ALUGUEL
INSERT INTO public.rental_conditions (id, deposit_months, cleaning_fee_fixed, pro_rata_enabled, rules_summary, calculation_instructions) VALUES
('default', 1, 150.00, true, 'O calção quita o ultimo mes.', 'Insira a data prevista.');

-- 10. REABILITAR RLS E RESETAR ROLE
SET session_replication_role = 'origin';
ALTER TABLE public.residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.furniture ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_description ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_conditions ENABLE ROW LEVEL SECURITY;
