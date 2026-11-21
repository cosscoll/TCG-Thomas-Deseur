-- Apply to the live Floot PostgreSQL database before distributing DESEUR2026.
-- Allow two redemptions of the same code by one account; the endpoint enforces the limit.
ALTER TABLE tcg_gift_redemptions ADD COLUMN IF NOT EXISTS redemption_number integer NOT NULL DEFAULT 1;
ALTER TABLE tcg_gift_redemptions DROP CONSTRAINT IF EXISTS tcg_gift_redemptions_pkey;
ALTER TABLE tcg_gift_redemptions ADD CONSTRAINT tcg_gift_redemptions_pkey PRIMARY KEY (code_id,user_id,redemption_number);
-- The new composite primary key allows two distinct redemption numbers per account.
-- Create the code using an existing administrator; never invent an admin ID.
INSERT INTO tcg_gift_codes (code_hash,label,rewards,max_uses,expires_at,created_by)
SELECT 'edac1b63847b7a4794f4f51187772be82a84fb3b7ddf51dedb6a7a04b551b169',
       'DESEUR2026 — 2 utilisations',
       '[{"type":"packs","kind":"custom","quantity":1,"rules":{"raritySlots":["epique","epique","epique","legendaire","legendaire"]}}]'::jsonb,
       100000,NULL,u.id
FROM users u WHERE u.role='admin' ORDER BY u.id LIMIT 1
ON CONFLICT (code_hash) DO UPDATE
SET label=EXCLUDED.label,rewards=EXCLUDED.rewards,max_uses=EXCLUDED.max_uses,active=true,expires_at=NULL;
