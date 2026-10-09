-- DRAFT ONLY. Apply to a verified development Supabase project first.
-- Prototype rule: 1 free booster of 5 cards per 24 hours, 5th rare or better.
-- Do not deploy without a reviewed anti-abuse/rate-limiting plan and economy approval.
-- Never trust browser-side demo collection or browser-reported combat results.
begin;

create table if not exists public.tcg_card_catalog (
  card_id text primary key,
  rarity text not null check (rarity in ('commune','rare','epique','legendaire','secrete'))
);
insert into public.tcg_card_catalog(card_id,rarity) values
  ('standupper', 'commune'),
  ('matelas', 'commune'),
  ('rituels', 'commune'),
  ('filtre', 'commune'),
  ('costume', 'commune'),
  ('touriste', 'commune'),
  ('polystyrene', 'commune'),
  ('amixem', 'commune'),
  ('sacrifice_capillaire', 'commune'),
  ('loft_quitte', 'commune'),
  ('moderateur', 'commune'),
  ('chiffon', 'commune'),
  ('301vues', 'commune'),
  ('oeufpoule', 'commune'),
  ('choipeau', 'commune'),
  ('tuktuk', 'commune'),
  ('soeur_amixem', 'commune'),
  ('fontaine', 'rare'),
  ('fauxbras', 'rare'),
  ('infiltre', 'rare'),
  ('arnaque', 'rare'),
  ('regent', 'rare'),
  ('noble', 'rare'),
  ('loft_rejoint', 'rare'),
  ('planque', 'rare'),
  ('sosies', 'rare'),
  ('goudurix', 'rare'),
  ('psy', 'rare'),
  ('popcorn', 'rare'),
  ('cape_invisibilite', 'rare'),
  ('judo', 'rare'),
  ('secret_youtube', 'rare'),
  ('etalon', 'epique'),
  ('igne', 'epique'),
  ('vilebrequin', 'epique'),
  ('otage', 'epique'),
  ('bgsi', 'epique'),
  ('jones', 'epique'),
  ('dictateur', 'epique'),
  ('vieux_contentieux', 'epique'),
  ('boycott', 'epique'),
  ('horcruxe', 'epique'),
  ('mouette', 'legendaire'),
  ('moules', 'legendaire'),
  ('crossover_mcfly', 'legendaire'),
  ('poudlard_titan', 'legendaire'),
  ('chemise', 'secrete'),
  ('entite', 'secrete'),
  ('display_jdg', 'secrete')
on conflict(card_id) do update set rarity=excluded.rarity;
alter table public.tcg_card_catalog enable row level security;
drop policy if exists tcg_catalog_read on public.tcg_card_catalog;
create policy tcg_catalog_read on public.tcg_card_catalog
 for select to anon,authenticated using (true);
revoke all on public.tcg_card_catalog from public;
grant select on public.tcg_card_catalog to anon,authenticated;

create table if not exists public.tcg_player_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default 'Joueur'
   check (char_length(display_name) between 3 and 30),
 created_at timestamptz not null default now()
);
create table if not exists public.tcg_player_cards (
 user_id uuid not null references auth.users(id) on delete cascade,
 card_id text not null references public.tcg_card_catalog(card_id),
 quantity integer not null check (quantity >= 1 and quantity <= 100000),
 primary key(user_id,card_id)
);
create table if not exists public.tcg_player_pack_state (
 user_id uuid primary key references auth.users(id) on delete cascade,
 next_available_at timestamptz not null default '-infinity'::timestamptz,
 opened_count integer not null default 0 check(opened_count >= 0)
);
create table if not exists public.tcg_player_pack_history (
 id bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 opened_at timestamptz not null default now(),
 cards jsonb not null check(jsonb_typeof(cards) = 'array')
);
create index if not exists tcg_player_pack_history_user_time
 on public.tcg_player_pack_history(user_id,opened_at desc);

alter table public.tcg_player_profiles enable row level security;
alter table public.tcg_player_cards enable row level security;
alter table public.tcg_player_pack_state enable row level security;
alter table public.tcg_player_pack_history enable row level security;

drop policy if exists tcg_read_profile on public.tcg_player_profiles;
create policy tcg_read_profile on public.tcg_player_profiles
 for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists tcg_update_profile on public.tcg_player_profiles;
create policy tcg_update_profile on public.tcg_player_profiles
 for update to authenticated using(user_id=(select auth.uid()))
 with check(user_id=(select auth.uid()));
drop policy if exists tcg_read_cards on public.tcg_player_cards;
create policy tcg_read_cards on public.tcg_player_cards
 for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists tcg_read_pack_state on public.tcg_player_pack_state;
create policy tcg_read_pack_state on public.tcg_player_pack_state
 for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists tcg_read_pack_history on public.tcg_player_pack_history;
create policy tcg_read_pack_history on public.tcg_player_pack_history
 for select to authenticated using(user_id=(select auth.uid()));

revoke all on public.tcg_player_profiles from public,anon,authenticated;
revoke all on public.tcg_player_cards from public,anon,authenticated;
revoke all on public.tcg_player_pack_state from public,anon,authenticated;
revoke all on public.tcg_player_pack_history from public,anon,authenticated;
grant select on public.tcg_player_profiles to authenticated;
grant update(display_name) on public.tcg_player_profiles to authenticated;
grant select on public.tcg_player_cards to authenticated;
grant select on public.tcg_player_pack_state to authenticated;
grant select on public.tcg_player_pack_history to authenticated;

-- Database-owned bootstrap: the client cannot grant itself cards.
create or replace function public.tcg_bootstrap_player()
returns trigger
language plpgsql security definer set search_path=''
as $$
declare
 raw_name text;
begin
 raw_name := btrim(coalesce(new.raw_user_meta_data->>'display_name',''));
 if char_length(raw_name) < 3 then raw_name := 'Joueur'; end if;
 insert into public.tcg_player_profiles(user_id,display_name)
 values(new.id,left(raw_name,30))
 on conflict(user_id) do nothing;
 insert into public.tcg_player_pack_state(user_id)
 values(new.id) on conflict(user_id) do nothing;
 return new;
end
$$;
revoke all on function public.tcg_bootstrap_player() from public,anon,authenticated;
drop trigger if exists tcg_after_user_signup on auth.users;
create trigger tcg_after_user_signup after insert on auth.users
for each row execute function public.tcg_bootstrap_player();

-- Server-authoritative, atomic pack claim.
-- The function is granted only to authenticated users and never accepts
-- card IDs, payout values, user IDs or timestamps from the browser.
create or replace function public.tcg_claim_daily_booster()
returns jsonb
language plpgsql volatile security definer
set search_path=''
as $$
declare
 v_user uuid := (select auth.uid());
 v_next timestamptz;
 v_choice text;
 v_card text;
 v_roll integer;
 v_index integer;
 v_draw jsonb := '[]'::jsonb;
begin
 if v_user is null then
   raise exception 'authentication_required' using errcode='28000';
 end if;
 insert into public.tcg_player_pack_state(user_id)
 values(v_user) on conflict(user_id) do nothing;
 select next_available_at into v_next
 from public.tcg_player_pack_state
 where user_id=v_user for update;
 if clock_timestamp() < v_next then
   raise exception 'booster_not_yet_available' using errcode='P0001';
 end if;

 for v_index in 1..5 loop
   -- gen_random_uuid() uses a cryptographically strong server source.
   -- Normalised rates: normal 55/27/12/4/2, final rare+ 27/12/4/2.
   v_roll := (('x'||substr(replace(pg_catalog.gen_random_uuid()::text,'-',''),1,8))::bit(32)::bigint
       % case when v_index=5 then 45 else 100 end)::integer;
   if v_index = 5 then
     v_choice := case
       when v_roll<27 then 'rare'
       when v_roll<39 then 'epique'
       when v_roll<43 then 'legendaire'
       else 'secrete' end;
   else
     v_choice := case
       when v_roll<55 then 'commune'
       when v_roll<82 then 'rare'
       when v_roll<94 then 'epique'
       when v_roll<98 then 'legendaire'
       else 'secrete' end;
   end if;

   select card_id into v_card from public.tcg_card_catalog
   where rarity=v_choice
   order by pg_catalog.gen_random_uuid()
   limit 1;
   if v_card is null then
     raise exception 'card_catalog_incomplete' using errcode='P0001';
   end if;
   insert into public.tcg_player_cards(user_id,card_id,quantity)
     values(v_user,v_card,1)
     on conflict(user_id,card_id)
       do update set quantity=public.tcg_player_cards.quantity+1;
   v_draw := v_draw || jsonb_build_array(jsonb_build_object('id',v_card,'rarity',v_choice));
 end loop;
 update public.tcg_player_pack_state
 set next_available_at=clock_timestamp()+interval '24 hours',
     opened_count=opened_count+1
 where user_id=v_user
 returning next_available_at into v_next;
 insert into public.tcg_player_pack_history(user_id,cards)
 values(v_user,v_draw);
 return jsonb_build_object('cards',v_draw,'next_available_at',v_next);
end
$$;
revoke all on function public.tcg_claim_daily_booster() from public,anon,authenticated;
grant execute on function public.tcg_claim_daily_booster() to authenticated;
commit;
