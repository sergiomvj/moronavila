-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.calendar_event_residents (
  event_id uuid NOT NULL,
  resident_id uuid NOT NULL,
  CONSTRAINT calendar_event_residents_pkey PRIMARY KEY (event_id, resident_id),
  CONSTRAINT calendar_event_residents_resident_id_fkey FOREIGN KEY (resident_id) REFERENCES public.residents(id),
  CONSTRAINT calendar_event_residents_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.calendar_events(id)
);
CREATE TABLE public.calendar_events (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  date date NOT NULL,
  start_time time without time zone,
  end_time time without time zone,
  type text NOT NULL DEFAULT 'Outro'::text CHECK (type = ANY (ARRAY['Limpeza'::text, 'Reunião'::text, 'Festa'::text, 'Manutenção'::text, 'Outro'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT calendar_events_pkey PRIMARY KEY (id)
);
CREATE TABLE public.complaints (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  resident_id uuid,
  title text NOT NULL,
  description text NOT NULL,
  is_anonymous boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT complaints_pkey PRIMARY KEY (id),
  CONSTRAINT complaints_resident_id_fkey FOREIGN KEY (resident_id) REFERENCES public.residents(id)
);
CREATE TABLE public.furniture (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  room_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  condition text NOT NULL DEFAULT 'Bom'::text CHECK (condition = ANY (ARRAY['Novo'::text, 'Bom'::text, 'Regular'::text, 'Ruim'::text])),
  purchase_date date,
  serial_number text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT furniture_pkey PRIMARY KEY (id),
  CONSTRAINT furniture_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id)
);
CREATE TABLE public.maintenance_requests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text NOT NULL,
  room_id uuid,
  requested_by uuid,
  status text NOT NULL DEFAULT 'Aberto'::text CHECK (status = ANY (ARRAY['Aberto'::text, 'Em Andamento'::text, 'Resolvido'::text])),
  cost numeric,
  photo_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT maintenance_requests_pkey PRIMARY KEY (id),
  CONSTRAINT maintenance_requests_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id),
  CONSTRAINT maintenance_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.residents(id)
);
CREATE TABLE public.notice_comments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  notice_id uuid NOT NULL,
  resident_id uuid,
  text text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notice_comments_pkey PRIMARY KEY (id),
  CONSTRAINT notice_comments_notice_id_fkey FOREIGN KEY (notice_id) REFERENCES public.notices(id),
  CONSTRAINT notice_comments_resident_id_fkey FOREIGN KEY (resident_id) REFERENCES public.residents(id)
);
CREATE TABLE public.notices (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'Geral'::text CHECK (category = ANY (ARRAY['Importante'::text, 'Regra'::text, 'Evento'::text, 'Geral'::text])),
  author_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notices_pkey PRIMARY KEY (id),
  CONSTRAINT notices_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.residents(id)
);
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  resident_id uuid NOT NULL,
  amount numeric NOT NULL,
  due_date date NOT NULL,
  payment_date date,
  status text NOT NULL DEFAULT 'Pendente'::text CHECK (status = ANY (ARRAY['Pago'::text, 'Pendente'::text, 'Atrasado'::text])),
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_resident_id_fkey FOREIGN KEY (resident_id) REFERENCES public.residents(id)
);
CREATE TABLE public.property_description (
  id text NOT NULL DEFAULT gen_random_uuid(),
  main_text text DEFAULT ''::text,
  main_media ARRAY DEFAULT '{}'::text[],
  gallery_media ARRAY DEFAULT '{}'::text[],
  rooms_text text DEFAULT ''::text,
  location_text text DEFAULT ''::text,
  location_media ARRAY DEFAULT '{}'::text[],
  amenities_text text DEFAULT ''::text,
  amenities_media ARRAY DEFAULT '{}'::text[],
  rules_text text DEFAULT ''::text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT property_description_pkey PRIMARY KEY (id)
);
CREATE TABLE public.rental_conditions (
  id text NOT NULL DEFAULT 'default'::text,
  property_id uuid,
  deposit_months integer DEFAULT 1,
  cleaning_fee_fixed numeric DEFAULT 0,
  pro_rata_enabled boolean DEFAULT true,
  rules_summary text,
  calculation_instructions text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT rental_conditions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.resident_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  resident_id uuid NOT NULL,
  channel text NOT NULL CHECK (channel = ANY (ARRAY['note'::text, 'voice'::text, 'package'::text])),
  category text NOT NULL DEFAULT 'general'::text CHECK (category = ANY (ARRAY['payment'::text, 'maintenance'::text, 'cleaning'::text, 'admin'::text, 'internet'::text, 'softphone'::text, 'package'::text, 'voice'::text, 'general'::text])),
  title text NOT NULL,
  body text NOT NULL,
  read_at timestamp with time zone,
  resolved_at timestamp with time zone,
  related_entity_type text,
  related_entity_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT resident_messages_pkey PRIMARY KEY (id),
  CONSTRAINT resident_messages_resident_id_fkey FOREIGN KEY (resident_id) REFERENCES public.residents(id)
);
CREATE TABLE public.residents (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  auth_id uuid UNIQUE,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  room_id uuid,
  role text NOT NULL DEFAULT 'Morador'::text CHECK (role = ANY (ARRAY['Administrador'::text, 'Morador'::text])),
  mac_address text,
  internet_active boolean DEFAULT false,
  internet_renewal_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  habilitado boolean NOT NULL DEFAULT true,
  cpf text,
  rg text,
  family_address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  occupation text,
  company text,
  university text,
  course text,
  motivo_bloqueio text,
  birth_date date,
  origin_address text,
  work_address text,
  instagram text,
  status text DEFAULT 'Ativo'::text,
  document_number text,
  mac_address_pc text,
  rent_value numeric DEFAULT 0,
  cleaning_fee numeric DEFAULT 0,
  extras_value numeric DEFAULT 0,
  bed_identifier text,
  softphone_extension text,
  softphone_enabled boolean DEFAULT false,
  softphone_display_name text,
  CONSTRAINT residents_pkey PRIMARY KEY (id),
  CONSTRAINT residents_auth_id_fkey FOREIGN KEY (auth_id) REFERENCES auth.users(id),
  CONSTRAINT fk_residents_room FOREIGN KEY (room_id) REFERENCES public.rooms(id)
);
CREATE TABLE public.room_media (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  room_id uuid NOT NULL,
  url text NOT NULL,
  type text NOT NULL DEFAULT 'image'::text CHECK (type = ANY (ARRAY['image'::text, 'video'::text])),
  storage_path text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT room_media_pkey PRIMARY KEY (id),
  CONSTRAINT room_media_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id)
);
CREATE TABLE public.rooms (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['Quarto'::text, 'Cozinha'::text, 'Sala de Estar'::text, 'Banheiro'::text, 'Lavanderia'::text, 'Outro'::text])),
  capacity integer DEFAULT 1,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_common_area boolean DEFAULT false,
  is_blocked_for_repairs boolean DEFAULT false,
  availability_status text DEFAULT 'Disponível'::text,
  occupied integer DEFAULT 0,
  rent_value numeric DEFAULT 0,
  suite boolean DEFAULT false,
  cleaning_fee numeric DEFAULT 0,
  extras_value numeric DEFAULT 0,
  CONSTRAINT rooms_pkey PRIMARY KEY (id)
);