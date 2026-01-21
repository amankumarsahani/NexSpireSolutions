/**
 * Workflow Engine
 * Core execution engine for automation workflows
 */

const db = require('../config/database');
const EmailService = require('./email.service');
const AIService = require('./ai.service');

class WorkflowEngine {
    constructor() {
        this.nodeHandlers = {
            // Actions
            send_email: this.handleSendEmail.bind(this),
            update_lead: this.handleUpdateLead.bind(this),
            update_client: this.handleUpdateClient.bind(this),
            create_task: this.handleCreateTask.bind(this),
            assign_user: this.handleAssignUser.bind(this),
            add_note: this.handleAddNote.bind(this),
            send_notification: this.handleSendNotification.bind(this),
            webhook: this.handleWebhook.bind(this),

            // Conditions
            condition: this.handleCondition.bind(this),

            // Delays
            delay: this.handleDelay.bind(this),
            ai_assistant: this.handleAIAssistant.bind(this),
            update_inquiry: this.handleUpdateInquiry.bind(this),
            assign_inquiry: this.handleAssignUser.bind(this)
        };
    }

    /**
     * Trigger a workflow based on an event
     */
    async trigger(triggerType, entityType, entityId, entityData) {
        try {
            // Find active workflows matching this trigger
            const [workflows] = await db.query(
                `SELECT * FROM workflows 
                 WHERE is_active = TRUE AND trigger_type = ?`,
                [triggerType]
            );

            console.log(`[WorkflowEngine] Found ${workflows.length} workflows for trigger: ${triggerType}`);

            for (const workflow of workflows) {
                // Check trigger filters if any
                if (workflow.trigger_config) {
                    const config = typeof workflow.trigger_config === 'string'
                        ? JSON.parse(workflow.trigger_config)
                        : workflow.trigger_config;

                    if (!this.matchesTriggerFilter(config, entityData)) {
                        console.log(`[WorkflowEngine] Workflow ${workflow.id} skipped - filter not matched`);
                        continue;
                    }
                }

                // Create execution instance
                const [result] = await db.query(
                    `INSERT INTO workflow_executions 
                     (workflow_id, trigger_entity_type, trigger_entity_id, trigger_data, status)
                     VALUES (?, ?, ?, ?, 'running')`,
                    [workflow.id, entityType, entityId, JSON.stringify(entityData)]
                );

                const executionId = result.insertId;
                console.log(`[WorkflowEngine] Started execution ${executionId} for workflow "${workflow.name}"`);

                // Execute the workflow
                this.executeWorkflow(workflow.id, executionId, entityData).catch(err => {
                    console.error(`[WorkflowEngine] Execution ${executionId} failed:`, err);
                });
            }
        } catch (error) {
            console.error('[WorkflowEngine] Trigger error:', error);
        }
    }

    /**
     * Execute a workflow from its trigger node
     */
    async executeWorkflow(workflowId, executionId, contextData) {
        try {
            // Get all nodes and connections
            const [nodes] = await db.query(
                'SELECT * FROM workflow_nodes WHERE workflow_id = ? ORDER BY id',
                [workflowId]
            );

            const [connections] = await db.query(
                'SELECT * FROM workflow_connections WHERE workflow_id = ?',
                [workflowId]
            );

            // Find trigger node (start point)
            const triggerNode = nodes.find(n => n.node_type === 'trigger');
            if (!triggerNode) {
                throw new Error('No trigger node found');
            }

            // Build adjacency map
            const nodeMap = new Map(nodes.map(n => [n.id, n]));
            const connectionMap = new Map();
            for (const conn of connections) {
                if (!connectionMap.has(conn.source_node_id)) {
                    connectionMap.set(conn.source_node_id, []);
                }
                connectionMap.get(conn.source_node_id).push(conn);
            }

            // Execute starting from trigger
            await this.executeNode(triggerNode, executionId, contextData, nodeMap, connectionMap);

            // Check if execution is in waiting state (due to delay) - don't mark complete
            const [execStatus] = await db.query(
                'SELECT status FROM workflow_executions WHERE id = ?',
                [executionId]
            );

            if (execStatus[0]?.status === 'waiting') {
                console.log(`[WorkflowEngine] Execution ${executionId} paused (waiting for delay)`);
                return; // Don't mark as completed, worker will resume later
            }

            // Mark execution complete
            await db.query(
                "UPDATE workflow_executions SET status = 'completed', completed_at = NOW() WHERE id = ?",
                [executionId]
            );

            console.log(`[WorkflowEngine] Execution ${executionId} completed`);

        } catch (error) {
            await db.query(
                "UPDATE workflow_executions SET status = 'failed', error_message = ?, completed_at = NOW() WHERE id = ?",
                [error.message, executionId]
            );
            throw error;
        }
    }

    /**
     * Resume a delayed workflow execution
     */
    async resumeExecution(executionId) {
        try {
            // Get the execution
            const [executions] = await db.query(
                'SELECT * FROM workflow_executions WHERE id = ?',
                [executionId]
            );

            if (executions.length === 0) {
                throw new Error(`Execution ${executionId} not found`);
            }

            const execution = executions[0];
            const workflowId = execution.workflow_id;
            const currentNodeId = execution.current_node_id;

            // Get trigger data
            let contextData = {};
            try {
                contextData = execution.trigger_data ? JSON.parse(execution.trigger_data) : {};
            } catch (e) {
                contextData = execution.trigger_data || {};
            }

            // Mark as running
            await db.query(
                "UPDATE workflow_executions SET status = 'running' WHERE id = ?",
                [executionId]
            );

            console.log(`[WorkflowEngine] Resuming execution ${executionId} from node ${currentNodeId}`);

            // Get all nodes and connections
            const [nodes] = await db.query(
                'SELECT * FROM workflow_nodes WHERE workflow_id = ? ORDER BY id',
                [workflowId]
            );

            const [connections] = await db.query(
                'SELECT * FROM workflow_connections WHERE workflow_id = ?',
                [workflowId]
            );

            // Build maps
            const nodeMap = new Map(nodes.map(n => [n.id, n]));
            const connectionMap = new Map();
            for (const conn of connections) {
                if (!connectionMap.has(conn.source_node_id)) {
                    connectionMap.set(conn.source_node_id, []);
                }
                connectionMap.get(conn.source_node_id).push(conn);
            }

            // Get ALL execution logs to recover output data from all nodes (including AI Assistant)
            const [allLogs] = await db.query(
                'SELECT output_data FROM workflow_execution_logs WHERE execution_id = ? AND output_data IS NOT NULL ORDER BY id ASC',
                [executionId]
            );

            // Merge all output data to build complete context
            for (const log of allLogs) {
                if (log.output_data) {
                    try {
                        const logOutput = typeof log.output_data === 'string'
                            ? JSON.parse(log.output_data)
                            : log.output_data;
                        contextData = { ...contextData, ...logOutput };
                    } catch (e) {
                        // Skip invalid JSON
                    }
                }
            }

            console.log(`[WorkflowEngine] Resumed with context keys:`, Object.keys(contextData));


            // Find connections from current node and execute next nodes
            const currentConnections = connectionMap.get(currentNodeId) || [];
            for (const conn of currentConnections) {
                const nextNode = nodeMap.get(conn.target_node_id);
                if (nextNode) {
                    await this.executeNode(nextNode, executionId, contextData, nodeMap, connectionMap);
                }
            }

            // Mark execution complete
            await db.query(
                "UPDATE workflow_executions SET status = 'completed', completed_at = NOW() WHERE id = ?",
                [executionId]
            );

            console.log(`[WorkflowEngine] Resumed execution ${executionId} completed`);
        } catch (error) {
            console.error(`[WorkflowEngine] Resume execution ${executionId} failed:`, error);
            await db.query(
                "UPDATE workflow_executions SET status = 'failed', error_message = ?, completed_at = NOW() WHERE id = ?",
                [error.message, executionId]
            );
            throw error;
        }
    }

    /**
     * Execute a single node and continue to connected nodes
     */
    async executeNode(node, executionId, contextData, nodeMap, connectionMap) {
        console.log(`[WorkflowEngine] Executing node ${node.id} (${node.node_type}:${node.action_type || 'trigger'})`);

        // Log node start
        const [logResult] = await db.query(
            `INSERT INTO workflow_execution_logs 
             (execution_id, node_id, status, input_data, started_at)
             VALUES (?, ?, 'running', ?, NOW())`,
            [executionId, node.id, JSON.stringify(contextData)]
        );
        const logId = logResult.insertId;

        try {
            let outputData = contextData;
            let branchResult = 'default';

            // Execute node based on type
            if (node.node_type === 'trigger') {
                // Trigger already happened, just pass through
                outputData = contextData;
            } else if (node.node_type === 'delay') {
                // Handle delay - schedule for later
                const delayResult = await this.handleDelay(node, executionId, contextData);
                if (delayResult.shouldWait) {
                    // Update execution to waiting state
                    await db.query(
                        "UPDATE workflow_executions SET status = 'waiting', current_node_id = ?, next_run_at = ? WHERE id = ?",
                        [node.id, delayResult.resumeAt, executionId]
                    );

                    await db.query(
                        "UPDATE workflow_execution_logs SET status = 'completed', output_data = ?, completed_at = NOW() WHERE id = ?",
                        [JSON.stringify({ waiting_until: delayResult.resumeAt }), logId]
                    );

                    return; // Stop execution, worker will resume later
                }
            } else if (node.node_type === 'condition') {
                branchResult = await this.handleCondition(node, contextData);
                outputData = contextData;
            } else if (node.node_type === 'action') {
                const handler = this.nodeHandlers[node.action_type];
                if (handler) {
                    outputData = await handler(node, contextData);
                } else {
                    throw new Error(`Unknown action type: ${node.action_type}`);
                }
            }

            // Log success
            await db.query(
                "UPDATE workflow_execution_logs SET status = 'completed', output_data = ?, completed_at = NOW() WHERE id = ?",
                [JSON.stringify(outputData), logId]
            );

            // Find and execute connected nodes
            const connections = connectionMap.get(node.id) || [];
            for (const conn of connections) {
                // For conditions, check if this branch matches
                if (node.node_type === 'condition' && conn.source_handle !== branchResult) {
                    continue;
                }

                const nextNode = nodeMap.get(conn.target_node_id);
                if (nextNode) {
                    await this.executeNode(nextNode, executionId, outputData, nodeMap, connectionMap);
                }
            }
        } catch (error) {
            await db.query(
                "UPDATE workflow_execution_logs SET status = 'failed', error_message = ?, completed_at = NOW() WHERE id = ?",
                [error.message, logId]
            );
            throw error;
        }
    }

    /**
     * Check if entity matches trigger filter
     */
    matchesTriggerFilter(config, entityData) {
        // Handle new simplified filter format (source_filter, status_filter, client_type_filter)
        if (config.source_filter && config.source_filter !== '') {
            if (entityData.source !== config.source_filter) {
                console.log(`[WorkflowEngine] Source filter mismatch: ${entityData.source} !== ${config.source_filter}`);
                return false;
            }
        }

        if (config.status_filter && config.status_filter !== '') {
            if (entityData.status !== config.status_filter) {
                console.log(`[WorkflowEngine] Status filter mismatch: ${entityData.status} !== ${config.status_filter}`);
                return false;
            }
        }

        if (config.client_type_filter && config.client_type_filter !== '') {
            if (entityData.client_type !== config.client_type_filter && entityData.type !== config.client_type_filter) {
                console.log(`[WorkflowEngine] Client type filter mismatch`);
                return false;
            }
        }

        // Handle from_status and to_status for status change triggers
        if (config.from_status && config.from_status !== '') {
            if (entityData.old_status !== config.from_status && entityData.from_status !== config.from_status) {
                console.log(`[WorkflowEngine] From status filter mismatch: ${entityData.old_status || entityData.from_status} !== ${config.from_status}`);
                return false;
            }
        }

        if (config.to_status && config.to_status !== '') {
            if (entityData.new_status !== config.to_status && entityData.to_status !== config.to_status && entityData.status !== config.to_status) {
                console.log(`[WorkflowEngine] To status filter mismatch: ${entityData.new_status || entityData.to_status || entityData.status} !== ${config.to_status}`);
                return false;
            }
        }

        // Handle legacy filters array format
        if (config.filters && config.filters.length > 0) {
            for (const filter of config.filters) {
                const value = entityData[filter.field];
                switch (filter.operator) {
                    case 'equals':
                        if (value !== filter.value) return false;
                        break;
                    case 'not_equals':
                        if (value === filter.value) return false;
                        break;
                    case 'contains':
                        if (!String(value).includes(filter.value)) return false;
                        break;
                    case 'greater_than':
                        if (Number(value) <= Number(filter.value)) return false;
                        break;
                    case 'less_than':
                        if (Number(value) >= Number(filter.value)) return false;
                        break;
                }
            }
        }

        return true;
    }

    // ============================================
    // NODE HANDLERS
    // ============================================

    async handleSendEmail(node, contextData) {
        const config = typeof node.config === 'string' ? JSON.parse(node.config) : node.config;

        // Replace variables in template
        let subject = config.subject || '';
        let body = config.body || '';
        let toEmailConfig = config.to_email || '';

        for (const [key, value] of Object.entries(contextData)) {
            const safeValue = value !== null && value !== undefined ? String(value) : '';
            subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), safeValue);
            body = body.replace(new RegExp(`{{${key}}}`, 'g'), safeValue);
            toEmailConfig = toEmailConfig.replace(new RegExp(`{{${key}}}`, 'g'), safeValue);
        }

        // Get recipient email from resolved config or context
        const toEmail = toEmailConfig || contextData.email;

        if (!toEmail) {
            throw new Error('No recipient email found. Set "To Email" field or ensure entity has email.');
        }

        // Final cleanup for HTML: convert actual newlines AND literal \n strings to <br />
        const htmlBody = body.replace(/\\n/g, '<br />').replace(/\n/g, '<br />');

        // Send email
        await EmailService.sendEmail({
            to: toEmail,
            subject: subject,
            html: htmlBody
        });

        console.log(`[WorkflowEngine] Email sent to ${toEmail}`);
        return { ...contextData, email_sent: true, email_to: toEmail };
    }

    async handleUpdateLead(node, contextData) {
        const config = typeof node.config === 'string' ? JSON.parse(node.config) : node.config;
        const leadId = contextData.id || contextData.lead_id;

        if (!leadId) throw new Error('No lead ID in context');

        const updates = config.updates || {};
        const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        const values = Object.values(updates);

        await db.query(
            `UPDATE leads SET ${fields} WHERE id = ?`,
            [...values, leadId]
        );

        console.log(`[WorkflowEngine] Updated lead ${leadId}`);
        return { ...contextData, ...updates };
    }

    async handleUpdateClient(node, contextData) {
        const config = typeof node.config === 'string' ? JSON.parse(node.config) : node.config;
        const clientId = contextData.id || contextData.client_id;

        if (!clientId) throw new Error('No client ID in context');

        const updates = config.updates || {};
        const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        const values = Object.values(updates);

        await db.query(
            `UPDATE clients SET ${fields} WHERE id = ?`,
            [...values, clientId]
        );

        console.log(`[WorkflowEngine] Updated client ${clientId}`);
        return { ...contextData, ...updates };
    }

    async handleUpdateInquiry(node, contextData) {
        const config = typeof node.config === 'string' ? JSON.parse(node.config) : node.config;
        const inquiryId = contextData.id || contextData.inquiry_id;

        if (!inquiryId) throw new Error('No inquiry ID in context');

        const updates = config.updates || {};
        if (Object.keys(updates).length === 0) return contextData;

        const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        const values = Object.values(updates);

        await db.query(
            `UPDATE inquiries SET ${fields} WHERE id = ?`,
            [...values, inquiryId]
        );

        console.log(`[WorkflowEngine] Updated inquiry ${inquiryId}`);
        return { ...contextData, ...updates };
    }

    async handleCreateTask(node, contextData) {
        const config = typeof node.config === 'string' ? JSON.parse(node.config) : node.config;

        // Replace variables in task title/description
        let title = config.title || 'Automated Task';
        let description = config.description || '';

        for (const [key, value] of Object.entries(contextData)) {
            title = title.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
            description = description.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
        }

        const dueDate = config.due_days
            ? new Date(Date.now() + config.due_days * 24 * 60 * 60 * 1000)
            : null;

        const [result] = await db.query(
            `INSERT INTO tasks (title, description, priority, status, dueDate, relatedType, relatedId, assignedTo)
             VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)`,
            [
                title,
                description,
                config.priority || 'medium',
                dueDate,
                contextData.entity_type || 'lead',
                contextData.id,
                config.assign_to || null
            ]
        );

        console.log(`[WorkflowEngine] Created task ${result.insertId}`);
        return { ...contextData, task_created: true, task_id: result.insertId };
    }

    async handleAssignUser(node, contextData) {
        const config = typeof node.config === 'string' ? JSON.parse(node.config) : node.config;
        const entityType = contextData.entity_type || 'lead';
        const entityId = contextData.id;

        if (!entityId) throw new Error('No entity ID in context');

        const tableMap = {
            'lead': 'leads',
            'client': 'clients',
            'inquiry': 'inquiries'
        };

        const table = tableMap[entityType] || 'leads';

        await db.query(
            `UPDATE ${table} SET assignedTo = ? WHERE id = ?`,
            [config.user_id, entityId]
        );

        console.log(`[WorkflowEngine] Assigned ${entityType} ${entityId} to user ${config.user_id}`);
        return { ...contextData, assigned_to: config.user_id };
    }

    async handleAddNote(node, contextData) {
        const config = typeof node.config === 'string' ? JSON.parse(node.config) : node.config;

        let content = config.content || '';
        for (const [key, value] of Object.entries(contextData)) {
            content = content.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
        }

        await db.query(
            `INSERT INTO activities (entityType, entityId, type, summary, details)
             VALUES (?, ?, 'note', 'Automated Note', ?)`,
            [contextData.entity_type || 'lead', contextData.id, content]
        );

        console.log(`[WorkflowEngine] Added note to ${contextData.entity_type} ${contextData.id}`);
        return { ...contextData, note_added: true };
    }

    async handleSendNotification(node, contextData) {
        const config = typeof node.config === 'string' ? JSON.parse(node.config) : node.config;

        // Replace variables in message
        let title = config.title || 'Notification';
        let message = config.message || '';

        for (const [key, value] of Object.entries(contextData)) {
            title = title.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
            message = message.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
        }

        // Get target user(s) - can be specific user or assigned user
        const targetUserId = config.user_id || contextData.assignedTo || contextData.assigned_to;

        if (!targetUserId) {
            console.log('[WorkflowEngine] No target user for notification, skipping');
            return contextData;
        }

        await db.query(
            `INSERT INTO notifications (user_id, title, message, type, entity_type, entity_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                targetUserId,
                title,
                message,
                config.type || 'info',
                contextData.entity_type || null,
                contextData.id || null
            ]
        );

        console.log(`[WorkflowEngine] Notification sent to user ${targetUserId}: ${title}`);
        return { ...contextData, notification_sent: true };
    }

    async handleWebhook(node, contextData) {
        const config = typeof node.config === 'string' ? JSON.parse(node.config) : node.config;

        const response = await fetch(config.url, {
            method: config.method || 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(config.headers || {})
            },
            body: JSON.stringify(contextData)
        });

        const responseData = await response.json().catch(() => ({}));
        console.log(`[WorkflowEngine] Webhook called: ${config.url}`);
        return { ...contextData, webhook_response: responseData };
    }

    async handleCondition(node, contextData) {
        const config = typeof node.config === 'string' ? JSON.parse(node.config) : node.config;

        const field = config.field;
        const operator = config.operator;
        const value = config.value;
        const actualValue = contextData[field];

        let result = false;
        switch (operator) {
            case 'equals':
                result = String(actualValue) === String(value);
                break;
            case 'not_equals':
                result = String(actualValue) !== String(value);
                break;
            case 'contains':
                result = String(actualValue).includes(value);
                break;
            case 'greater_than':
                result = Number(actualValue) > Number(value);
                break;
            case 'less_than':
                result = Number(actualValue) < Number(value);
                break;
            case 'is_empty':
                result = !actualValue || actualValue === '';
                break;
            case 'is_not_empty':
                result = actualValue && actualValue !== '';
                break;
        }

        console.log(`[WorkflowEngine] Condition: ${field} ${operator} ${value} = ${result}`);
        return result ? 'yes' : 'no';
    }

    async handleDelay(node, executionId, contextData) {
        const config = typeof node.config === 'string' ? JSON.parse(node.config) : node.config;

        let delayMs = 0;
        switch (config.unit) {
            case 'minutes':
                delayMs = config.value * 60 * 1000;
                break;
            case 'hours':
                delayMs = config.value * 60 * 60 * 1000;
                break;
            case 'days':
                delayMs = config.value * 24 * 60 * 60 * 1000;
                break;
        }

        const resumeAt = new Date(Date.now() + delayMs);
        console.log(`[WorkflowEngine] Delay: waiting until ${resumeAt.toISOString()}`);

        return { shouldWait: true, resumeAt };
    }


    /**
 * Handle AI Assistant Action
 */
    async handleAIAssistant(node, contextData) {
        console.log(`[WorkflowEngine] Executing AI Assistant node: ${node.node_uid}`);

        try {
            // Ensure contextData is valid
            const safeData = contextData || {};

            // Parse config - handle cases where it's stored as a JSON string
            let config = node.config || {};
            if (typeof config === 'string') {
                try {
                    config = JSON.parse(config);
                } catch (e) {
                    console.error('[WorkflowEngine] Failed to parse AI Assistant config:', e.message);
                    config = {};
                }
            }

            const promptTemplate = config.prompt || 'Analyze this lead: {{name}} from {{company}}';
            const systemMessage = config.system_message ||
                'You are a professional CRM sales assistant. Your task is to draft the internal content for an email response. \n' +
                'RULES:\n' +
                '1. Write ONLY the email body content.\n' +
                '2. Do NOT include a Subject line.\n' +
                '3. Do NOT include "Dear [Name]" if you are starting with a greeting.\n' +
                '4. Use a professional, helpful tone.\n' +
                '5. Output plain text without markdown or conversational filler.';

            const model = config.model || null;
            const outputVariable = config.output_variable || 'ai_reply_draft';

            console.log(`[WorkflowEngine] AI Assistant using model: ${model || 'DEFAULT'}`);

            // Render prompt and system message with variables
            const renderedPrompt = AIService.renderPrompt(promptTemplate, safeData);
            const renderedSystemMessage = AIService.renderPrompt(systemMessage, safeData);

            // Call AI Service
            let response = await AIService.generateContent(renderedPrompt, renderedSystemMessage, model);

            // Robust Cleaning: Remove Subject lines, conversational filler, and redundant greetings
            response = response
                .replace(/^(Subject|Re|Thread|From|To|Date):.*$/im, '') // Remove headers
                .replace(/^Here's a (polite|helpful|draft|suggested).*$/im, '') // Remove conversational filler
                .replace(/^(Dear|Hi|Hello)\s+{{name}}[,!.]*/im, '') // Remove redundant greeting if it matches template
                .replace(/^(Dear|Hi|Hello)\s+Customer[,!.]*/im, '')
                .trim();

            // Logic Fix: We MUST convert \n to <br /> because standard HTML emails ignore \n.
            // This is a technical bridge between Text (AI) and HTML (Email).

            // Final pass: if AI produced tags, try to replace them with data from context
            response = AIService.renderPrompt(response, safeData);

            // Convert actual newlines AND literal \n strings to HTML line breaks
            const htmlResponse = response.trim().replace(/\\n/g, '<br />').replace(/\n/g, '<br />');

            // Return flat data strictly for variable substitution
            return {
                ...safeData,
                [outputVariable]: htmlResponse
            };
        } catch (error) {
            console.error(`[WorkflowEngine] AI Assistant handler error:`, error);
            // On failure, continue with existing data
            return contextData || {};
        }
    }
}

module.exports = new WorkflowEngine();
