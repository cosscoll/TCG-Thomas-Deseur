-- Apply to the live Floot PostgreSQL database before distributing DESEUR2026.
-- Allow two redemptions of the same code by one account; the endpoint enforces the limit.
DO $$
DECLARE c record;
BEGIN
 FOR c IN SELECT conname FROM pg_constraint
  WHERE conrelid='tcg_gift_redemptions'::regclass AND contype='u'
    AND (SELECT array_agg(att.attname ORDER BY att.attname)
         FROM unnest(conkey) AS k(attnum)
         JOIN pg_attribute att ON att.attrelid='tcg_gift_redemptions'::regclass AND att.attnum=k.attnum)
      = ARRAY['code_id','user_id']::text[]
 LOOP
  EXECUTE format('ALTER TABLE tcg_gift_redemptions DROP CONSTRAINT %I',c.conname);
 END LOOP;
END $$;
-- A primary key covering code_id/user_id would also need a separate schema change.
-- Create the code using an existing administrator; never invent an admin ID.
INSERT INTO tcg_gift_codes (code_hash,label,rewards,max_uses,expires_at,created_by)
SELECT 'edac1b63847b7a4794f4f51187772be82a84fb3b7ddf51dedb6a7a04b551b169',
       'DESEUR2026 — 2 utilisations',
       '[{"type":"packs","kind":"custom","quantity":1,"rules":{"raritySlots":["epique","epique","epique","legendaire","legendaire"]}}]'::jsonb,
       100000,NULL,u.id
FROM users u WHERE u.role='admin' ORDER BY u.id LIMIT 1
ON CONFLICT (code_hash) DO UPDATE
SET label=EXCLUDED.label,rewards=EXCLUDED.rewards,max_uses=EXCLUDED.max_uses,active=true,expires_at=NULL;
