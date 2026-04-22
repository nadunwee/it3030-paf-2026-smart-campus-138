ALTER TABLE facility_resources
  ADD COLUMN created_at DATETIME(6) NULL;

UPDATE facility_resources
SET created_at = CURRENT_TIMESTAMP(6)
WHERE created_at IS NULL;

ALTER TABLE facility_resources
  MODIFY COLUMN created_at DATETIME(6) NOT NULL;

CREATE TABLE bookings (
  booking_id BIGINT NOT NULL AUTO_INCREMENT,
  facility_id BIGINT NOT NULL,
  booked_by_user_id BIGINT NOT NULL,
  booked_by_user_name VARCHAR(64) NOT NULL,
  facility_name VARCHAR(255) NOT NULL,
  purpose VARCHAR(500) NOT NULL,
  duration_minutes INT NOT NULL,
  booked_from DATETIME(6) NOT NULL,
  booked_to DATETIME(6) NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  approved_at DATETIME(6) NULL,
  PRIMARY KEY (booking_id),
  CONSTRAINT fk_bookings_facility
    FOREIGN KEY (facility_id) REFERENCES facility_resources (id),
  CONSTRAINT fk_bookings_user
    FOREIGN KEY (booked_by_user_id) REFERENCES user_accounts (id)
);

CREATE INDEX idx_bookings_facility_status_interval
  ON bookings (facility_id, status, booked_from, booked_to);

CREATE INDEX idx_bookings_booked_by_user
  ON bookings (booked_by_user_id);

CREATE INDEX idx_bookings_status
  ON bookings (status);
