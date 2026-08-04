-- Partner-first support routing with escalation to the platform (P4-03, decision D7).
--
-- Routing to the partner needs no work: support_tickets lives in each instance's
-- own master database, and a partner runs a whole isolated instance, so a ticket
-- raised by their tenant already lands in their inbox and never touches ours.
--
-- What is missing is the escalation path. These columns serve BOTH roles, because
-- both run the same codebase:
--
--   On a PARTNER instance   escalated_at / escalation_state track a ticket the
--                           partner has handed up to us.
--   On the MASTER           partner_instance_id / partner_ticket_id mark a ticket
--                           that arrived from a partner rather than from one of
--                           our own tenants.
--
-- The end customer never learns any of this happened: replies always travel back
-- down and are delivered by the partner instance under the partner's own mail
-- identity.

ALTER TABLE support_tickets
    -- Partner instance side
    ADD COLUMN escalated_at DATETIME DEFAULT NULL,
    ADD COLUMN escalation_state ENUM('none','pending','sent','answered','withdrawn')
        NOT NULL DEFAULT 'none',
    ADD COLUMN escalation_reason TEXT DEFAULT NULL,

    -- Master side
    ADD COLUMN partner_instance_id INT DEFAULT NULL,
    ADD COLUMN partner_ticket_id INT DEFAULT NULL,
    ADD COLUMN origin ENUM('direct','partner_escalation') NOT NULL DEFAULT 'direct';

ALTER TABLE support_tickets
    ADD INDEX idx_escalation (escalation_state),
    ADD INDEX idx_partner_instance (partner_instance_id);

-- One master ticket per escalated partner ticket. Without this a retried heartbeat
-- would open a duplicate ticket every time it was redelivered.
ALTER TABLE support_tickets
    ADD UNIQUE KEY uq_partner_ticket (partner_instance_id, partner_ticket_id);

-- Marks a message that crossed the partner boundary, in either direction, so a
-- reply delivered from the platform is not mistaken for one the partner wrote.
ALTER TABLE support_ticket_messages
    ADD COLUMN via_escalation TINYINT(1) NOT NULL DEFAULT 0;
