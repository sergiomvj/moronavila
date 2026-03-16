-- =================================================================================
-- SCRIPT DE MIGRAÇÃO MORONAVILA - VERSÃO FINAL VALIDADA
-- Projeto Alvo: uzjbpskyqejiubitjnag (VPR-Manager)
-- Este script limpa a base e restaura os dados reais fornecidos pelo usuário.
-- =================================================================================

-- 0. AJUSTES PRELIMINARES DE ESQUEMA
-- Adiciona photo_url que estava faltando no residents
ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS photo_url text;

-- Remove temporariamente o vínculo com auth.users para permitir a carga sem erros de FK
-- Já que os usuários (auth) do projeto antigo não existem no projeto novo.
ALTER TABLE public.residents DROP CONSTRAINT IF EXISTS residents_auth_id_fkey;

-- 1. LIMPEZA TOTAL (Para garantir sincronia limpa)
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

-- 2. INSERÇÃO DE QUARTOS (rooms)
INSERT INTO public.rooms (id, name, type, capacity, occupied, rent_value, suite, description, cleaning_fee, extras_value, created_at, updated_at, is_common_area, availability_status) VALUES
('19535d39-de6f-4acd-bbfc-2ba817be7257', 'Quarto A', 'Quarto', 1, 0, 900.00, false, 'Quarto privativo confortável', 0.00, 0.00, '2026-03-05 18:59:03', '2026-03-05 18:59:03', false, 'Disponível'),
('2b523237-b456-4d4b-8eb2-1f561efe9c57', 'Quarto B', 'Quarto', 1, 0, 900.00, false, 'Quarto privativo silencioso', 80.00, 0.00, '2026-03-06 00:35:53', '2026-03-06 00:35:53', false, 'Disponível'),
('944f5427-482b-4597-9e5a-680a20188ee6', 'Quarto D', 'Quarto', 1, 0, 900.00, false, 'Quarto privativo arejado', 80.00, 0.00, '2026-03-06 00:36:50', '2026-03-06 00:36:50', false, 'Disponível'),
('97c71d2e-1dc4-46c1-a32c-4796f6160cf6', 'Quarto H', 'Quarto', 1, 0, 900.00, false, 'Quarto privativo mobiliado', 80.00, 0.00, '2026-03-06 00:41:35', '2026-03-06 00:41:35', false, 'Disponível'),
('ad0636b3-cbd1-454e-9dbc-214512a1e59e', 'Quarto F', 'Quarto', 4, 0, 550.00, false, 'Quarto compartilhado', 60.00, 0.00, '2026-03-06 00:38:03', '2026-03-06 00:38:03', false, 'Disponível'),
('bfafb383-e2c0-48a6-9408-05474258b286', 'Quarto G', 'Quarto', 4, 0, 550.00, false, 'Quarto compartilhado amplo', 80.00, 0.00, '2026-03-06 00:39:45', '2026-03-06 00:39:45', false, 'Disponível'),
('c1e7a552-0cba-46f6-b36d-f5a3a79ca0c3', 'Quarto E', 'Quarto', 4, 0, 550.00, false, 'Quarto compartilhado mobiliado', 60.00, 0.00, '2026-03-06 00:37:25', '2026-03-06 00:37:25', false, 'Disponível'),
('c4a3d74d-104d-49d4-a04b-6b439c0251ee', 'Quarto C', 'Quarto', 1, 0, 900.00, false, 'Quarto privativo', 80.00, 0.00, '2026-03-06 00:36:24', '2026-03-06 00:36:24', false, 'Disponível'),
-- Áreas Comuns
('33333333-3333-3333-3333-333333333333', 'Cozinha Comunitária', 'Cozinha', 0, 0, 0, false, 'Área comum equipada', 0, 0, now(), now(), true, 'Disponível');

-- 3. INSERÇÃO DE MORADORES (residents)
-- Link com auth_id removido (auth_id = NULL) para permitir login via Sign Up posterior
INSERT INTO public.residents (
    id, auth_id, name, email, phone, role, status, entry_date, birth_date, cpf, instagram, photo_url, origin_address, work_address, family_address, softphone_enabled
) VALUES 
('49858e88-bb1f-4315-afb8-e5835e9aabda', NULL, 'Sergio Castro', 'sergio@facebrasil.com', '21983245000', 'Administrador', 'Ativo', '2026-03-05', '1962-12-20', 'sergiomvj', 'sergiomvj', 'https://poqlobkzaxrbwqjqxegn.supabase.co/storage/v1/object/public/room-media/profiles/49858e88-bb1f-4315-afb8-e5835e9aabda-0.9444846303956445.png', 'Rua Torres Homem, 886', 'Rua Torres Homem, 886', 'Rua Torres Homem, 886', true),
('da3164d8-6cda-4c26-8a74-22a380a6f8cf', NULL, 'Lena Castro', 'lenapscastro@gmail.com', '21981900803', 'Administrador', 'Ativo', '2026-03-04', '1962-08-30', 'lenapscastro', 'lenapscastro', 'https://poqlobkzaxrbwqjqxegn.supabase.co/storage/v1/object/public/room-media/profiles/da3164d8-6cda-4c26-8a74-22a380a6f8cf-0.9170670447808855.png', 'Rua Torres Homem, 886', 'Rua Torres Homem, 886', 'Rua Torres Homem, 886', true),
('4c5903f1-7d04-4f35-b92b-214dc6539aa1', NULL, 'Victor Castro', 'victor8994@gmail.com', '21 980263599', 'Morador', 'Ativo', '2026-03-07', NULL, NULL, NULL, NULL, NULL, NULL, NULL, true),
('8a8849ee-06eb-4ca5-b860-c2910b6ccca3', NULL, 'Tester', 'test@test.com', '11988887777', 'Morador', 'Ativo', '2026-03-05', NULL, NULL, NULL, NULL, NULL, NULL, NULL, true);

-- 4. INSERÇÃO DE DESCRIÇÃO (property_description)
INSERT INTO public.property_description (id, main_text, main_media, gallery_media, rooms_text, location_text, amenities_text, rules_text) VALUES
('default', 'MORONAVILA é a solução de moradia ideal para quem precisa trabalhar ou estudar. Próximo das principais universidades e do trabalho com comercio farto 24 horas por dia e transporte para todo o Rio de Janeiro.', '{https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=1169&auto=format&fit=crop}', '{https://images.unsplash.com/photo-1516321497487-e288fb19713f,https://images.unsplash.com/photo-1522071820081-009f0129c71c,https://images.unsplash.com/photo-1543269865-cbf427effbad}', 'MoronaVila optou por oferecer quartos simples e funcionais com estrutura minima para descansar, estudar e viver de forma tranquila.', 'No coração de Vila isabel, há 200 metros da Unidos de Vila Isabel e do Shopping Boulevard.', 'Estamos há 100 metros da Unidos de Vila Isabel, a 200 do Shopping Boulevard...', 'Nossa regras poderiam ser sintetizadas numa única: mantenha o ambiente tão bom para os outros quanto você gostaria para si mesmo.');

-- 5. INSERÇÃO DE CONDIÇÕES (rental_conditions)
INSERT INTO public.rental_conditions (id, deposit_months, cleaning_fee_fixed, pro_rata_enabled, rules_summary, calculation_instructions) VALUES
('default', 1, 150.00, true, 'O calção quita o ultimo mes de aluguel após o aviso de saída. O aluguel inclui internet e água.', 'Insira a data prevista de entrada para calcular o primeiro pagamento.');

-- 6. INSERÇÃO DE MÓVEIS (furniture)
INSERT INTO public.furniture (room_id, name, description, condition) VALUES
('ad0636b3-cbd1-454e-9dbc-214512a1e59e', 'Guarda-roupa', 'Mobiliário padrão', 'Bom'),
('c4a3d74d-104d-49d4-a04b-6b439c0251ee', 'Guarda-roupa', 'Mobiliário padrão', 'Bom'),
('19535d39-de6f-4acd-bbfc-2ba817be7257', 'Cama', 'Mobiliário padrão', 'Bom'),
('c4a3d74d-104d-49d4-a04b-6b439c0251ee', 'Cama', 'Mobiliário padrão', 'Bom');

-- 7. INSERÇÃO DE AVISOS (notices)
INSERT INTO public.notices (id, title, content, category, author_id, is_pinned, updated_at) VALUES
('b25125d7-e188-4546-80f4-db9257154715', 'VPR agora é MoronaVila', 'Teremos mudanças importantes na casa para torna-la mais moderna, mais confortável e funcional. Em breve todos saberão.', 'Geral', '49858e88-bb1f-4315-afb8-e5835e9aabda', true, now());

-- 8. RESTAURAR FK (Será recriada apenas quando o usuário houver criado seu login novo no projeto)
-- Por enquanto deixamos sem para não travar a inserção.
