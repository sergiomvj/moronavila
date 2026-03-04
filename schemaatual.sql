-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.calendar_event_residents (
  event_id uuid NOT NULL,
  resident_id uuid NOT NULL,
  CONSTRAINT calendar_event_residents_pkey PRIMARY KEY (event_id, resident_id),
  CONSTRAINT calendar_event_residents_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.calendar_events(id),
  CONSTRAINT calendar_event_residents_resident_id_fkey FOREIGN KEY (resident_id) REFERENCES public.residents(id)
);
CREATE TABLE public.calendar_events (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  date date NOT NULL,
  time text NOT NULL,
  location text,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT calendar_events_pkey PRIMARY KEY (id)
);
CREATE TABLE public.complaints (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  resident_id uuid,
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'Em Análise'::text,
  is_anonymous boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT complaints_pkey PRIMARY KEY (id),
  CONSTRAINT complaints_resident_id_fkey FOREIGN KEY (resident_id) REFERENCES public.residents(id)
);
CREATE TABLE public.furniture (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  room_id uuid,
  name text NOT NULL,
  description text,
  condition text,
  purchase_date date,
  serial_number text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT furniture_pkey PRIMARY KEY (id),
  CONSTRAINT furniture_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id)
);
CREATE TABLE public.laundry_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  resident_id uuid NOT NULL,
  date date NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  status text NOT NULL DEFAULT 'Agendado'::text CHECK (status = ANY (ARRAY['Agendado'::text, 'Concluído'::text, 'Cancelado'::text])),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT laundry_schedules_pkey PRIMARY KEY (id),
  CONSTRAINT laundry_schedules_resident_id_fkey FOREIGN KEY (resident_id) REFERENCES public.residents(id)
);
CREATE TABLE public.maintenance_requests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text NOT NULL,
  room_id uuid,
  requested_by uuid,
  status text NOT NULL DEFAULT 'Aberto'::text,
  photo_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT maintenance_requests_pkey PRIMARY KEY (id),
  CONSTRAINT maintenance_requests_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id),
  CONSTRAINT maintenance_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.residents(id)
);
CREATE TABLE public.notice_comments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  notice_id uuid,
  resident_id uuid,
  text text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT notice_comments_pkey PRIMARY KEY (id),
  CONSTRAINT notice_comments_notice_id_fkey FOREIGN KEY (notice_id) REFERENCES public.notices(id),
  CONSTRAINT notice_comments_resident_id_fkey FOREIGN KEY (resident_id) REFERENCES public.residents(id)
);
CREATE TABLE public.notices (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'Normal'::text,
  author_id uuid,
  is_pinned boolean DEFAULT false,
  is_general boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT notices_pkey PRIMARY KEY (id),
  CONSTRAINT notices_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.residents(id)
);
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  resident_id uuid,
  month text NOT NULL,
  amount numeric NOT NULL,
  due_date date NOT NULL,
  payment_date date,
  status text NOT NULL DEFAULT 'Pendente'::text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_resident_id_fkey FOREIGN KEY (resident_id) REFERENCES public.residents(id)
);
CREATE TABLE public.residents (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  auth_id uuid UNIQUE,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  photo_url text,
  instagram text,
  role text NOT NULL DEFAULT 'Morador'::text,
  status text DEFAULT 'Ativo'::text,
  entry_date date,
  birth_date date,
  cpf text,
  document_number text,
  origin_address text,
  work_address text,
  room_id uuid,
  mac_address text,
  internet_active boolean DEFAULT false,
  internet_renewal_date date,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT residents_pkey PRIMARY KEY (id),
  CONSTRAINT residents_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id)
);
CREATE TABLE public.room_media (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  room_id uuid,
  url text NOT NULL,
  type text NOT NULL DEFAULT 'image'::text,
  storage_path text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT room_media_pkey PRIMARY KEY (id),
  CONSTRAINT room_media_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id)
);
CREATE TABLE public.rooms (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  capacity integer NOT NULL DEFAULT 1,
  occupied integer NOT NULL DEFAULT 0,
  rent_value numeric NOT NULL,
  description text,
  suite boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT rooms_pkey PRIMARY KEY (id)
);

CREATE TABLE public.devices (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  resident_id uuid,
  device_type text NOT NULL CHECK (device_type = ANY (ARRAY['Celular'::text, 'Computador'::text, 'Outro'::text])),
  mac_address text NOT NULL,
  ip_address text,
  connected_time text,
  bandwidth_usage numeric,
  status text NOT NULL DEFAULT 'Pendente'::text CHECK (status = ANY (ARRAY['Pendente'::text, 'Ativo'::text, 'Bloqueado'::text])),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT devices_pkey PRIMARY KEY (id),
  CONSTRAINT devices_resident_id_fkey FOREIGN KEY (resident_id) REFERENCES public.residents(id) ON DELETE CASCADE
);