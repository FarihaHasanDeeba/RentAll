import Rental from '../models/Rental.js';
import SmsMessage from '../models/SmsMessage.js';
import * as sms from './smsMockService.js';

// ---------------------------------------------------------------------------
// Return Window SMS Reminders.
//
// A rental qualifies once its due date (endDate) is 6 hours or less away and
// hasn't passed yet - not before (too early to matter) and not after (it's
// already late, which is the Late Return Fee Generator's territory, not a
// reminder's). Each rental is texted at most once, tracked via
// Rental.returnReminderSentAt.
// ---------------------------------------------------------------------------

export const REMINDER_WINDOW_HOURS = 6;
const MS_PER_HOUR = 60 * 60 * 1000;

export async function checkAndSendReminders() {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_HOURS * MS_PER_HOUR);

  const dueRentals = await Rental.find({
    paymentStatus: 'Paid',
    status: { $nin: ['Returned', 'Checked & Approved', 'Cancelled'] },
    returnReminderSentAt: null,
    endDate: { $gt: now, $lte: windowEnd },
  })
    .populate('item', 'title')
    .populate('renter', 'name phone');

  const sent = [];
  for (const rental of dueRentals) {
    const hoursBeforeDue = Math.round(((rental.endDate.getTime() - now.getTime()) / MS_PER_HOUR) * 10) / 10;
    const body =
      `RentAll: "${rental.item.title}" is due back by ${rental.endDate.toLocaleString()} ` +
      `(~${hoursBeforeDue}h left). Please return it on time to avoid a late fee.`;

    const result = await sms.sendSms({ to: rental.renter.phone, body });

    const message = await SmsMessage.create({
      rental: rental._id,
      to: rental.renter.phone,
      toName: rental.renter.name,
      body,
      hoursBeforeDue,
      providerSid: result.sid,
      status: result.status,
      sentAt: result.dateCreated,
    });

    rental.returnReminderSentAt = result.dateCreated;
    await rental.save();

    sent.push(message);
  }

  return { checked: dueRentals.length, sent };
}
