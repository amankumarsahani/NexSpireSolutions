-- Migration: 042_tenant_workflow_trigger.sql
-- Description: Add tenant_created trigger type to workflows and seed tenant onboarding workflow

-- Add tenant triggers to the workflow trigger_type enum
ALTER TABLE workflows MODIFY COLUMN trigger_type VARCHAR(50) NOT NULL;

-- Seed the Tenant Onboarding workflow
INSERT IGNORE INTO workflows (name, description, is_active, trigger_type, trigger_config)
VALUES (
    'Tenant Onboarding - Send Agreement',
    'Automatically sends the service agreement PDF to new tenants when they are created. Uses the Tenant Agreement document template and the Agreement Email template.',
    TRUE,
    'tenant_created',
    '{}'
);

-- Get the workflow ID we just created
SET @wf_id = LAST_INSERT_ID();

-- Only insert nodes if workflow was actually created (not duplicate)
-- Node 1: Trigger
INSERT INTO workflow_nodes (workflow_id, node_uid, node_type, action_type, label, config, position_x, position_y)
SELECT @wf_id, 'trigger-1', 'trigger', 'tenant_created', 'Tenant Created', '{}', 80, 200
FROM DUAL WHERE @wf_id > 0;

-- Node 2: Send Email with Agreement PDF
INSERT INTO workflow_nodes (workflow_id, node_uid, node_type, action_type, label, config, position_x, position_y)
SELECT @wf_id, 'action-1', 'action', 'send_email', 'Send Agreement Email', 
    JSON_OBJECT(
        'to_email', '{{email}}',
        'subject', 'Service Agreement - NexSpire Solutions | {{plan_name}} Plan',
        'body', CONCAT(
            '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">',
            '<div style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:40px 30px;text-align:center;border-radius:12px 12px 0 0;">',
            '<h1 style="color:white;margin:0;font-size:24px;">NexSpire Solutions</h1>',
            '<p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Service Agreement</p>',
            '</div>',
            '<div style="background:#fff;padding:36px 30px;border:1px solid #e2e8f0;border-top:none;">',
            '<p style="color:#334155;">Dear <strong>{{owner_name}}</strong>,</p>',
            '<p style="color:#334155;">Thank you for choosing <strong>NexSpire Solutions</strong> as your CRM partner. Please find attached your <strong>Service Agreement</strong> for the <strong>{{plan_name}}</strong> plan.</p>',
            '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin:24px 0;">',
            '<p style="margin:0 0 8px;color:#1e293b;font-weight:600;">Plan Details</p>',
            '<p style="margin:4px 0;color:#64748b;font-size:14px;">Plan: <strong style="color:#1e293b;">{{plan_name}}</strong></p>',
            '<p style="margin:4px 0;color:#64748b;font-size:14px;">Price: <strong style="color:#1e293b;">{{plan_price}}</strong></p>',
            '<p style="margin:4px 0;color:#64748b;font-size:14px;">Billing: <strong style="color:#1e293b;">{{plan_billing_cycle}}</strong></p>',
            '</div>',
            '<div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:8px;padding:16px;margin:24px 0;">',
            '<p style="margin:0;color:#4338ca;font-size:14px;"><strong>Agreement attached as PDF.</strong> Please review and keep a copy for your records.</p>',
            '</div>',
            '<p style="color:#334155;">If you have any questions, do not hesitate to contact us.</p>',
            '<p style="color:#334155;">Best regards,<br><strong>NexSpire Solutions Team</strong></p>',
            '</div>',
            '<div style="text-align:center;padding:20px;color:#94a3b8;font-size:12px;">',
            '<p>&copy; 2024 NexSpire Solutions. All rights reserved.</p>',
            '</div>',
            '</div>'
        ),
        'document_slug', 'tenant-agreement',
        'attachment_filename', 'NexSpire-Agreement-{{slug}}.pdf'
    ),
    400, 200
FROM DUAL WHERE @wf_id > 0;

-- Node 3: Send notification to admin
INSERT INTO workflow_nodes (workflow_id, node_uid, node_type, action_type, label, config, position_x, position_y)
SELECT @wf_id, 'action-2', 'action', 'send_notification', 'Notify Admin', 
    JSON_OBJECT(
        'title', 'Agreement sent to {{name}}',
        'message', 'Service agreement has been automatically sent to {{email}} for the {{plan_name}} plan.',
        'type', 'info'
    ),
    720, 200
FROM DUAL WHERE @wf_id > 0;

-- Connections: trigger -> send email -> notify admin
INSERT INTO workflow_connections (workflow_id, source_node_id, target_node_id, source_handle)
SELECT @wf_id, 
    (SELECT id FROM workflow_nodes WHERE workflow_id = @wf_id AND node_uid = 'trigger-1'),
    (SELECT id FROM workflow_nodes WHERE workflow_id = @wf_id AND node_uid = 'action-1'),
    'default'
FROM DUAL WHERE @wf_id > 0;

INSERT INTO workflow_connections (workflow_id, source_node_id, target_node_id, source_handle)
SELECT @wf_id,
    (SELECT id FROM workflow_nodes WHERE workflow_id = @wf_id AND node_uid = 'action-1'),
    (SELECT id FROM workflow_nodes WHERE workflow_id = @wf_id AND node_uid = 'action-2'),
    'default'
FROM DUAL WHERE @wf_id > 0;
