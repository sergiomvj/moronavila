create table if not exists public.resident_messages (
    id uuid primary key default gen_random_uuid(),
    resident_id uuid not null references public.residents(id) on delete cascade,
    channel text not null check (channel in ('note', 'voice', 'package')),
    category text not null default 'general' check (
        category in ('payment', 'maintenance', 'cleaning', 'admin', 'internet', 'softphone', 'package', 'voice', 'general')
    ),
    title text not null,
    body text not null,
    read_at timestamptz null,
    resolved_at timestamptz null,
    related_entity_type text null,
    related_entity_id text null,
    metadata jsonb null default '{}'::jsonb,
    created_at timestamptz not null default timezone('utc', now())
);

create index if not exists resident_messages_resident_created_idx
    on public.resident_messages (resident_id, created_at desc);

create index if not exists resident_messages_resident_channel_idx
    on public.resident_messages (resident_id, channel, read_at, resolved_at);
