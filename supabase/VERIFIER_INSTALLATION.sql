-- À lancer APRÈS le script 20261009_tcg_accounts_collection.sql
-- Contrôle en lecture seule : n'insère, ne supprime et ne modifie rien.
select
  (select count(*) from public.tcg_card_catalog) as cartes_au_catalogue,
  to_regclass('public.tcg_player_profiles') is not null as table_profils,
  to_regclass('public.tcg_player_cards') is not null as table_collection,
  to_regclass('public.tcg_player_pack_state') is not null as table_boosters,
  to_regclass('public.tcg_player_pack_history') is not null as table_historique,
  to_regprocedure('public.tcg_bootstrap_player()') is not null as fonction_creer_compte,
  to_regprocedure('public.tcg_claim_daily_booster()') is not null as fonction_booster,
  (select count(*) from pg_catalog.pg_class
   where oid in (
     'public.tcg_player_profiles'::regclass,
     'public.tcg_player_cards'::regclass,
     'public.tcg_player_pack_state'::regclass,
     'public.tcg_player_pack_history'::regclass
   ) and relrowsecurity) = 4 as rls_active_sur_4_tables;
-- Résultat attendu : 49 cartes et TRUE pour chacune des 7 vérifications.
