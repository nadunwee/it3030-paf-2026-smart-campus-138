ALTER TABLE user_accounts
  ADD COLUMN IF NOT EXISTS created_at DATETIME(6) NULL,
  ADD COLUMN IF NOT EXISTS updated_at DATETIME(6) NULL;

UPDATE user_accounts
SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP(6)),
    updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP(6));

ALTER TABLE user_accounts
  MODIFY COLUMN created_at DATETIME(6) NOT NULL,
  MODIFY COLUMN updated_at DATETIME(6) NOT NULL,
  MODIFY COLUMN role VARCHAR(16) NOT NULL;

UPDATE user_accounts
SET role = 'STUDENT'
WHERE role = 'USER';
