CREATE TABLE notifications (
  notification_id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  user_role VARCHAR(16) NOT NULL,
  title VARCHAR(160) NOT NULL,
  message VARCHAR(500) NOT NULL,
  type VARCHAR(64) NOT NULL,
  related_entity_type VARCHAR(32) NULL,
  related_entity_id BIGINT NULL,
  is_read BIT(1) NOT NULL DEFAULT b'0',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  action_url VARCHAR(255) NULL,
  sender_id BIGINT NULL,
  sender_name VARCHAR(64) NULL,
  PRIMARY KEY (notification_id),
  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES user_accounts (id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_sender
    FOREIGN KEY (sender_id) REFERENCES user_accounts (id) ON DELETE SET NULL
);

CREATE INDEX idx_notifications_user_created
  ON notifications (user_id, created_at);

CREATE INDEX idx_notifications_user_read_created
  ON notifications (user_id, is_read, created_at);
