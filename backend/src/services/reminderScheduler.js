import { checkAndSendReminders } from './reminderService.js';

const POLL_INTERVAL_MS = 5 * 60 * 1000;

// Runs the same sweep a real cron job / task queue would run periodically.
// Fires once immediately on boot (so anything already inside the reminder
// window gets texted right away) and then every POLL_INTERVAL_MS.
export function startReminderScheduler() {
  checkAndSendReminders().catch((err) => console.error('[reminders] initial sweep failed', err));

  setInterval(() => {
    checkAndSendReminders().catch((err) => console.error('[reminders] sweep failed', err));
  }, POLL_INTERVAL_MS);

  console.log(`[reminders] scheduler started, polling every ${POLL_INTERVAL_MS / 60000}m`);
}
