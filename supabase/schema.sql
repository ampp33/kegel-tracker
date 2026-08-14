-- Run in the Supabase SQL editor.
-- Afterwards: Settings -> API -> Exposed schemas, add `kegel`.

create schema if not exists kegel;

create table if not exists kegel.sessions (
  id           bigint generated always as identity primary key,
  squeeze_s    integer     not null,
  relax_s      integer     not null,
  repititions  integer     not null,
  created_at   timestamptz not null default now()
);

create index if not exists sessions_created_at_idx
  on kegel.sessions (created_at desc);

grant usage on schema kegel to anon;
grant select, insert on kegel.sessions to anon;
grant usage, select on all sequences in schema kegel to anon;

-- The anon key ships inside the client bundle, so RLS is the only real guard.
-- These policies let anyone with the key read and add sessions, but never edit
-- or delete history. Swap to auth-scoped policies if this stops being personal.
alter table kegel.sessions enable row level security;

create policy sessions_anon_select on kegel.sessions
  for select to anon using (true);

create policy sessions_anon_insert on kegel.sessions
  for insert to anon with check (
    squeeze_s between 1 and 300
    and relax_s between 1 and 300
    and repititions between 1 and 200
  );
