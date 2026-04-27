create table if not exists guestbook_entries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  body text,
  is_secret boolean not null default false,
  owner_reply text,
  owner_replied_at timestamptz,
  password_salt text,
  password_hash text,
  created_at timestamptz not null default now()
);

alter table guestbook_entries
add column if not exists owner_reply text,
add column if not exists owner_replied_at timestamptz,
add column if not exists password_salt text,
add column if not exists password_hash text;

drop view if exists guestbook_public_entries;

create or replace view guestbook_public_entries
with (security_invoker = false) as
select
  id,
  name,
  case when is_secret then null else body end as body,
  is_secret,
  case when is_secret then null else owner_reply end as owner_reply,
  case when is_secret then null else owner_replied_at end as owner_replied_at,
  owner_reply is not null and length(owner_reply) > 0 as has_owner_reply,
  created_at
from guestbook_entries;

grant select on guestbook_public_entries to anon;

alter table guestbook_entries enable row level security;

drop policy if exists "Anyone can read guestbook entries" on guestbook_entries;
drop policy if exists "Anyone can read guestbook public entries" on guestbook_entries;

drop policy if exists "Anyone can write guestbook entries" on guestbook_entries;

notify pgrst, 'reload schema';
