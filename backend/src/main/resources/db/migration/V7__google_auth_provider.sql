ALTER TABLE user_accounts
  ADD COLUMN auth_provider VARCHAR(16) NOT NULL DEFAULT 'LOCAL' AFTER password_hash,
  ADD COLUMN google_sub VARCHAR(128) NULL AFTER auth_provider,
  ADD COLUMN email VARCHAR(255) NULL AFTER google_sub;

UPDATE user_accounts
SET auth_provider = 'LOCAL'
WHERE auth_provider IS NULL OR auth_provider = '';

ALTER TABLE user_accounts
  ADD UNIQUE KEY uk_user_accounts_google_sub (google_sub);
