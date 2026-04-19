/**
 * Migration: 042 - Tenant Onboarding Workflow
 * Adds tenant_created trigger support and seeds the onboarding workflow
 */

module.exports = async function(connection) {
    // 1. Change trigger_type from ENUM to VARCHAR(50) to support new trigger types
    try {
        await connection.query('ALTER TABLE workflows MODIFY COLUMN trigger_type VARCHAR(50) NOT NULL');
        console.log('   trigger_type changed to VARCHAR(50)');
    } catch (e) {
        console.log('   trigger_type already VARCHAR or alter skipped:', e.message.substring(0, 60));
    }

    // 2. Check if workflow already exists
    const [existing] = await connection.query(
        "SELECT id FROM workflows WHERE name = 'Tenant Onboarding - Send Agreement' LIMIT 1"
    );

    if (existing.length > 0) {
        console.log('   Workflow already exists, skipping seed');
        return;
    }

    // 3. Create workflow
    const [wfResult] = await connection.query(
        `INSERT INTO workflows (name, description, is_active, trigger_type, trigger_config) 
         VALUES (?, ?, TRUE, 'tenant_created', '{}')`,
        [
            'Tenant Onboarding - Send Agreement',
            'Automatically sends the service agreement PDF to new tenants when they are created.'
        ]
    );
    const wfId = wfResult.insertId;
    console.log('   Created workflow ID:', wfId);

    // 4. Email body for the send_email node
    const emailBody = [
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
        '<p>2024 NexSpire Solutions. All rights reserved.</p>',
        '</div>',
        '</div>'
    ].join('');

    // 5. Create nodes
    const [n1] = await connection.query(
        `INSERT INTO workflow_nodes (workflow_id, node_uid, node_type, action_type, label, config, position_x, position_y)
         VALUES (?, 'trigger-1', 'trigger', 'tenant_created', 'Tenant Created', '{}', 80, 200)`,
        [wfId]
    );
    console.log('   Created node: Tenant Created (trigger)');

    const [n2] = await connection.query(
        `INSERT INTO workflow_nodes (workflow_id, node_uid, node_type, action_type, label, config, position_x, position_y)
         VALUES (?, 'action-1', 'action', 'send_email', 'Send Agreement Email', ?, 400, 200)`,
        [wfId, JSON.stringify({
            to_email: '{{email}}',
            subject: 'Service Agreement - NexSpire Solutions | {{plan_name}} Plan',
            body: emailBody,
            document_slug: 'tenant-agreement',
            attachment_filename: 'NexSpire-Agreement-{{slug}}.pdf'
        })]
    );
    console.log('   Created node: Send Agreement Email (with PDF attachment)');

    const [n3] = await connection.query(
        `INSERT INTO workflow_nodes (workflow_id, node_uid, node_type, action_type, label, config, position_x, position_y)
         VALUES (?, 'action-2', 'action', 'send_notification', 'Notify Admin', ?, 720, 200)`,
        [wfId, JSON.stringify({
            title: 'Agreement sent to {{name}}',
            message: 'Service agreement has been automatically sent to {{email}} for the {{plan_name}} plan.',
            type: 'info'
        })]
    );
    console.log('   Created node: Notify Admin');

    // 6. Create connections
    await connection.query(
        `INSERT INTO workflow_connections (workflow_id, source_node_id, target_node_id, source_handle)
         VALUES (?, ?, ?, 'default')`,
        [wfId, n1.insertId, n2.insertId]
    );
    await connection.query(
        `INSERT INTO workflow_connections (workflow_id, source_node_id, target_node_id, source_handle)
         VALUES (?, ?, ?, 'default')`,
        [wfId, n2.insertId, n3.insertId]
    );
    console.log('   Created connections: Trigger -> Send Email -> Notify Admin');
};
