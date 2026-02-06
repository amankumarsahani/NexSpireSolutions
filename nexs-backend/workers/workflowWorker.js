/**
 * Workflow Worker
 * Background process for scheduled and delayed workflow executions
 */

const db = require('../config/database');
const workflowEngine = require('../services/workflowEngine');

class WorkflowWorker {
    constructor() {
        this.isRunning = false;
    }

    /**
     * Process delayed executions that are ready to resume
     */
    async processDelayed() {
        if (this.isRunning) return;
        this.isRunning = true;

        try {
            // Find executions waiting and ready to resume
            const [waiting] = await db.query(
                `SELECT * FROM workflow_executions 
                 WHERE status = 'waiting' AND next_run_at <= NOW()
                 ORDER BY next_run_at ASC
                 LIMIT 10`
            );

            console.log(`[WorkflowWorker] Checking delayed executions: found ${waiting.length} ready to resume`);

            for (const execution of waiting) {
                try {
                    console.log(`[WorkflowWorker] Resuming execution ${execution.id}`);
                    await workflowEngine.resumeExecution(execution.id);
                } catch (error) {
                    console.error(`[WorkflowWorker] Failed to resume execution ${execution.id}:`, error);
                }
            }
        } catch (error) {
            console.error('[WorkflowWorker] Processing error:', error);
        } finally {
            this.isRunning = false;
        }
    }


    /**
     * Process scheduled workflows (cron-like)
     */
    async processScheduled() {
        try {
            // Get timezone from settings
            const timezone = await this.getTimezone();
            const currentTime = this.getTimeInTimezone(timezone);

            console.log(`[WorkflowWorker] Schedule check: ${currentTime} (${timezone})`);

            // Find scheduled workflows - check both 'scheduled' and 'trigger_schedule' trigger types
            const [scheduled] = await db.query(
                `SELECT * FROM workflows 
                 WHERE is_active = TRUE AND (trigger_type = 'scheduled' OR trigger_type = 'trigger_schedule')`
            );

            console.log(`[WorkflowWorker] Found ${scheduled.length} scheduled workflows`);

            // Log each workflow for debugging
            for (const wf of scheduled) {
                console.log(`[WorkflowWorker]   - ID: ${wf.id}, Name: ${wf.name}, Type: ${wf.trigger_type}, Active: ${wf.is_active}`);
            }


            for (const workflow of scheduled) {
                // Parse canvas_data to get schedule config from trigger node
                let canvasData = workflow.canvas_data;
                if (typeof canvasData === 'string') {
                    try { canvasData = JSON.parse(canvasData); } catch (e) { canvasData = { nodes: [] }; }
                }
                canvasData = canvasData || { nodes: [] };

                // Find the schedule trigger node
                const triggerNode = (canvasData.nodes || []).find(
                    node => node.type === 'trigger_schedule' || node.type === 'scheduled'
                );
                const nodeConfig = triggerNode?.data?.config || {};

                // Get schedule settings from either nodeConfig or trigger_config
                const triggerConfig = typeof workflow.trigger_config === 'string'
                    ? JSON.parse(workflow.trigger_config || '{}')
                    : (workflow.trigger_config || {});

                const runTime = nodeConfig.run_time || triggerConfig.run_time || null;
                const intervalMinutes = nodeConfig.interval_minutes || triggerConfig.interval_minutes || null;

                if (this.shouldRunScheduled({ run_time: runTime, interval_minutes: intervalMinutes }, workflow, currentTime)) {
                    console.log(`[WorkflowWorker] Running scheduled workflow: ${workflow.name}`);

                    // Update last_run_at before executing
                    await db.query(
                        'UPDATE workflows SET last_run_at = NOW() WHERE id = ?',
                        [workflow.id]
                    );

                    await workflowEngine.trigger('scheduled', 'system', workflow.id, {
                        scheduled_run: new Date(),
                        workflow_id: workflow.id,
                        workflow_name: workflow.name
                    });
                }
            }
        } catch (error) {
            console.error('[WorkflowWorker] Scheduled processing error:', error);
        }
    }

    /**
     * Check if a scheduled workflow should run now
     */
    shouldRunScheduled(config, workflow, currentTime) {
        const now = new Date();
        const lastRun = workflow.last_run_at ? new Date(workflow.last_run_at) : null;

        // Prevent running too frequently (min 1 minute between runs for same workflow)
        if (lastRun && (now - lastRun) < 60 * 1000) {
            return false;
        }

        // Time-based: run at specific time
        if (config.run_time) {
            const normalizedCurrent = this.normalizeTime(currentTime);
            const normalizedTarget = this.normalizeTime(config.run_time);

            console.log(`[WorkflowWorker] Workflow ${workflow.id}: comparing "${normalizedCurrent}" with target "${normalizedTarget}"`);

            if (normalizedCurrent === normalizedTarget) {
                // Check if already ran today at this time
                if (lastRun) {
                    const sameDay = lastRun.toDateString() === now.toDateString();
                    const lastRunTime = this.normalizeTime(
                        lastRun.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                    );
                    if (sameDay && lastRunTime === normalizedTarget) {
                        return false; // Already ran at this time today
                    }
                }
                return true;
            }
        }

        // Interval-based: run every N minutes
        if (config.interval_minutes) {
            if (!lastRun) return true;
            return (now - lastRun) >= config.interval_minutes * 60 * 1000;
        }

        // Legacy schedule format support
        if (config.schedule) {
            const schedule = config.schedule;

            // Hourly
            if (schedule.type === 'hourly') {
                return now.getMinutes() < 5 && (!lastRun || (now - lastRun) >= 55 * 60 * 1000);
            }

            // Daily at specific hour
            if (schedule.type === 'daily' && schedule.hour !== undefined) {
                const shouldRun = now.getHours() === schedule.hour && now.getMinutes() < 5;
                if (shouldRun && lastRun) {
                    return lastRun.toDateString() !== now.toDateString();
                }
                return shouldRun;
            }

            // Interval in minutes
            if (schedule.type === 'interval' && schedule.minutes) {
                if (!lastRun) return true;
                return (now - lastRun) >= schedule.minutes * 60 * 1000;
            }
        }

        return false;
    }

    /**
     * Normalize time to HH:MM format
     */
    normalizeTime(timeStr) {
        if (!timeStr) return null;
        const match = timeStr.match(/(\d{1,2}):(\d{2})/);
        if (!match) return timeStr;
        const hours = match[1].padStart(2, '0');
        const minutes = match[2];
        return `${hours}:${minutes}`;
    }

    /**
     * Get current time in a specific timezone
     */
    getTimeInTimezone(timezone) {
        try {
            const date = new Date();
            return date.toLocaleTimeString('en-US', {
                timeZone: timezone,
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        } catch (error) {
            const date = new Date();
            return date.toLocaleTimeString('en-US', {
                timeZone: 'UTC',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        }
    }

    /**
     * Get timezone from settings
     */
    async getTimezone() {
        try {
            const [settings] = await db.query(
                `SELECT setting_value FROM settings WHERE setting_key = 'default_timezone' OR setting_key = 'timezone' ORDER BY setting_key DESC LIMIT 1`
            );
            return settings.length > 0 && settings[0].setting_value
                ? settings[0].setting_value
                : 'UTC';
        } catch (error) {
            return 'UTC';
        }
    }


    /**
     * Start the worker
     */
    start(intervalMs = 60000) {
        console.log('[WorkflowWorker] Starting...');

        // Process immediately on start
        this.processDelayed();

        // Then run on interval
        setInterval(() => {
            this.processDelayed();
        }, intervalMs);

        // Check scheduled workflows every 1 minute (for accurate run_time scheduling)
        setInterval(() => {
            this.processScheduled();
        }, 60000);

    }
}

module.exports = new WorkflowWorker();
