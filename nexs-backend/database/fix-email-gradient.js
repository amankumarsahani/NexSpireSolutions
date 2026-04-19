/**
 * Fix: Update the Send Agreement Email node to use solid background instead of gradient
 * Run with: node database/fix-email-gradient.js
 */
const { pool } = require('../config/database');

async function fix() {
    try {
        // Find the Send Agreement Email node
        const [nodes] = await pool.query(
            "SELECT id, config FROM workflow_nodes WHERE label = 'Send Agreement Email' AND action_type = 'send_email'"
        );

        if (nodes.length === 0) {
            console.log('Send Agreement Email node not found.');
            process.exit(0);
        }

        for (const node of nodes) {
            let config = typeof node.config === 'string' ? JSON.parse(node.config) : node.config;
            let body = config.body || '';

            // Fix gradient → solid color
            body = body.replace(/background:linear-gradient\([^)]+\)/g, 'background-color:#4f46e5');
            // Fix rgba white → hex
            body = body.replace(/color:rgba\(255,255,255,0\.85\)/g, 'color:#c7d2fe');
            // Fix color:white → explicit hex
            body = body.replace(/color:white/g, 'color:#ffffff');

            config.body = body;

            await pool.query(
                'UPDATE workflow_nodes SET config = ? WHERE id = ?',
                [JSON.stringify(config), node.id]
            );
            console.log(`Fixed node ID ${node.id}`);
        }

        // Also re-seed the email template
        const fixedBody = `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f1f5f9; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4f46e5; padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; }
        .header p { color: #c7d2fe; margin: 8px 0 0; font-size: 14px; }
        .content { background: #ffffff; padding: 36px 30px; border: 1px solid #e2e8f0; border-top: none; }
        .content p { color: #334155; font-size: 15px; margin-bottom: 16px; }
        .plan-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 24px 0; }
        .plan-box h3 { margin: 0 0 12px; color: #1e293b; font-size: 16px; }
        .plan-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
        .plan-row:last-child { border-bottom: none; }
        .plan-label { color: #64748b; font-size: 14px; }
        .plan-value { color: #1e293b; font-weight: 600; font-size: 14px; }
        .attachment-note { background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 16px; margin: 24px 0; }
        .attachment-note p { margin: 0; color: #4338ca; font-size: 14px; }
        .footer { text-align: center; padding: 24px 20px; color: #94a3b8; font-size: 12px; }
        .footer a { color: #6366f1; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Nexspire Solutions</h1>
            <p>Service Agreement</p>
        </div>
        <div class="content">
            <p>Dear <strong>{{tenant_name}}</strong>,</p>
            <p>Thank you for choosing <strong>Nexspire Solutions</strong> as your CRM partner. We are delighted to welcome you on board.</p>
            <p>Please find attached your <strong>Service Agreement</strong> for the <strong>{{plan_name}}</strong> plan.</p>
            <div class="plan-box">
                <h3>Plan Summary</h3>
                <div class="plan-row"><span class="plan-label">Plan</span><span class="plan-value">{{plan_name}}</span></div>
                <div class="plan-row"><span class="plan-label">Price</span><span class="plan-value">{{plan_price}}</span></div>
                <div class="plan-row"><span class="plan-label">Billing</span><span class="plan-value">{{plan_billing_cycle}}</span></div>
                <div class="plan-row"><span class="plan-label">Start Date</span><span class="plan-value">{{start_date}}</span></div>
                <div class="plan-row"><span class="plan-label">Trial Period</span><span class="plan-value">{{trial_period}}</span></div>
            </div>
            <div class="attachment-note">
                <p><strong>Agreement attached as PDF.</strong> Please review and keep a copy for your records.</p>
            </div>
            <p>If you have any questions about the agreement, please do not hesitate to contact us.</p>
            <p>Best regards,<br><strong>Nexspire Solutions Team</strong></p>
        </div>
        <div class="footer">
            <p>${new Date().getFullYear()} Nexspire Solutions. All rights reserved.</p>
            <p><a href="https://nexspiresolutions.co.in">nexspiresolutions.co.in</a></p>
            <p style="margin-top: 8px;">This email was sent to {{tenant_email}}</p>
        </div>
    </div>
</body>
</html>`;

        await pool.query(
            "UPDATE email_templates SET html_content = ? WHERE name = 'tenant-agreement-email'",
            [fixedBody]
        );
        console.log('Updated email template: tenant-agreement-email');

        console.log('\nDone! Deploy and re-test.');
        process.exit(0);
    } catch (error) {
        console.error('Fix failed:', error.message);
        process.exit(1);
    }
}

fix();
