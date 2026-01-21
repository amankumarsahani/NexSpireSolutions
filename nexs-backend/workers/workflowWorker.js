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
            // Find scheduled workflows that need to run
            const [scheduled] = await db.query(
                `SELECT * FROM workflows 
                 WHERE is_active = TRUE AND trigger_type = 'scheduled'`
            );

            for (const workflow of scheduled) {
                const config = typeof workflow.trigger_config === 'string'
                    ? JSON.parse(workflow.trigger_config)
                    : workflow.trigger_config || {};

                if (this.shouldRunScheduled(config, workflow)) {
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
    shouldRunScheduled(config, workflow) {
        if (!config.schedule) return false;

        const now = new Date();
        const schedule = config.schedule;
        const lastRun = workflow.last_run_at ? new Date(workflow.last_run_at) : null;

        // Prevent running too frequently (min 5 minutes between runs)
        if (lastRun && (now - lastRun) < 5 * 60 * 1000) {
            return false;
        }

        // Hourly - run every hour at minute 0
        if (schedule.type === 'hourly') {
            return now.getMinutes() < 5;
        }

        // Daily at specific hour
        if (schedule.type === 'daily' && schedule.hour !== undefined) {
            const shouldRun = now.getHours() === schedule.hour && now.getMinutes() < 5;
            // Check if already ran today
            if (shouldRun && lastRun) {
                const sameDay = lastRun.toDateString() === now.toDateString();
                return !sameDay;
            }
            return shouldRun;
        }

        // Weekly on specific day
        if (schedule.type === 'weekly' && schedule.day !== undefined) {
            const shouldRun = now.getDay() === schedule.day && now.getHours() === (schedule.hour || 9) && now.getMinutes() < 5;
            if (shouldRun && lastRun) {
                // Check if already ran this week
                const daysSinceLastRun = Math.floor((now - lastRun) / (1000 * 60 * 60 * 24));
                return daysSinceLastRun >= 7;
            }
            return shouldRun;
        }

        // Monthly on specific day of month
        if (schedule.type === 'monthly' && schedule.day_of_month !== undefined) {
            const shouldRun = now.getDate() === schedule.day_of_month && now.getHours() === (schedule.hour || 9) && now.getMinutes() < 5;
            if (shouldRun && lastRun) {
                return lastRun.getMonth() !== now.getMonth();
            }
            return shouldRun;
        }

        // Interval in minutes
        if (schedule.type === 'interval' && schedule.minutes) {
            if (!lastRun) return true;
            return (now - lastRun) >= schedule.minutes * 60 * 1000;
        }

        return false;
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

        // Check scheduled workflows every 5 minutes
        setInterval(() => {
            this.processScheduled();
        }, 300000);
    }
}

module.exports = new WorkflowWorker();
