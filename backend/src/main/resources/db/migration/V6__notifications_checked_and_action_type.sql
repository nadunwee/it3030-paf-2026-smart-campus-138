ALTER TABLE notifications
  ADD COLUMN action_type VARCHAR(32) NULL AFTER related_entity_id,
  ADD COLUMN checked BIT(1) NOT NULL DEFAULT b'0' AFTER action_type;

UPDATE notifications
SET action_type = CASE type
  WHEN 'BOOKING_REQUEST_SUBMITTED' THEN 'BOOK'
  WHEN 'BOOKING_APPROVAL_REQUIRED' THEN 'BOOK'
  WHEN 'BOOKING_APPROVED' THEN 'APPROVE'
  WHEN 'BOOKING_REJECTED' THEN 'REJECT'
  WHEN 'TICKET_CREATED' THEN 'CREATE'
  WHEN 'TICKET_ADMIN_REPLY' THEN 'REPLY'
  WHEN 'TICKET_STUDENT_REPLY' THEN 'REPLY'
  WHEN 'TICKET_RESOLVED' THEN 'UPDATE'
  WHEN 'TICKET_CLOSED' THEN 'CLOSE'
  ELSE 'SYSTEM'
END,
checked = COALESCE(is_read, b'0');

ALTER TABLE notifications
  MODIFY COLUMN action_type VARCHAR(32) NOT NULL DEFAULT 'SYSTEM';

DROP INDEX idx_notifications_user_read_created ON notifications;

CREATE INDEX idx_notifications_user_checked_created
  ON notifications (user_id, checked, created_at);

ALTER TABLE notifications
  DROP COLUMN is_read;
