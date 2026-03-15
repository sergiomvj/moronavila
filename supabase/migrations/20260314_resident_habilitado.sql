alter table public.residents
add column if not exists habilitado boolean not null default true;

update public.residents
set habilitado = true
where habilitado is null;
