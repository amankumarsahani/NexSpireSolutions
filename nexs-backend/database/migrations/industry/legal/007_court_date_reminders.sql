-- Idempotency stamp for the court-date reminder worker
-- (nexcrm-backend/services/courtDateReminderWorker.js).
-- SQL mirror of nexcrm-backend/database/migrations/legal/007_court_date_reminders.js.
--
-- Written even when the email send fails: a reminder that retries forever on a
-- broken SMTP config would bury the inbox once it recovers. Same discipline as
-- legal_enquiries.sla_alerted_at and legal_consultations.reminder_sent_at.

ALTER TABLE court_dates
    ADD COLUMN IF NOT EXISTS reminder_sent_at DATETIME DEFAULT NULL;
