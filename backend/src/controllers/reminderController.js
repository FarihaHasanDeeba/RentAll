import SmsMessage from '../models/SmsMessage.js';
import Rental from '../models/Rental.js';
import { checkAndSendReminders, REMINDER_WINDOW_HOURS } from '../services/reminderService.js';

// POST /api/reminders/run
// Manually triggers the same sweep the background scheduler runs, so the
// demo doesn't depend on waiting for the real clock to enter the window.
export async function runReminderSweep(req, res) {
  const { checked, sent } = await checkAndSendReminders();
  res.json({
    windowHours: REMINDER_WINDOW_HOURS,
    checked,
    sentCount: sent.length,
    messages: sent,
  });
}

// GET /api/reminders
export async function listReminders(req, res) {
  const messages = await SmsMessage.find()
    .populate({ path: 'rental', select: 'item endDate', populate: { path: 'item', select: 'title' } })
    .sort({ sentAt: -1 });
  res.json(messages);
}

// GET /api/rentals/:id/reminder
export async function getReminderForRental(req, res) {
  const rental = await Rental.findById(req.params.id).select('endDate returnReminderSentAt');
  if (!rental) return res.status(404).json({ message: 'Rental not found' });

  const message = await SmsMessage.findOne({ rental: rental._id }).sort({ sentAt: -1 });
  res.json({
    windowHours: REMINDER_WINDOW_HOURS,
    dueDate: rental.endDate,
    sentAt: rental.returnReminderSentAt,
    message,
  });
}
