-- Budget Illimité TCG — V0.2, comptes joueurs et sauvegarde DECK uniquement.
-- Ne pas exécuter avant d'avoir sélectionné le bon projet Supabase.
-- Les statistiques de combat, inventaires, boosters, monnaies et classements
-- NE DOIVENT PAS être écrits par le navigateur : serveur autoritaire requis.

begin;

create table if not exists public.player_decks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  cards text[] not null,
  updated_at timestamptz not null default now(),
  constraint valid_deck_count check (cardinality(cards) = 8)
);

alter table public.player_decks enable row level security;

revoke all on public.player_decks from anon;
grant select, insert, update, delete on public.player_decks to authenticated;

drop policy if exists "players_read_own_deck" on public.player_decks;
create policy "players_read_own_deck" on public.player_decks
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "players_insert_own_deck" on public.player_decks;
create policy "players_insert_own_deck" on public.player_decks
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "players_update_own_deck" on public.player_decks;
create policy "players_update_own_deck" on public.player_decks
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "players_delete_own_deck" on public.player_decks;
create policy "players_delete_own_deck" on public.player_decks
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.set_player_deck_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end
$$;

drop trigger if exists player_deck_updated_at on public.player_decks;
create trigger player_deck_updated_at
before update on public.player_decks
for each row
execute function public.set_player_deck_updated_at();

commit;
