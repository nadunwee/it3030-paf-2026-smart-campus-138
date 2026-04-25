ALTER TABLE ticketing
  ADD COLUMN resource_id BIGINT NULL,
  ADD COLUMN location VARCHAR(255) NULL,
  ADD COLUMN preferred_contact_details VARCHAR(255) NULL,
  ADD COLUMN resolution_notes VARCHAR(4000) NULL,
  ADD COLUMN rejection_reason VARCHAR(1000) NULL;

ALTER TABLE ticketing
  ADD CONSTRAINT fk_ticketing_resource
    FOREIGN KEY (resource_id) REFERENCES facility_resources (id);

CREATE INDEX idx_ticketing_resource
  ON ticketing (resource_id);

CREATE TABLE ticket_attachments (
  attachment_id BIGINT NOT NULL AUTO_INCREMENT,
  ticket_id BIGINT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  content_type VARCHAR(64) NOT NULL,
  data_url LONGTEXT NOT NULL,
  uploaded_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (attachment_id),
  CONSTRAINT fk_ticket_attachments_ticket
    FOREIGN KEY (ticket_id) REFERENCES ticketing (ticket_id) ON DELETE CASCADE
);

CREATE INDEX idx_ticket_attachments_ticket_uploaded
  ON ticket_attachments (ticket_id, uploaded_at);

ALTER TABLE ticket_messages
  ADD COLUMN edited_at DATETIME(6) NULL;
