CREATE TABLE IF NOT EXISTS user_accounts (
  id BIGINT NOT NULL AUTO_INCREMENT,
  username VARCHAR(64) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(16) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_accounts_username (username)
);

CREATE TABLE IF NOT EXISTS facility_resources (
  id BIGINT NOT NULL AUTO_INCREMENT,
  type VARCHAR(64) NOT NULL,
  capacity INT NOT NULL,
  location VARCHAR(255) NOT NULL,
  status VARCHAR(64) NOT NULL,
  deleted BIT(1) NOT NULL DEFAULT b'0',
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS availability_windows (
  id BIGINT NOT NULL AUTO_INCREMENT,
  start_datetime DATETIME(6) NOT NULL,
  end_datetime DATETIME(6) NOT NULL,
  resource_id BIGINT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_availability_windows_resource (resource_id),
  CONSTRAINT fk_availability_windows_resource
    FOREIGN KEY (resource_id) REFERENCES facility_resources (id)
);
