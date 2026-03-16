-- SCRIPT DE MIGRAÇÃO FINAL (CSV -> SQL)
-- Certifique-se de estar no projeto uzjbpskyqejiubitjnag (VPR-Manager)

-- 1. Limpeza de dados de teste
TRUNCATE TABLE furniture CASCADE;
TRUNCATE TABLE residents CASCADE;
TRUNCATE TABLE rooms CASCADE;
TRUNCATE TABLE notices CASCADE;
TRUNCATE TABLE property_description CASCADE;

-- 2. Inserindo Quartos (rooms)
INSERT INTO rooms (id, name, capacity, occupied, rent_value, description, suite, created_at, updated_at, type, cleaning_fee, extras_value) VALUES
('19535d39-de6f-4acd-bbfc-2ba817be7257', 'Quarto A', 1, 0, 900.00, NULL, false, '2026-03-05 18:59:03.867', '2026-03-05 18:59:03.867', 'Quarto', 0, 0.00),
('2b523237-b456-4d4b-8eb2-1f561efe9c57', 'Quarto B', 1, 0, 900.00, NULL, false, '2026-03-06 00:35:53.438', '2026-03-06 00:35:53.438', 'Quarto', 80, 0.00),
('944f5427-482b-4597-9e5a-680a20188ee6', 'Quarto D', 1, 0, 900.00, NULL, false, '2026-03-06 00:36:50.923', '2026-03-06 00:36:50.923', 'Quarto', 80, 0.00),
('97c71d2e-1dc4-46c1-a32c-4796f6160cf6', 'Quarto H', 1, 0, 900.00, NULL, false, '2026-03-06 00:41:35.167', '2026-03-06 00:41:35.167', 'Quarto', 80, 0.00),
('ad0636b3-cbd1-454e-9dbc-214512a1e59e', 'Quarto F', 4, 0, 550.00, NULL, false, '2026-03-06 00:38:03.184', '2026-03-06 00:38:03.184', 'Quarto', 60, 0.00),
('bfafb383-e2c0-48a6-9408-05474258b286', 'Quarto G', 4, 0, 550.00, NULL, false, '2026-03-06 00:39:45.678', '2026-03-06 00:39:45.678', 'Quarto', 80, 0.00),
('c1e7a552-0cba-46f6-b36d-f5a3a79ca0c3', 'Quarto E', 4, 0, 550.00, NULL, false, '2026-03-06 00:37:25.298', '2026-03-06 00:37:25.298', 'Quarto', 60, 0.00),
('c4a3d74d-104d-49d4-a04b-6b439c0251ee', 'Quarto C', 1, 0, 900.00, NULL, false, '2026-03-06 00:36:24.101', '2026-03-06 00:36:24.101', 'Quarto', 80, 0.00);

-- 3. Inserindo Descrição da Propriedade (property_description)
INSERT INTO property_description (id, main_text, main_media, gallery_media, rooms_text, location_text, amenities_text, rules_text) VALUES
('default', 'MORONAVILA é a solução de moradia ideal para quem precisa trabalhar ou estudar...', '{https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=1169&auto=format&fit=crop}', '{https://images.unsplash.com/photo-1516321497487-e288fb19713f,https://images.unsplash.com/photo-1522071820081-009f0129c71c,https://images.unsplash.com/photo-1543269865-cbf427effbad}', 'MoronaVila optou por oferecer quartos simples e funcionais...', 'No coração de Vila isabel...', 'Estamos há 100 metros da Unidos de Vila Isabel...', 'Nossa regras poderiam ser sintetizadas numa única...');

-- 4. Inserindo Moradores (residents)
INSERT INTO residents (id, auth_id, name, email, phone, role, status, entry_date, birth_date, instagram, photo_url, softphone_enabled, occupation, company, university, course) VALUES
('49858e88-bb1f-4315-afb8-e5835e9aabda', '62a5d1b4-2ac3-42d6-8c7b-765f530c0d6a', 'Sergio Castro', 'sergio@facebrasil.com', '21983245000', 'Administrador', 'Ativo', '2026-03-05', '1962-12-20', 'sergiomvj', '...', true, 'Empresário', 'Facebrasil', NULL, NULL),
('da3164d8-6cda-4c26-8a74-22a380a6f8cf', '7eb9d2b1-0db1-4590-a75e-97eec6395818', 'Lena Castro', 'lenapscastro@gmail.com', '21981900803', 'Administrador', 'Ativo', '2026-03-04', '1962-08-30', 'lenapscastro', '...', true, NULL, NULL, NULL, NULL),
('4c5903f1-7d04-4f35-b92b-214dc6539aa1', 'fa2714b4-4552-4a45-8754-da95930db728', 'Victor Castro', 'victor8994@gmail.com', '21 980263599', 'Morador', 'Ativo', '2026-03-07', NULL, NULL, NULL, true, NULL, NULL, NULL, NULL);

-- 5. Inserindo Móveis (furniture)
INSERT INTO furniture (id, room_id, name, description, condition, created_at, updated_at) VALUES
('1b35754b-c19a-4163-a7e1-b39d9b5f313d', 'ad0636b3-cbd1-454e-9dbc-214512a1e59e', 'Guarda-roupa', 'Mobiliário padrão', 'Bom', '2026-03-06 00:38:04', '2026-03-06 00:38:04'),
('27ce3052-25e6-4855-93a0-395f8f312919', 'c4a3d74d-104d-49d4-a04b-6b439c0251ee', 'Guarda-roupa', 'Mobiliário padrão', 'Bom', '2026-03-06 00:36:24', '2026-03-06 00:36:24');

-- 6. Inserindo Avisos (notices)
INSERT INTO notices (id, title, content, category, author_id, is_pinned, is_general, created_at, updated_at) VALUES
('b25125d7-e188-4546-80f4-db9257154715', 'VPR agora é MoronaVila', 'Teremos mudanças importantes na casa...', 'Geral', '49858e88-bb1f-4315-afb8-e5835e9aabda', true, true, '2026-03-05 20:31:46', '2026-03-05 20:31:46');
