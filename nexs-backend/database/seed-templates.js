/**
 * Seed script for document templates
 * Run with: node database/seed-templates.js
 */
const { pool } = require('../config/database');

const templates = [
    {
        name: 'Discovery Call Notes',
        slug: 'discovery-call',
        description: 'Template for documenting discovery call conversations',
        category: 'sales',
        content: `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">
    <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #4f46e5; margin: 0;">Discovery Call Notes</h1>
        <p style="color: #64748b;">{{company_name}} | {{date}}</p>
    </div>
    
    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h3 style="color: #1e293b; margin-top: 0;">Client Information</h3>
        <table style="width: 100%;">
            <tr><td style="color: #64748b; padding: 5px 0;">Contact Name:</td><td style="font-weight: 600;">{{contact_name}}</td></tr>
            <tr><td style="color: #64748b; padding: 5px 0;">Email:</td><td>{{email}}</td></tr>
            <tr><td style="color: #64748b; padding: 5px 0;">Phone:</td><td>{{phone}}</td></tr>
            <tr><td style="color: #64748b; padding: 5px 0;">Company:</td><td>{{company_name}}</td></tr>
        </table>
    </div>
    
    <h3 style="color: #1e293b;">Key Discussion Points</h3>
    <p>{{discussion_points}}</p>
    
    <h3 style="color: #1e293b;">Pain Points Identified</h3>
    <p>{{pain_points}}</p>
    
    <h3 style="color: #1e293b;">Requirements & Goals</h3>
    <p>{{requirements}}</p>
    
    <h3 style="color: #1e293b;">Budget Range</h3>
    <p>{{budget}}</p>
    
    <h3 style="color: #1e293b;">Timeline</h3>
    <p>{{timeline}}</p>
    
    <h3 style="color: #1e293b;">Next Steps</h3>
    <p>{{next_steps}}</p>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
    <p style="color: #64748b; font-size: 12px; text-align: center;">
        Prepared by Nexspire Solutions | {{date}}
    </p>
</div>`,
        variables: ["contact_name", "email", "phone", "company_name", "date", "discussion_points", "pain_points", "requirements", "budget", "timeline", "next_steps"]
    },
    {
        name: 'Project Proposal',
        slug: 'proposal',
        description: 'Professional project proposal template',
        category: 'sales',
        content: `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">
    <div style="background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; padding: 40px; border-radius: 12px; text-align: center; margin-bottom: 40px;">
        <h1 style="margin: 0; font-size: 32px;">Project Proposal</h1>
        <p style="margin: 10px 0 0; opacity: 0.9;">Prepared for {{company_name}}</p>
    </div>
    
    <div style="margin-bottom: 30px;">
        <h2 style="color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Executive Summary</h2>
        <p style="color: #475569; line-height: 1.8;">{{executive_summary}}</p>
    </div>
    
    <div style="margin-bottom: 30px;">
        <h2 style="color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Project Scope</h2>
        <p style="color: #475569; line-height: 1.8;">{{project_scope}}</p>
    </div>
    
    <div style="margin-bottom: 30px;">
        <h2 style="color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Deliverables</h2>
        <p style="color: #475569; line-height: 1.8;">{{deliverables}}</p>
    </div>
    
    <div style="background: #f8fafc; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
        <h2 style="color: #1e293b; margin-top: 0;">Investment</h2>
        <div style="font-size: 36px; color: #4f46e5; font-weight: 700; margin: 20px 0;">{{total_cost}}</div>
        <p style="color: #64748b;">{{payment_terms}}</p>
    </div>
    
    <div style="margin-bottom: 30px;">
        <h2 style="color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Timeline</h2>
        <p style="color: #475569; line-height: 1.8;">{{project_timeline}}</p>
    </div>
    
    <div style="margin-bottom: 30px;">
        <h2 style="color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Why Choose Us</h2>
        <p style="color: #475569; line-height: 1.8;">{{why_us}}</p>
    </div>
    
    <div style="background: #ecfdf5; padding: 30px; border-radius: 12px; text-align: center;">
        <h3 style="color: #059669; margin-top: 0;">Ready to Get Started?</h3>
        <p style="color: #047857;">Contact us at {{our_email}} or reply to this email to proceed.</p>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 40px 0 20px;">
    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
        Nexspire Solutions | Proposal Valid Until: {{valid_until}}
    </p>
</div>`,
        variables: ["contact_name", "company_name", "executive_summary", "project_scope", "deliverables", "total_cost", "payment_terms", "project_timeline", "why_us", "our_email", "valid_until"]
    },
    {
        name: 'Client Onboarding Document',
        slug: 'onboarding',
        description: 'Welcome and onboarding instructions for new clients',
        category: 'operations',
        content: `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">
    <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 40px; border-radius: 12px; text-align: center; margin-bottom: 40px;">
        <h1 style="margin: 0; font-size: 32px;">🎉 Welcome Aboard!</h1>
        <p style="margin: 10px 0 0; opacity: 0.9;">Hi {{contact_name}}, we're thrilled to have you!</p>
    </div>
    
    <div style="margin-bottom: 30px;">
        <h2 style="color: #1e293b;">Getting Started</h2>
        <p style="color: #475569; line-height: 1.8;">Welcome to Nexspire Solutions! We're excited to begin our partnership with {{company_name}}. This document will guide you through our onboarding process.</p>
    </div>
    
    <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin-bottom: 30px;">
        <h3 style="color: #1e293b; margin-top: 0;">📋 Your Project Details</h3>
        <table style="width: 100%;">
            <tr><td style="color: #64748b; padding: 8px 0;">Project:</td><td style="font-weight: 600;">{{project_name}}</td></tr>
            <tr><td style="color: #64748b; padding: 8px 0;">Start Date:</td><td>{{start_date}}</td></tr>
            <tr><td style="color: #64748b; padding: 8px 0;">Your Account Manager:</td><td>{{account_manager}}</td></tr>
            <tr><td style="color: #64748b; padding: 8px 0;">Contact Email:</td><td>{{manager_email}}</td></tr>
        </table>
    </div>
    
    <div style="margin-bottom: 30px;">
        <h2 style="color: #1e293b;">📝 What We Need From You</h2>
        <p style="color: #475569; line-height: 1.8;">{{requirements_from_client}}</p>
    </div>
    
    <div style="margin-bottom: 30px;">
        <h2 style="color: #1e293b;">🚀 Next Steps</h2>
        <p style="color: #475569; line-height: 1.8;">{{next_steps}}</p>
    </div>
    
    <div style="margin-bottom: 30px;">
        <h2 style="color: #1e293b;">📞 Communication</h2>
        <p style="color: #475569; line-height: 1.8;">{{communication_channels}}</p>
    </div>
    
    <div style="background: #fef3c7; padding: 20px; border-radius: 12px; border-left: 4px solid #f59e0b;">
        <h4 style="color: #92400e; margin-top: 0;">⚡ Quick Tip</h4>
        <p style="color: #78350f; margin-bottom: 0;">Save this email for future reference. You can always reach out to us at {{support_email}} for any questions.</p>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 40px 0 20px;">
    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
        Nexspire Solutions | Let's build something amazing together!
    </p>
</div>`,
        variables: ["contact_name", "company_name", "project_name", "start_date", "account_manager", "manager_email", "requirements_from_client", "next_steps", "communication_channels", "support_email"]
    },
    {
        name: 'Non-Disclosure Agreement',
        slug: 'nda',
        description: 'Standard NDA for confidential information protection',
        category: 'legal',
        content: `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">
    <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #1e293b; margin: 0;">NON-DISCLOSURE AGREEMENT</h1>
        <p style="color: #64748b;">Confidential Information Protection</p>
    </div>
    
    <p style="color: #475569; line-height: 1.8;">
        This Non-Disclosure Agreement ("Agreement") is entered into as of <strong>{{effective_date}}</strong> by and between:
    </p>
    
    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Disclosing Party:</strong> Nexspire Solutions</p>
        <p style="margin: 10px 0 0;"><strong>Receiving Party:</strong> {{company_name}} ("{{contact_name}}")</p>
    </div>
    
    <h3 style="color: #1e293b;">1. Purpose</h3>
    <p style="color: #475569; line-height: 1.8;">{{purpose}}</p>
    
    <h3 style="color: #1e293b;">2. Definition of Confidential Information</h3>
    <p style="color: #475569; line-height: 1.8;">
        "Confidential Information" means any non-public information disclosed by either party, including but not limited to business plans, technical data, trade secrets, customer information, and financial information.
    </p>
    
    <h3 style="color: #1e293b;">3. Obligations</h3>
    <p style="color: #475569; line-height: 1.8;">
        The Receiving Party agrees to: (a) hold Confidential Information in strict confidence; (b) not disclose to third parties without prior written consent; (c) use Confidential Information only for the Purpose stated above.
    </p>
    
    <h3 style="color: #1e293b;">4. Term</h3>
    <p style="color: #475569; line-height: 1.8;">
        This Agreement shall remain in effect for a period of <strong>{{term_years}} years</strong> from the Effective Date.
    </p>
    
    <h3 style="color: #1e293b;">5. Return of Information</h3>
    <p style="color: #475569; line-height: 1.8;">
        Upon termination or request, the Receiving Party shall promptly return or destroy all Confidential Information.
    </p>
    
    <div style="margin-top: 50px;">
        <div style="display: inline-block; width: 45%;">
            <p style="border-top: 1px solid #1e293b; padding-top: 10px; margin-top: 60px;">
                <strong>Nexspire Solutions</strong><br>
                <span style="color: #64748b;">Date: {{effective_date}}</span>
            </p>
        </div>
        <div style="display: inline-block; width: 45%; margin-left: 8%;">
            <p style="border-top: 1px solid #1e293b; padding-top: 10px; margin-top: 60px;">
                <strong>{{company_name}}</strong><br>
                <span style="color: #64748b;">Date: _______________</span>
            </p>
        </div>
    </div>
</div>`,
        variables: ["contact_name", "company_name", "effective_date", "purpose", "term_years"]
    },
    {
        name: 'Invoice',
        slug: 'invoice',
        description: 'Professional invoice template',
        category: 'finance',
        content: `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; background: white;">
    <div style="margin-bottom: 40px; overflow: hidden;">
        <div style="float: left;">
            <h1 style="color: #4f46e5; margin: 0; font-size: 28px;">INVOICE</h1>
            <p style="color: #64748b; margin: 5px 0;">Invoice #: {{invoice_number}}</p>
            <p style="color: #64748b; margin: 5px 0;">Date: {{invoice_date}}</p>
            <p style="color: #64748b; margin: 5px 0;">Due Date: {{due_date}}</p>
        </div>
        <div style="float: right; text-align: right;">
            <h2 style="color: #1e293b; margin: 0;">Nexspire Solutions</h2>
            <p style="color: #64748b; margin: 5px 0;">{{our_address}}</p>
            <p style="color: #64748b; margin: 5px 0;">{{our_email}}</p>
        </div>
        <div style="clear: both;"></div>
    </div>
    
    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h4 style="color: #64748b; margin: 0 0 10px; font-size: 12px; text-transform: uppercase;">Bill To</h4>
        <p style="margin: 0; font-weight: 600; color: #1e293b;">{{contact_name}}</p>
        <p style="margin: 5px 0; color: #475569;">{{company_name}}</p>
        <p style="margin: 5px 0; color: #475569;">{{client_email}}</p>
    </div>
    
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
            <tr style="background: #4f46e5; color: white;">
                <th style="padding: 12px; text-align: left;">Description</th>
                <th style="padding: 12px; text-align: center;">Qty</th>
                <th style="padding: 12px; text-align: right;">Rate</th>
                <th style="padding: 12px; text-align: right;">Amount</th>
            </tr>
        </thead>
        <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 15px 12px;">{{item_description}}</td>
                <td style="padding: 15px 12px; text-align: center;">{{quantity}}</td>
                <td style="padding: 15px 12px; text-align: right;">{{rate}}</td>
                <td style="padding: 15px 12px; text-align: right;">{{amount}}</td>
            </tr>
        </tbody>
    </table>
    
    <div style="text-align: right;">
        <div style="width: 250px; display: inline-block; text-align: left;">
            <div style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                <span style="color: #64748b;">Subtotal</span>
                <span style="float: right;">{{subtotal}}</span>
            </div>
            <div style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                <span style="color: #64748b;">Tax ({{tax_rate}})</span>
                <span style="float: right;">{{tax_amount}}</span>
            </div>
            <div style="padding: 12px 0; font-size: 18px; font-weight: 700; color: #4f46e5;">
                <span>Total</span>
                <span style="float: right;">{{total_amount}}</span>
            </div>
        </div>
    </div>
    
    <div style="margin-top: 40px; padding: 20px; background: #ecfdf5; border-radius: 8px;">
        <h4 style="color: #059669; margin: 0 0 10px;">Payment Instructions</h4>
        <p style="color: #047857; margin: 0;">{{payment_instructions}}</p>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 40px 0 20px;">
    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
        Thank you for your business! | Nexspire Solutions
    </p>
</div>`,
        variables: ["invoice_number", "invoice_date", "due_date", "our_address", "our_email", "contact_name", "company_name", "client_email", "item_description", "quantity", "rate", "amount", "subtotal", "tax_rate", "tax_amount", "total_amount", "payment_instructions"]
    },
    {
        name: 'Project Completion & Offboarding',
        slug: 'offboarding',
        description: 'Project completion summary and handover document',
        category: 'operations',
        content: `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">
    <div style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 40px; border-radius: 12px; text-align: center; margin-bottom: 40px;">
        <h1 style="margin: 0; font-size: 32px;">🎊 Project Complete!</h1>
        <p style="margin: 10px 0 0; opacity: 0.9;">Congratulations, {{contact_name}}!</p>
    </div>
    
    <div style="margin-bottom: 30px;">
        <h2 style="color: #1e293b;">Project Summary</h2>
        <p style="color: #475569; line-height: 1.8;">We are pleased to inform you that your project with Nexspire Solutions has been successfully completed.</p>
    </div>
    
    <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin-bottom: 30px;">
        <h3 style="color: #1e293b; margin-top: 0;">📋 Project Details</h3>
        <table style="width: 100%;">
            <tr><td style="color: #64748b; padding: 8px 0;">Project Name:</td><td style="font-weight: 600;">{{project_name}}</td></tr>
            <tr><td style="color: #64748b; padding: 8px 0;">Client:</td><td>{{company_name}}</td></tr>
            <tr><td style="color: #64748b; padding: 8px 0;">Start Date:</td><td>{{start_date}}</td></tr>
            <tr><td style="color: #64748b; padding: 8px 0;">Completion Date:</td><td>{{completion_date}}</td></tr>
        </table>
    </div>
    
    <div style="margin-bottom: 30px;">
        <h2 style="color: #1e293b;">✅ Deliverables Completed</h2>
        <p style="color: #475569; line-height: 1.8;">{{deliverables_completed}}</p>
    </div>
    
    <div style="margin-bottom: 30px;">
        <h2 style="color: #1e293b;">📦 Handover Items</h2>
        <p style="color: #475569; line-height: 1.8;">{{handover_items}}</p>
    </div>
    
    <div style="margin-bottom: 30px;">
        <h2 style="color: #1e293b;">🔐 Access & Credentials</h2>
        <p style="color: #475569; line-height: 1.8;">{{access_credentials}}</p>
    </div>
    
    <div style="margin-bottom: 30px;">
        <h2 style="color: #1e293b;">📞 Ongoing Support</h2>
        <p style="color: #475569; line-height: 1.8;">{{support_details}}</p>
    </div>
    
    <div style="background: #fef3c7; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
        <h4 style="color: #92400e; margin: 0 0 10px;">💬 We Value Your Feedback!</h4>
        <p style="color: #78350f; margin: 0;">Please take a moment to share your experience. Your feedback helps us improve!</p>
    </div>
    
    <div style="background: #ecfdf5; padding: 25px; border-radius: 12px; text-align: center;">
        <h3 style="color: #059669; margin-top: 0;">Thank You for Choosing Nexspire Solutions!</h3>
        <p style="color: #047857; margin-bottom: 0;">We hope to work with you again in the future. Contact us anytime at {{support_email}}</p>
    </div>
</div>`,
        variables: ["contact_name", "company_name", "project_name", "start_date", "completion_date", "deliverables_completed", "handover_items", "access_credentials", "support_details", "support_email"]
    },
    {
        name: 'Tenant Service Agreement',
        slug: 'tenant-agreement',
        description: 'Service agreement for NexCRM SaaS tenants',
        category: 'legal',
        isDefault: true,
        content: `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 60px 50px; color: #1e293b; line-height: 1.7;">
    <!-- Letterhead -->
    <div style="border-bottom: 3px solid #4f46e5; padding-bottom: 30px; margin-bottom: 40px;">
        <table style="width: 100%;">
            <tr>
                <td style="vertical-align: top;">
                    <div style="width: 48px; height: 48px; background: #4f46e5; border-radius: 10px; display: inline-block; text-align: center; line-height: 48px;">
                        <span style="color: #ffffff; font-size: 22px; font-weight: bold;">N</span>
                    </div>
                    <span style="font-size: 22px; font-weight: 700; color: #1e293b; margin-left: 12px; vertical-align: middle;">NexSpire Solutions</span>
                </td>
                <td style="text-align: right; vertical-align: top; color: #64748b; font-size: 13px;">
                    NexSpire Solutions Pvt. Ltd.<br>
                    {{business_address}}<br>
                    support@nexspiresolutions.co.in
                </td>
            </tr>
        </table>
    </div>

    <!-- Title -->
    <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #1e293b; font-size: 28px; margin: 0; letter-spacing: 2px;">SERVICE AGREEMENT</h1>
        <p style="color: #64748b; font-size: 14px; margin: 10px 0 0;">Agreement No: AGR-{{tenant_slug}}-{{agreement_date}}</p>
        <p style="color: #64748b; font-size: 14px; margin: 5px 0 0;">Date: {{agreement_date}}</p>
    </div>

    <!-- Parties -->
    <div style="margin-bottom: 35px;">
        <h2 style="color: #4f46e5; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">1. PARTIES</h2>
        <p style="margin: 15px 0;">This Service Agreement ("Agreement") is entered into between:</p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #4f46e5;">
            <p style="margin: 0 0 10px;"><strong>Provider:</strong> NexSpire Solutions Pvt. Ltd. ("NexSpire", "Provider")</p>
            <p style="margin: 0;">Address: {{business_address}}</p>
        </div>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #10b981;">
            <p style="margin: 0 0 10px;"><strong>Client:</strong> {{tenant_name}} ("Client")</p>
            <p style="margin: 0 0 5px;">Company: {{tenant_company}}</p>
            <p style="margin: 0 0 5px;">Email: {{tenant_email}}</p>
            <p style="margin: 0;">Phone: {{tenant_phone}}</p>
        </div>
    </div>

    <!-- Scope of Services -->
    <div style="margin-bottom: 35px;">
        <h2 style="color: #4f46e5; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">2. SCOPE OF SERVICES</h2>
        <p>The Provider agrees to provide the Client with access to the NexCRM SaaS platform, which includes:</p>
        <ul style="padding-left: 20px; color: #475569;">
            <li style="margin-bottom: 8px;">Cloud-hosted CRM dashboard with full feature access per the selected plan</li>
            <li style="margin-bottom: 8px;">Customer-facing storefront with e-commerce capabilities</li>
            <li style="margin-bottom: 8px;">RESTful API access for integrations and custom development</li>
            <li style="margin-bottom: 8px;">Automated database provisioning and process management</li>
            <li style="margin-bottom: 8px;">SSL certificates and subdomain configuration</li>
            <li style="margin-bottom: 8px;">Email and notification services</li>
            <li style="margin-bottom: 8px;">Technical support via email during business hours</li>
        </ul>
    </div>

    <!-- Service Plan Details -->
    <div style="margin-bottom: 35px;">
        <h2 style="color: #4f46e5; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">3. SERVICE PLAN DETAILS</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <thead>
                <tr style="background: #4f46e5; color: white;">
                    <th style="padding: 12px 16px; text-align: left; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Detail</th>
                    <th style="padding: 12px 16px; text-align: left; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Value</th>
                </tr>
            </thead>
            <tbody>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 12px 16px; color: #64748b;">Plan Name</td>
                    <td style="padding: 12px 16px; font-weight: 600;">{{plan_name}}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
                    <td style="padding: 12px 16px; color: #64748b;">Price</td>
                    <td style="padding: 12px 16px; font-weight: 600;">{{plan_price}}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 12px 16px; color: #64748b;">Billing Cycle</td>
                    <td style="padding: 12px 16px; font-weight: 600;">{{plan_billing_cycle}}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
                    <td style="padding: 12px 16px; color: #64748b;">Tenant Identifier</td>
                    <td style="padding: 12px 16px; font-family: monospace;">{{tenant_slug}}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Term & Renewal -->
    <div style="margin-bottom: 35px;">
        <h2 style="color: #4f46e5; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">4. TERM AND RENEWAL</h2>
        <p><strong>Effective Date:</strong> {{start_date}}</p>
        <p><strong>Trial Period:</strong> {{trial_period}}</p>
        <p>Following the trial period, this Agreement shall automatically renew at the end of each billing cycle ({{plan_billing_cycle}}) unless either party provides written notice of termination at least 15 days before the end of the current billing period.</p>
    </div>

    <!-- Payment Terms -->
    <div style="margin-bottom: 35px;">
        <h2 style="color: #4f46e5; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">5. PAYMENT TERMS</h2>
        <ul style="padding-left: 20px; color: #475569;">
            <li style="margin-bottom: 8px;">Billing shall occur on a {{plan_billing_cycle}} basis at the rate of {{plan_price}}.</li>
            <li style="margin-bottom: 8px;">Payment is due within 7 days of invoice issuance.</li>
            <li style="margin-bottom: 8px;">Accepted payment methods: Razorpay (UPI, Cards, Net Banking, Wallets).</li>
            <li style="margin-bottom: 8px;">Late payments exceeding 15 days may result in service suspension.</li>
            <li style="margin-bottom: 8px;">A reactivation fee may apply for accounts suspended due to non-payment.</li>
        </ul>
    </div>

    <!-- Data & Privacy -->
    <div style="margin-bottom: 35px;">
        <h2 style="color: #4f46e5; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">6. DATA AND PRIVACY</h2>
        <ul style="padding-left: 20px; color: #475569;">
            <li style="margin-bottom: 8px;"><strong>Data Ownership:</strong> All data uploaded, created, or managed by the Client within the platform remains the sole property of the Client.</li>
            <li style="margin-bottom: 8px;"><strong>Data Security:</strong> The Provider implements industry-standard encryption (TLS/SSL), secure database isolation per tenant, and regular automated backups.</li>
            <li style="margin-bottom: 8px;"><strong>Data Processing:</strong> The Provider processes Client data solely for the purpose of delivering the contracted services.</li>
            <li style="margin-bottom: 8px;"><strong>Data Export:</strong> The Client may request a full export of their data at any time during or within 30 days after the termination of this Agreement.</li>
            <li style="margin-bottom: 8px;"><strong>Data Deletion:</strong> Upon termination and after the 30-day grace period, all Client data will be permanently deleted from the Provider's systems.</li>
        </ul>
    </div>

    <!-- Confidentiality -->
    <div style="margin-bottom: 35px;">
        <h2 style="color: #4f46e5; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">7. CONFIDENTIALITY</h2>
        <p>Both parties agree to maintain the confidentiality of all proprietary information exchanged during the course of this Agreement. Neither party shall disclose confidential information to third parties without prior written consent, except as required by law. This obligation survives termination of this Agreement for a period of 2 years.</p>
    </div>

    <!-- Termination -->
    <div style="margin-bottom: 35px;">
        <h2 style="color: #4f46e5; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">8. TERMINATION</h2>
        <p>Either party may terminate this Agreement:</p>
        <ul style="padding-left: 20px; color: #475569;">
            <li style="margin-bottom: 8px;">With 15 days written notice before the end of the current billing period.</li>
            <li style="margin-bottom: 8px;">Immediately, if the other party materially breaches this Agreement and fails to cure within 10 days of written notice.</li>
            <li style="margin-bottom: 8px;">The Provider may suspend services immediately if the Client violates acceptable use policies or engages in illegal activity.</li>
        </ul>
        <p>Upon termination, the Client's access will be revoked, and data will be retained for 30 days before permanent deletion.</p>
    </div>

    <!-- Limitation of Liability -->
    <div style="margin-bottom: 35px;">
        <h2 style="color: #4f46e5; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">9. LIMITATION OF LIABILITY</h2>
        <p>To the maximum extent permitted by applicable law:</p>
        <ul style="padding-left: 20px; color: #475569;">
            <li style="margin-bottom: 8px;">The Provider's total liability shall not exceed the total fees paid by the Client in the 3 months preceding the claim.</li>
            <li style="margin-bottom: 8px;">The Provider shall not be liable for any indirect, incidental, special, or consequential damages.</li>
            <li style="margin-bottom: 8px;">The Provider does not guarantee 100% uptime but commits to a 99.5% availability target.</li>
        </ul>
    </div>

    <!-- Governing Law -->
    <div style="margin-bottom: 35px;">
        <h2 style="color: #4f46e5; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">10. GOVERNING LAW</h2>
        <p>This Agreement shall be governed by and construed in accordance with the laws of India. Any disputes arising from this Agreement shall be subject to the exclusive jurisdiction of the courts in the Provider's registered state.</p>
    </div>

    <!-- Custom Terms -->
    <div style="margin-bottom: 35px;">
        <h2 style="color: #4f46e5; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">11. ADDITIONAL TERMS</h2>
        <p>{{custom_terms}}</p>
    </div>

    <!-- Acceptance / Signature Blocks -->
    <div style="margin-bottom: 40px; margin-top: 50px;">
        <h2 style="color: #4f46e5; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">12. ACCEPTANCE</h2>
        <p>By signing below, both parties acknowledge that they have read, understood, and agree to be bound by the terms and conditions set forth in this Agreement.</p>

        <table style="width: 100%; margin-top: 40px;">
            <tr>
                <td style="width: 45%; vertical-align: top;">
                    <div style="border-bottom: 1px solid #1e293b; padding-bottom: 8px; margin-bottom: 10px; min-height: 60px;"></div>
                    <p style="margin: 0; font-weight: 700; color: #1e293b;">NexSpire Solutions Pvt. Ltd.</p>
                    <p style="margin: 4px 0; color: #64748b; font-size: 13px;">Authorized Signatory (Provider)</p>
                    <p style="margin: 4px 0; color: #64748b; font-size: 13px;">Date: {{agreement_date}}</p>
                </td>
                <td style="width: 10%;"></td>
                <td style="width: 45%; vertical-align: top;">
                    <div style="border-bottom: 1px solid #1e293b; padding-bottom: 8px; margin-bottom: 10px; min-height: 60px;"></div>
                    <p style="margin: 0; font-weight: 700; color: #1e293b;">{{tenant_name}}</p>
                    <p style="margin: 4px 0; color: #64748b; font-size: 13px;">Authorized Signatory (Client)</p>
                    <p style="margin: 4px 0; color: #64748b; font-size: 13px;">Date: _______________</p>
                </td>
            </tr>
        </table>
    </div>

    <!-- Footer -->
    <div style="border-top: 2px solid #e2e8f0; padding-top: 20px; margin-top: 50px; text-align: center;">
        <p style="color: #64748b; font-size: 12px; margin: 0;">NexSpire Solutions Pvt. Ltd. | support@nexspiresolutions.co.in | nexspiresolutions.co.in</p>
        <p style="color: #94a3b8; font-size: 11px; margin: 8px 0 0;">This document is a legally binding agreement. Please retain a copy for your records.</p>
    </div>
</div>`,
        variables: ["tenant_name", "tenant_email", "tenant_phone", "tenant_company", "tenant_slug", "plan_name", "plan_price", "plan_billing_cycle", "start_date", "agreement_date", "trial_period", "business_address", "custom_terms"]
    }
];

async function seedTemplates() {
    console.log('Seeding document templates...');

    for (const template of templates) {
        try {
            // Check if template already exists
            const [existing] = await pool.query('SELECT id FROM document_templates WHERE slug = ?', [template.slug]);

            if (existing.length > 0) {
                console.log(`  ⏭️  Template "${template.name}" already exists, skipping...`);
                continue;
            }

            await pool.query(
                `INSERT INTO document_templates (name, slug, description, category, content, variables, isDefault) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [template.name, template.slug, template.description, template.category, template.content, JSON.stringify(template.variables), true]
            );
            console.log(`  ✅ Added template: ${template.name}`);
        } catch (error) {
            console.error(`  ❌ Error adding ${template.name}:`, error.message || error);
        }
    }

    console.log('\nSeeding complete!');
    process.exit(0);
}

seedTemplates().catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
