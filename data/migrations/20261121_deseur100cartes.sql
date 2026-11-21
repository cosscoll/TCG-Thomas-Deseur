-- Migration applied to the live Floot database on 2026-11-21.
-- The gift code is redeemable once per account (default redemption limit).
ALTER TABLE tcg_pack_history_origin DROP CONSTRAINT IF EXISTS tcg_pack_history_origin_drawn_check;
ALTER TABLE tcg_pack_history_origin ADD CONSTRAINT tcg_pack_history_origin_drawn_check
 CHECK (jsonb_typeof(drawn)='array' AND jsonb_array_length(drawn) IN (5,100));
ALTER TABLE tcg_pack_history_origin DROP CONSTRAINT IF EXISTS tcg_pack_history_origin_artworks_check;
ALTER TABLE tcg_pack_history_origin ADD CONSTRAINT tcg_pack_history_origin_artworks_check
 CHECK (jsonb_typeof(artworks)='array' AND jsonb_array_length(artworks) IN (5,100));
INSERT INTO tcg_gift_codes (code_hash,label,rewards,max_uses,expires_at,created_by)
SELECT '5f8dd880fa4a85fbaa8ca7122b8b9e687dd97a3f0e301bb4c65fea04ac3fede5',
'DESEUR100CARTES — 1 booster de 100 cartes par compte',
'[{"type":"packs","kind":"custom","quantity":1,"rules":{"megaCounts":{"commune":60,"rare":20,"epique":14,"legendaire":5,"hors_serie":1}}}]'::jsonb,
100000,NULL,u.id FROM users u WHERE u.role='admin' ORDER BY u.id LIMIT 1
ON CONFLICT (code_hash) DO UPDATE SET label=EXCLUDED.label,rewards=EXCLUDED.rewards,max_uses=EXCLUDED.max_uses,active=true,expires_at=NULL;
