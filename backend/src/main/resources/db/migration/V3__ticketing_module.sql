CREATE TABLE ticketing (
  ticket_id BIGINT NOT NULL AUTO_INCREMENT,
  student_id BIGINT NOT NULL,
  student_name VARCHAR(64) NOT NULL,
  category VARCHAR(32) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  description VARCHAR(2000) NOT NULL,
  status VARCHAR(16) NOT NULL,
  priority VARCHAR(16) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  closed_at DATETIME(6) NULL,
  assigned_admin_id BIGINT NULL,
  PRIMARY KEY (ticket_id),
  CONSTRAINT fk_ticketing_student
    FOREIGN KEY (student_id) REFERENCES user_accounts (id),
  CONSTRAINT fk_ticketing_assigned_admin
    FOREIGN KEY (assigned_admin_id) REFERENCES user_accounts (id)
);

CREATE TABLE ticket_messages (
  message_id BIGINT NOT NULL AUTO_INCREMENT,
  ticket_id BIGINT NOT NULL,
  sender_id BIGINT NOT NULL,
  sender_name VARCHAR(64) NOT NULL,
  sender_role VARCHAR(16) NOT NULL,
  message_text VARCHAR(4000) NOT NULL,
  sent_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (message_id),
  CONSTRAINT fk_ticket_messages_ticket
    FOREIGN KEY (ticket_id) REFERENCES ticketing (ticket_id) ON DELETE CASCADE,
  CONSTRAINT fk_ticket_messages_sender
    FOREIGN KEY (sender_id) REFERENCES user_accounts (id)
);

CREATE INDEX idx_ticketing_status_category
  ON ticketing (status, category);

CREATE INDEX idx_ticketing_student_updated
  ON ticketing (student_id, updated_at);

CREATE INDEX idx_ticket_messages_ticket_sent
  ON ticket_messages (ticket_id, sent_at);
