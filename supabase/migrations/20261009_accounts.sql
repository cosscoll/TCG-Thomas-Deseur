-- V0.2: fondations des comptes joueurs; migration PROPOSÉE, NON APPLIQUÉE.
-- Appliquer à un projet Supabase de développement après validation du projet.
-- Jamais de service_role ni de mot de passe dans GitHub Pages.
begin;
create table if not exists public.player_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Joueur'
    check (char_length(display_name) between 2 and 24),
  created_at timestamptz not null default now()
);
create table if not exists public.player_solo_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  played integer not null default 0 check (played >= 0),
  wins integer not null default 0 check (wins >= 0),
  losses integer not null default 0 check (losses >= 0),
  updated_at timestamptz not null default now(),
  constraint player_progress_total check (played = wins + losses)
);
alter table public.player_profiles enable row level security;
alter table public.player_solo_progress enable row level security;

-- Le profil est privé par défaut (une future liste publique devra être distincte).
drop policy if exists player_profiles_read_self on public.player_profiles;
create policy player_profiles_read_self
  on public.player_profiles for select to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists player_profiles_update_self on public.player_profiles;
create policy player_profiles_update_self
  on public.player_profiles for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
drop policy if exists player_progress_read_self on public.player_solo_progress;
create policy player_progress_read_self
  on public.player_solo_progress for select to authenticated
  using (user_id = (select auth.uid()));

-- PAS de politique d'INSERT/UPDATE pour la progression depuis un client:
-- les victoires et récompenses devront être enregistrées côté serveur après
-- validation d'une partie, jamais en faisant confiance à localStorage.
revoke all on public.player_profiles from anon;
revoke all on public.player_solo_progress from anon;
grant select, update on public.player_profiles to authenticated;
grant select on public.player_solo_progress to authenticated;

create or replace function public.create_player_account_rows()
returns trigger language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.player_profiles (user_id, display_name)
  values (new.id, left(coalesce(nullif(btrim(new.raw_user_meta_data->>'username'),''),'Joueur'),24));
  insert into public.player_solo_progress (user_id) values (new.id);
  return new;
end;
$$;
revoke all on function public.create_player_account_rows() from public, anon, authenticated;
drop trigger if exists create_player_account_rows on auth.users;
create trigger create_player_account_rows after insert on auth.users
  for each row execute function public.create_player_account_rows();
commit;
