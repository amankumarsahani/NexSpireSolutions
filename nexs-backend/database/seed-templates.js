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
        Prepared by Napnix | {{date}}
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
        Napnix | Proposal Valid Until: {{valid_until}}
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
        <p style="color: #475569; line-height: 1.8;">Welcome to Napnix! We're excited to begin our partnership with {{company_name}}. This document will guide you through our onboarding process.</p>
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
        Napnix | Let's build something amazing together!
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
        <p style="margin: 0;"><strong>Disclosing Party:</strong> Napnix</p>
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
                <strong>Napnix</strong><br>
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
            <h2 style="color: #1e293b; margin: 0;">Napnix</h2>
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
        Thank you for your business! | Napnix
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
        <p style="color: #475569; line-height: 1.8;">We are pleased to inform you that your project with Napnix has been successfully completed.</p>
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
        <h3 style="color: #059669; margin-top: 0;">Thank You for Choosing Napnix!</h3>
        <p style="color: #047857; margin-bottom: 0;">We hope to work with you again in the future. Contact us anytime at {{support_email}}</p>
    </div>
</div>`,
        variables: ["contact_name", "company_name", "project_name", "start_date", "completion_date", "deliverables_completed", "handover_items", "access_credentials", "support_details", "support_email"]
    },
    {
        name: 'Tenant Service Agreement',
        slug: 'tenant-agreement',
        description: 'Service agreement for Napnix SaaS tenants',
        category: 'legal',
        isDefault: true,
        content: `<div style="font-family: 'Times New Roman', Times, serif; margin: 0 auto; color: #14110d; line-height: 1.62; font-size: 13.5px; background: #fdfbf5; border: 3px double #14110d; padding: 0;">
  <div style="border-left: 2px solid #8a1c1c; margin-left: 26px; padding: 34px 40px 30px 26px;">

    <!-- Letterhead -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
        <tr>
            <td style="vertical-align: top; padding: 0;">
                <div style="font-size: 21px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase;">Napnix</div>
                <div style="font-size: 11.5px; letter-spacing: 1.4px; text-transform: uppercase; color: #4a423a; margin-top: 3px;">{{business_address}}</div>
                <div style="font-size: 11.5px; letter-spacing: 1.4px; text-transform: uppercase; color: #4a423a;">support@napnix.in &nbsp;&middot;&nbsp; napnix.in</div>
            </td>
            <td style="vertical-align: top; width: 120px; padding: 0;">
                <!-- Engraved company seal ring. Deliberately NOT the State Emblem
                     of India or the Ashoka Chakra: their use by a private entity is
                     restricted under the State Emblem of India (Prohibition of
                     Improper Use) Act, 2005 and the Emblems and Names (Prevention
                     of Improper Use) Act, 1950. -->
                <div style="width: 104px; height: 104px; border: 2px solid #8a1c1c; border-radius: 50%; margin-left: auto; position: relative;">
                    <div style="position: absolute; top: 6px; left: 6px; right: 6px; bottom: 6px; border: 1px solid #8a1c1c; border-radius: 50%;"></div>
                    <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; text-align: center; padding-top: 34px; color: #8a1c1c;">
                        <div style="font-size: 13px; font-weight: 700; letter-spacing: 2.4px; text-transform: uppercase;">Napnix</div>
                        <div style="font-size: 7.5px; letter-spacing: 1.6px; text-transform: uppercase; margin-top: 3px;">Common Seal</div>
                        <div style="font-size: 7px; letter-spacing: 1.2px; text-transform: uppercase; margin-top: 1px;">India</div>
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <div style="border-top: 2px solid #14110d; border-bottom: 1px solid #14110d; height: 4px; margin: 12px 0 22px;"></div>

    <!-- Instrument title -->
    <div style="text-align: center; margin-bottom: 24px;">
        <div style="font-size: 27px; font-weight: 700; letter-spacing: 6px; text-transform: uppercase;">Service Agreement</div>
        <div style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #6b6157; margin-top: 6px;">Executed under the laws of India</div>
        <table style="width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 12px;">
            <tr>
                <td style="border: 1px solid #14110d; padding: 6px 10px; text-align: left; width: 50%;"><strong>Agreement No.:</strong> AGR-{{tenant_slug}}-{{agreement_date}}</td>
                <td style="border: 1px solid #14110d; padding: 6px 10px; text-align: left;"><strong>Date of Execution:</strong> {{agreement_date}}</td>
            </tr>
        </table>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 26px;">
        <tr>
            <td style="width: 50%; vertical-align: top; border: 1px solid #14110d; padding: 12px;">
                <div style="font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">Provider</div>
                <div><strong>Napnix</strong></div>
                <div>{{business_address}}</div>
                <div>support@napnix.in</div>
            </td>
            <td style="width: 50%; vertical-align: top; border: 1px solid #14110d; padding: 12px;">
                <div style="font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">Client</div>
                <div><strong>{{tenant_company}}</strong></div>
                <div>Authorized Representative: {{tenant_name}}</div>
                <div>Email: {{tenant_email}}</div>
                <div>Phone: {{tenant_phone}}</div>
            </td>
        </tr>
    </table>

    <p style="text-align: justify; margin-bottom: 16px;">
        This Service Agreement ("Agreement") is made and executed on <strong>{{agreement_date}}</strong> by and between
        <strong>Napnix</strong>, hereinafter referred to as the "Provider", and <strong>{{tenant_company}}</strong>,
        acting through its authorized representative <strong>{{tenant_name}}</strong>, hereinafter referred to as the "Client".
        The Provider and the Client are individually referred to as a "Party" and collectively as the "Parties".
    </p>

    <div style="margin-bottom: 18px;">
        <div style="font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">Recitals</div>
        <p style="text-align: justify; margin: 0 0 8px;">Whereas, the Provider is engaged in the business of offering hosted software, customer relationship management systems, storefront tools, and related digital infrastructure services;</p>
        <p style="text-align: justify; margin: 0 0 8px;">Whereas, the Client desires to obtain access to such services for its internal business operations and customer management requirements, subject to the terms and conditions set forth herein;</p>
        <p style="text-align: justify; margin: 0;">Now, therefore, in consideration of the mutual covenants and promises contained herein, the Parties agree as follows:</p>
    </div>

    <div style="margin-bottom: 18px;">
        <div style="font-weight: 700; text-transform: uppercase; letter-spacing: 2px; font-size: 12.5px; border-bottom: 1px solid #14110d; padding-bottom: 5px; margin-bottom: 10px;">1. Definitions</div>
        <p style="text-align: justify; margin: 0 0 8px;"><strong>1.1 "Services"</strong> means access to the Napnix hosted SaaS platform and allied services made available under the selected plan.</p>
        <p style="text-align: justify; margin: 0 0 8px;"><strong>1.2 "Platform"</strong> means the software environment, administrative dashboard, storefront, APIs, hosting stack, and supporting infrastructure maintained by the Provider.</p>
        <p style="text-align: justify; margin: 0;"><strong>1.3 "Client Data"</strong> means all records, files, customer information, business information, and other materials submitted to or generated within the Platform by or on behalf of the Client.</p>
    </div>

    <div style="margin-bottom: 18px;">
        <div style="font-weight: 700; text-transform: uppercase; letter-spacing: 2px; font-size: 12.5px; border-bottom: 1px solid #14110d; padding-bottom: 5px; margin-bottom: 10px;">2. Engagement and Scope of Services</div>
        <p style="text-align: justify; margin: 0 0 8px;">The Provider hereby agrees to grant the Client a limited, non-exclusive, non-transferable, and revocable right to access and use the Platform during the subsistence of this Agreement, strictly in accordance with the selected subscription plan and the lawful business purposes of the Client.</p>
        <p style="text-align: justify; margin: 0 0 8px;">The Services under this Agreement include, to the extent applicable to the subscribed plan:</p>
        <ol style="margin: 0; padding-left: 22px;">
            <li style="margin-bottom: 6px;">Cloud-hosted CRM dashboard and tenant environment.</li>
            <li style="margin-bottom: 6px;">Customer-facing storefront and public web experience.</li>
            <li style="margin-bottom: 6px;">API and automation support features made available within the subscribed plan.</li>
            <li style="margin-bottom: 6px;">Tenant provisioning, subdomain setup, SSL enablement, and technical onboarding support.</li>
            <li style="margin-bottom: 6px;">Reasonable email-based support during business hours.</li>
        </ol>
    </div>

    <div style="margin-bottom: 18px;">
        <div style="font-weight: 700; text-transform: uppercase; letter-spacing: 2px; font-size: 12.5px; border-bottom: 1px solid #14110d; padding-bottom: 5px; margin-bottom: 10px;">3. Commercial Terms</div>
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="border: 1px solid #14110d; padding: 8px; font-weight: 700; width: 38%;">Plan Name</td>
                <td style="border: 1px solid #14110d; padding: 8px;">{{plan_name}}</td>
            </tr>
            <tr>
                <td style="border: 1px solid #14110d; padding: 8px; font-weight: 700;">Subscription Fee</td>
                <td style="border: 1px solid #14110d; padding: 8px;">{{plan_price}}</td>
            </tr>
            <tr>
                <td style="border: 1px solid #14110d; padding: 8px; font-weight: 700;">Billing Cycle</td>
                <td style="border: 1px solid #14110d; padding: 8px;">{{plan_billing_cycle}}</td>
            </tr>
            <tr>
                <td style="border: 1px solid #14110d; padding: 8px; font-weight: 700;">Effective Start Date</td>
                <td style="border: 1px solid #14110d; padding: 8px;">{{start_date}}</td>
            </tr>
            <tr>
                <td style="border: 1px solid #14110d; padding: 8px; font-weight: 700;">Tenant Identifier</td>
                <td style="border: 1px solid #14110d; padding: 8px;">{{tenant_slug}}</td>
            </tr>
        </table>
    </div>

    <div style="margin-bottom: 18px;">
        <div style="font-weight: 700; text-transform: uppercase; letter-spacing: 2px; font-size: 12.5px; border-bottom: 1px solid #14110d; padding-bottom: 5px; margin-bottom: 10px;">4. Term and Renewal</div>
        <p style="text-align: justify; margin: 0 0 8px;">This Agreement shall commence on <strong>{{start_date}}</strong> and shall remain in force unless terminated in accordance with this Agreement.</p>
        <p style="text-align: justify; margin: 0;">Upon expiry of the initial billing term, this Agreement shall automatically renew for successive billing cycles of <strong>{{plan_billing_cycle}}</strong>, unless either Party gives prior written notice of non-renewal at least fifteen (15) days before the end of the then-current term.</p>
    </div>

    <div style="margin-bottom: 18px;">
        <div style="font-weight: 700; text-transform: uppercase; letter-spacing: 2px; font-size: 12.5px; border-bottom: 1px solid #14110d; padding-bottom: 5px; margin-bottom: 10px;">5. Payment Obligations</div>
        <p style="text-align: justify; margin: 0 0 8px;">The Client shall pay the subscription consideration of <strong>{{plan_price}}</strong> on a <strong>{{plan_billing_cycle}}</strong> basis, together with any applicable taxes, duties, levies, or governmental charges, if any.</p>
        <p style="text-align: justify; margin: 0 0 8px;">Invoices raised by the Provider shall be payable within seven (7) days from the date of issuance unless otherwise agreed in writing.</p>
        <p style="text-align: justify; margin: 0;">In the event of delayed payment, the Provider shall be entitled, upon reasonable notice, to suspend or restrict access to the Services until the outstanding dues are cleared.</p>
    </div>

    <div style="margin-bottom: 18px;">
        <div style="font-weight: 700; text-transform: uppercase; letter-spacing: 2px; font-size: 12.5px; border-bottom: 1px solid #14110d; padding-bottom: 5px; margin-bottom: 10px;">6. Obligations of the Provider</div>
        <ol style="margin: 0; padding-left: 22px;">
            <li style="margin-bottom: 6px;">Maintain the Platform with commercially reasonable care and skill.</li>
            <li style="margin-bottom: 6px;">Implement reasonable technical and organizational safeguards for the protection of Client Data.</li>
            <li style="margin-bottom: 6px;">Use reasonable efforts to ensure service continuity, subject to maintenance windows, force majeure events, and third-party dependencies.</li>
        </ol>
    </div>

    <div style="margin-bottom: 18px;">
        <div style="font-weight: 700; text-transform: uppercase; letter-spacing: 2px; font-size: 12.5px; border-bottom: 1px solid #14110d; padding-bottom: 5px; margin-bottom: 10px;">7. Obligations of the Client</div>
        <ol style="margin: 0; padding-left: 22px;">
            <li style="margin-bottom: 6px;">Use the Services strictly for lawful business purposes and in compliance with applicable laws.</li>
            <li style="margin-bottom: 6px;">Maintain the confidentiality of usernames, passwords, administrative access, and other credentials.</li>
            <li style="margin-bottom: 6px;">Ensure that the data uploaded to the Platform does not infringe any intellectual property, privacy, or statutory rights of any third party.</li>
            <li style="margin-bottom: 6px;">Promptly notify the Provider of any unauthorized access, security incident, or misuse of the Platform.</li>
        </ol>
    </div>

    <div style="margin-bottom: 18px;">
        <div style="font-weight: 700; text-transform: uppercase; letter-spacing: 2px; font-size: 12.5px; border-bottom: 1px solid #14110d; padding-bottom: 5px; margin-bottom: 10px;">8. Data Ownership, Privacy, and Confidentiality</div>
        <p style="text-align: justify; margin: 0 0 8px;">All Client Data shall remain the sole property of the Client. The Provider shall not claim ownership over such data by virtue of hosting, processing, or storing it on the Platform.</p>
        <p style="text-align: justify; margin: 0 0 8px;">The Provider may process Client Data solely for the purposes of performing this Agreement, platform administration, support, backup, security, analytics, and compliance.</p>
        <p style="text-align: justify; margin: 0;">Each Party shall keep confidential all proprietary, commercial, technical, and business information received from the other Party and shall not disclose the same except as required by law, regulatory authority, or court order.</p>
    </div>

    <div style="margin-bottom: 18px;">
        <div style="font-weight: 700; text-transform: uppercase; letter-spacing: 2px; font-size: 12.5px; border-bottom: 1px solid #14110d; padding-bottom: 5px; margin-bottom: 10px;">9. Suspension and Termination</div>
        <p style="text-align: justify; margin: 0 0 8px;">Either Party may terminate this Agreement by giving written notice in accordance with Clause 4, or immediately in the event of material breach by the other Party which remains uncured for ten (10) days after written notice.</p>
        <p style="text-align: justify; margin: 0 0 8px;">The Provider may suspend the Services with or without prior notice in case of illegal activity, misuse of the Platform, security threats, or persistent payment default by the Client.</p>
        <p style="text-align: justify; margin: 0;">Upon termination, access to the Platform may be withdrawn, and the Provider may retain Client Data for a limited operational retention period before deletion, subject to applicable law and operational policy.</p>
    </div>

    <div style="margin-bottom: 18px;">
        <div style="font-weight: 700; text-transform: uppercase; letter-spacing: 2px; font-size: 12.5px; border-bottom: 1px solid #14110d; padding-bottom: 5px; margin-bottom: 10px;">10. Representation, Warranty, and Limitation of Liability</div>
        <p style="text-align: justify; margin: 0 0 8px;">The Provider represents that it has the authority to enter into this Agreement and to provide the Services described herein. Except as expressly stated, the Services are provided on an "as available" and "as applicable" basis, subject to maintenance windows, third-party infrastructure, and network dependencies.</p>
        <p style="text-align: justify; margin: 0 0 8px;">To the maximum extent permitted by law, the aggregate liability of the Provider arising out of or in connection with this Agreement shall not exceed the total subscription fees paid by the Client for the three (3) months immediately preceding the event giving rise to the claim.</p>
        <p style="text-align: justify; margin: 0;">In no event shall the Provider be liable for indirect, incidental, special, punitive, or consequential damages, including loss of profits, business interruption, or loss of goodwill.</p>
    </div>

    <div style="margin-bottom: 18px;">
        <div style="font-weight: 700; text-transform: uppercase; letter-spacing: 2px; font-size: 12.5px; border-bottom: 1px solid #14110d; padding-bottom: 5px; margin-bottom: 10px;">11. Force Majeure</div>
        <p style="text-align: justify; margin: 0;">Neither Party shall be held liable for failure or delay in performance caused by events beyond its reasonable control, including natural calamities, acts of government, war, cyberattacks of extraordinary nature, labour disruption, power failure, internet backbone failure, or failure of third-party infrastructure providers.</p>
    </div>

    <div style="margin-bottom: 18px;">
        <div style="font-weight: 700; text-transform: uppercase; letter-spacing: 2px; font-size: 12.5px; border-bottom: 1px solid #14110d; padding-bottom: 5px; margin-bottom: 10px;">12. Governing Law and Jurisdiction</div>
        <p style="text-align: justify; margin: 0 0 8px;">This Agreement shall be governed by and construed in accordance with the laws of India.</p>
        <p style="text-align: justify; margin: 0;">Subject to the dispute resolution clause below, the courts having territorial jurisdiction over the Provider's registered place of business shall have exclusive jurisdiction in all matters arising out of or relating to this Agreement.</p>
    </div>

    <div style="margin-bottom: 18px;">
        <div style="font-weight: 700; text-transform: uppercase; letter-spacing: 2px; font-size: 12.5px; border-bottom: 1px solid #14110d; padding-bottom: 5px; margin-bottom: 10px;">13. Dispute Resolution</div>
        <p style="text-align: justify; margin: 0 0 8px;">The Parties shall first attempt to resolve any dispute, controversy, or claim arising out of this Agreement through good-faith discussions.</p>
        <p style="text-align: justify; margin: 0;">If the dispute remains unresolved within thirty (30) days, either Party may pursue legal remedies before the competent courts referred to in Clause 12.</p>
    </div>

    <div style="margin-bottom: 18px;">
        <div style="font-weight: 700; text-transform: uppercase; letter-spacing: 2px; font-size: 12.5px; border-bottom: 1px solid #14110d; padding-bottom: 5px; margin-bottom: 10px;">14. Miscellaneous</div>
        <p style="text-align: justify; margin: 0 0 8px;"><strong>14.1 Entire Agreement:</strong> This Agreement constitutes the complete understanding between the Parties concerning its subject matter and supersedes prior discussions, proposals, or communications.</p>
        <p style="text-align: justify; margin: 0 0 8px;"><strong>14.2 Amendment:</strong> No amendment to this Agreement shall be valid unless made in writing and accepted by both Parties.</p>
        <p style="text-align: justify; margin: 0 0 8px;"><strong>14.3 Severability:</strong> If any provision is held unenforceable, the remainder of the Agreement shall continue in full force and effect.</p>
        <p style="text-align: justify; margin: 0;"><strong>14.4 Additional Terms:</strong> {{custom_terms}}</p>
    </div>

    <div style="margin-top: 28px; margin-bottom: 22px;">
        <div style="font-weight: 700; text-transform: uppercase; text-align: center; margin-bottom: 12px;">In Witness Whereof</div>
        <p style="text-align: justify; margin: 0;">The Parties hereto have executed this Agreement on the date first written above through their duly authorized representatives.</p>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-top: 24px;">
        <tr>
            <td style="width: 48%; vertical-align: top; border: 1px solid #14110d; padding: 14px;">
                <div style="font-weight: 700; margin-bottom: 38px;">For Napnix</div>
                <div style="border-bottom: 1px solid #14110d; height: 42px; margin-bottom: 6px;"></div>
                <div>Name: __________________________</div>
                <div>Designation: Authorized Signatory</div>
                <div>Date: {{agreement_date}}</div>
                <div>Place: _________________________</div>
            </td>
            <td style="width: 4%;"></td>
            <td style="width: 48%; vertical-align: top; border: 1px solid #14110d; padding: 14px;">
                <div style="font-weight: 700; margin-bottom: 38px;">For {{tenant_company}}</div>
                <div style="border-bottom: 1px solid #14110d; height: 42px; margin-bottom: 6px;"></div>
                <div>Name: {{tenant_name}}</div>
                <div>Designation: Authorized Representative</div>
                <div>Date: _________________________</div>
                <div>Place: _________________________</div>
            </td>
        </tr>
    </table>

    <table style="width: 100%; border-collapse: collapse; margin-top: 18px;">
        <tr>
            <td style="width: 48%; vertical-align: top; border: 1px solid #14110d; padding: 14px;">
                <div style="font-weight: 700; margin-bottom: 38px;">Witness 1</div>
                <div style="border-bottom: 1px solid #14110d; height: 32px; margin-bottom: 6px;"></div>
                <div>Name: __________________________</div>
                <div>Address: ________________________</div>
            </td>
            <td style="width: 4%;"></td>
            <td style="width: 48%; vertical-align: top; border: 1px solid #14110d; padding: 14px;">
                <div style="font-weight: 700; margin-bottom: 38px;">Witness 2</div>
                <div style="border-bottom: 1px solid #14110d; height: 32px; margin-bottom: 6px;"></div>
                <div>Name: __________________________</div>
                <div>Address: ________________________</div>
            </td>
        </tr>
    </table>

    <!-- Annexure A: subscription rate card.
         Rows are rendered from the SAME plans rows that produce Clause 3 (see
         buildRateCardRows in tenant.controller.js). Do not hardcode figures here:
         a second source of truth is how the annexure ends up contradicting the
         subscription fee inside one executed contract. -->
    <div style="margin-top: 30px; border-top: 2px solid #14110d; padding-top: 16px;">
        <div style="text-align: center; font-weight: 700; text-transform: uppercase; letter-spacing: 3px; font-size: 13px; margin-bottom: 4px;">Annexure A</div>
        <div style="text-align: center; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #6b6157; margin-bottom: 14px;">Subscription Rate Card</div>

        <table style="width: 100%; border-collapse: collapse; font-size: 12.5px;">
            <tr>
                <td style="border: 1px solid #14110d; padding: 7px 9px; font-weight: 700; background: #f2ede2;">Plan</td>
                <td style="border: 1px solid #14110d; padding: 7px 9px; font-weight: 700; background: #f2ede2;">Monthly Billing</td>
                <td style="border: 1px solid #14110d; padding: 7px 9px; font-weight: 700; background: #f2ede2;">Annual Billing (total)</td>
            </tr>
            {{rate_card_rows}}
        </table>

        <p style="text-align: justify; margin: 12px 0 0; font-size: 12px;">
            A.1 The rates above are the Provider's subscription rates as at the date of execution, exclusive of Goods and Services Tax and any other applicable statutory levies.
        </p>
        <p style="text-align: justify; margin: 6px 0 0; font-size: 12px;">
            A.2 The rate applicable to the Client is the plan recorded in Clause 3. Where the Client is billed at a rate agreed in writing that differs from this card, the rate in Clause 3 shall prevail over this Annexure.
        </p>
        <p style="text-align: justify; margin: 6px 0 0; font-size: 12px;">
            A.3 Published rates may be revised by the Provider on thirty (30) days' prior written notice. Any revision shall take effect from the Client's next renewal date and shall not apply retrospectively to a billing cycle already paid for.
        </p>
    </div>

    <!-- Initials strip: each Party initials the instrument -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 22px; font-size: 11px;">
        <tr>
            <td style="padding: 0; width: 50%; color: #6b6157; letter-spacing: 1.2px; text-transform: uppercase;">
                Initials — Provider: <span style="display: inline-block; border-bottom: 1px solid #14110d; width: 90px;">&nbsp;</span>
            </td>
            <td style="padding: 0; text-align: right; color: #6b6157; letter-spacing: 1.2px; text-transform: uppercase;">
                Initials — Client: <span style="display: inline-block; border-bottom: 1px solid #14110d; width: 90px;">&nbsp;</span>
            </td>
        </tr>
    </table>

    <div style="margin-top: 18px; border-top: 2px solid #14110d; border-bottom: 1px solid #14110d; height: 4px;"></div>

    <div style="margin-top: 12px; text-align: center; font-size: 10.5px; letter-spacing: 1.1px; color: #4a423a; text-transform: uppercase;">
        <div>Napnix &nbsp;&middot;&nbsp; {{business_address}} &nbsp;&middot;&nbsp; support@napnix.in</div>
        <div style="margin-top: 5px; text-transform: none; letter-spacing: 0; font-size: 11px; font-style: italic; color: #6b6157;">
            This instrument is executed in duplicate, each Party retaining one original of equal force and effect.
        </div>
    </div>

  </div>
</div>`,
        variables: ["tenant_name", "tenant_email", "tenant_phone", "tenant_company", "tenant_slug", "plan_name", "plan_price", "plan_billing_cycle", "start_date", "agreement_date", "rate_card_rows", "business_address", "custom_terms"]
    }
];

async function seedTemplates() {
    console.log('Seeding document templates...');

    for (const template of templates) {
        try {
            // Check if template already exists
            const [existing] = await pool.query('SELECT id FROM document_templates WHERE slug = ?', [template.slug]);

            if (existing.length > 0) {
                await pool.query(
                    `UPDATE document_templates
                     SET name = ?, description = ?, category = ?, content = ?, variables = ?, isDefault = ?, updatedAt = NOW()
                     WHERE slug = ?`,
                    [template.name, template.description, template.category, template.content, JSON.stringify(template.variables), true, template.slug]
                );
                console.log(`  ✅ Updated template: ${template.name}`);
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
