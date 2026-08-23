/**
 * WhatsApp forward retry worker.
 *
 * The central Meta webhook must return 200 immediately or Meta backs off the whole
 * app — which means once we ack, redelivery to the tenant is nobody's job but ours.
 * A tenant process restarting during a deploy is routine, and before this worker
 * every message that arrived in that window was lost silently.
 *
 * The actual delivery logic lives in controllers/webhook.controller.js so the
 * first-attempt path and the retry path cannot drift apart.
 */

const { drainForwardQueue } = require('../controllers/webhook.controller');

class WhatsAppForwardWorker {
    constructor() {
        this.timer = null;
        this.running = false;
    }

    start(intervalMs = 30000) {
        if (this.timer) return;
        this.timer = setInterval(() => this.tick(), intervalMs);
        // Do not run immediately: at boot the tenant backends may still be starting,
        // and a burst of failures here would push every row into a longer backoff.
        console.log(`[WhatsAppForwardWorker] started, every ${Math.round(intervalMs / 1000)}s`);
    }

    stop() {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
    }

    async tick() {
        // Overlapping ticks would deliver the same row twice, and a duplicate
        // inbound message shows up as a duplicate lead.
        if (this.running) return;
        this.running = true;
        try {
            const result = await drainForwardQueue(50);
            if (result.delivered) {
                console.log(`[WhatsAppForwardWorker] delivered ${result.delivered}/${result.examined} queued forwards`);
            }
        } catch (error) {
            console.error('[WhatsAppForwardWorker] tick failed:', error.message);
        } finally {
            this.running = false;
        }
    }
}

module.exports = new WhatsAppForwardWorker();
