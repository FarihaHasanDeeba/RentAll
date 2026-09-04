import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Item from './models/Item.js';
import Rental from './models/Rental.js';
import Payment from './models/Payment.js';
import Agreement from './models/Agreement.js';
import MailMessage from './models/MailMessage.js';
import SmsMessage from './models/SmsMessage.js';
import DamageLog from './models/DamageLog.js';
import ChatMessage from './models/ChatMessage.js';
import Settlement from './models/Settlement.js';
import * as sslcommerz from './services/sslcommerzMockService.js';
import { computeLateFee } from './services/lateFeeService.js';
import { issueAgreement } from './services/agreementService.js';
import { settleRental } from './services/settlementService.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

async function seed() {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    Item.deleteMany({}),
    Rental.deleteMany({}),
    Payment.deleteMany({}),
    Agreement.deleteMany({}),
    MailMessage.deleteMany({}),
    SmsMessage.deleteMany({}),
    DamageLog.deleteMany({}),
    ChatMessage.deleteMany({}),
    Settlement.deleteMany({}),
  ]);

  const lender = await User.create({
    name: 'Rafiq Islam',
    email: 'rafiq.lender@example.com',
    phone: '01700000001',
    role: 'Lender',
  });

  const renter = await User.create({
    name: 'Nadia Chowdhury',
    email: 'nadia.renter@example.com',
    phone: '01700000002',
    role: 'Renter',
  });

  const renter2 = await User.create({
    name: 'Tanvir Ahmed',
    email: 'tanvir.renter@example.com',
    phone: '01700000003',
    role: 'Renter',
  });

  const items = await Item.insertMany([
    { title: 'DeWalt Cordless Drill Set', category: 'Power Tools', dailyRate: 250, securityDeposit: 3000, owner: lender._id },
    { title: 'Canon EOS R6 Camera Kit', category: 'Event Electronics', dailyRate: 1200, securityDeposit: 25000, owner: lender._id },
    { title: '4-Person Camping Tent', category: 'Camping Gear', dailyRate: 400, securityDeposit: 2000, owner: lender._id },
    { title: 'Brother Sewing Machine', category: 'Household', dailyRate: 150, securityDeposit: 4000, owner: lender._id },
    { title: 'Bosch Table Saw', category: 'Power Tools', dailyRate: 600, securityDeposit: 15000, owner: lender._id },
    { title: 'Epson Home Projector', category: 'Event Electronics', dailyRate: 500, securityDeposit: 8000, owner: lender._id },
    { title: 'Honda Portable Generator', category: 'Power Tools', dailyRate: 900, securityDeposit: 20000, owner: lender._id },
    { title: 'Yamaha PA Speaker Set', category: 'Event Electronics', dailyRate: 1000, securityDeposit: 12000, owner: lender._id },
    { title: 'Karcher Pressure Washer', category: 'Power Tools', dailyRate: 350, securityDeposit: 5000, owner: lender._id },
    { title: 'GoPro Action Camera Kit', category: 'Event Electronics', dailyRate: 300, securityDeposit: 6000, owner: lender._id },
    { title: 'Sony Wireless Mic Set', category: 'Event Electronics', dailyRate: 450, securityDeposit: 7000, owner: lender._id },
    { title: 'Black+Decker Hedge Trimmer', category: 'Power Tools', dailyRate: 200, securityDeposit: 2500, owner: lender._id },
    { title: 'Ryobi Cordless Vacuum', category: 'Household', dailyRate: 200, securityDeposit: 1500, owner: lender._id },
    { title: 'Bissell Carpet Cleaner', category: 'Household', dailyRate: 180, securityDeposit: 1800, owner: lender._id },
    { title: 'JBL PartyBox Speaker', category: 'Event Electronics', dailyRate: 550, securityDeposit: 9000, owner: lender._id },
  ]);
  const [
    drill, camera, tent, sewing, tableSaw, projector, generator, speakers,
    pressureWasher, goPro, wirelessMic, hedgeTrimmer, vacuum, carpetCleaner, jblSpeaker,
  ] = items;

  const MS_PER_HOUR = 60 * 60 * 1000;

  // Rental due `n` days from now, starting today.
  const upcoming = (n) => ({
    startDate: new Date(),
    endDate: new Date(Date.now() + n * MS_PER_DAY),
    days: n,
  });

  // Rental of length `n` days whose due date was `overdueByDays` days ago -
  // for exercising the Late Return Fee Generator without waiting for real time to pass.
  const overdue = (n, overdueByDays) => {
    const endDate = new Date(Date.now() - overdueByDays * MS_PER_DAY);
    return { startDate: new Date(endDate.getTime() - n * MS_PER_DAY), endDate, days: n };
  };

  // Rental due `hoursFromNow` hours from now - for exercising the Return
  // Window SMS Reminder without waiting for real time to pass.
  const dueInHours = (hoursFromNow) => {
    const endDate = new Date(Date.now() + hoursFromNow * MS_PER_HOUR);
    return { startDate: new Date(endDate.getTime() - MS_PER_DAY), endDate, days: 1 };
  };

  const amounts = (item, n) => {
    const rentalCost = item.dailyRate * n;
    return { rentalCost, totalAmount: rentalCost + item.securityDeposit };
  };

  function buildRental(item, renterDoc, dates, status, paymentStatus) {
    const { rentalCost, totalAmount } = amounts(item, dates.days);
    return Rental.create({
      item: item._id,
      renter: renterDoc._id,
      lender: lender._id,
      ...dates,
      dailyRate: item.dailyRate,
      securityDeposit: item.securityDeposit,
      rentalCost,
      totalAmount,
      status,
      paymentStatus,
      securityDepositStatus: paymentStatus === 'Paid' ? 'held' : 'pending',
    });
  }

  // Applies the same late-fee math the /return endpoint uses, so seeded
  // "already returned" rentals look exactly like ones returned through the UI.
  async function applyReturn(rental, actualReturnDate) {
    const { daysLate, lateFeeAmount, depositRefundAmount } = computeLateFee({
      dueDate: rental.endDate,
      actualReturnDate,
      dailyRate: rental.dailyRate,
      securityDeposit: rental.securityDeposit,
    });
    rental.status = 'Returned';
    rental.actualReturnDate = actualReturnDate;
    rental.daysLate = daysLate;
    rental.lateFeeAmount = lateFeeAmount;
    rental.depositRefundAmount = depositRefundAmount;
    await rental.save();
    return rental;
  }

  // --- Scenario 1-2: plain unpaid rentals, ready for the happy path ---
  const rDrill = await buildRental(drill, renter, upcoming(3), 'Requested', 'Pending');
  const rTent = await buildRental(tent, renter, upcoming(5), 'Requested', 'Pending');

  // --- Scenario 3: a second renter's unpaid rental (multi-user check) ---
  const rProjector = await buildRental(projector, renter2, upcoming(2), 'Requested', 'Pending');

  // --- Scenario 4: high-value item, large deposit (stress-tests formatting) ---
  const rGenerator = await buildRental(generator, renter2, upcoming(6), 'Requested', 'Pending');

  // --- Scenario 5: already completed payment, so /checkout shows the
  //     "already paid" state and /payment/result shows a COMPLETED receipt ---
  const rCamera = await buildRental(camera, renter, upcoming(4), 'Requested', 'Pending');
  {
    const tranId = `RENT-${rCamera._id.toString().slice(-6)}-seed01`;
    const session = await sslcommerz.initiateSession({
      tranId,
      totalAmount: rCamera.totalAmount,
      currency: 'BDT',
      customerName: renter.name,
      customerEmail: renter.email,
    });
    const valId = sslcommerz.generateValId();
    const validation = await sslcommerz.validateTransaction({
      tranId,
      valId,
      amount: rCamera.totalAmount,
      currency: 'BDT',
    });
    const payment = await Payment.create({
      rental: rCamera._id,
      renter: renter._id,
      tranId,
      sessionKey: session.sessionkey,
      valId,
      rentalAmount: rCamera.rentalCost,
      securityDeposit: rCamera.securityDeposit,
      totalAmount: rCamera.totalAmount,
      status: 'COMPLETED',
      gatewayResponse: validation,
      paidAt: new Date(),
    });
    rCamera.payment = payment._id;
    rCamera.paymentStatus = 'Paid';
    rCamera.securityDepositStatus = 'held';
    await rCamera.save();
    await issueAgreement(rCamera._id);
  }

  // --- Scenario 6: a previously failed payment attempt, rental still
  //     needs payment - checkout page should let the renter retry ---
  const rSaw = await buildRental(tableSaw, renter, upcoming(2), 'Requested', 'Pending');
  {
    const tranId = `RENT-${rSaw._id.toString().slice(-6)}-seed02`;
    const session = await sslcommerz.initiateSession({
      tranId,
      totalAmount: rSaw.totalAmount,
      currency: 'BDT',
      customerName: renter.name,
      customerEmail: renter.email,
    });
    await Payment.create({
      rental: rSaw._id,
      renter: renter._id,
      tranId,
      sessionKey: session.sessionkey,
      rentalAmount: rSaw.rentalCost,
      securityDeposit: rSaw.securityDeposit,
      totalAmount: rSaw.totalAmount,
      status: 'FAILED',
      gatewayResponse: { status: 'INVALID_TRANSACTION' },
    });
    rSaw.paymentStatus = 'Failed';
    await rSaw.save();
  }

  // --- Scenario 7: a cancelled checkout attempt (renter backed out on the
  //     mock gateway page) - rental stays Pending, ready to try again ---
  const rSpeakers = await buildRental(speakers, renter2, upcoming(3), 'Requested', 'Pending');
  {
    const tranId = `RENT-${rSpeakers._id.toString().slice(-6)}-seed03`;
    const session = await sslcommerz.initiateSession({
      tranId,
      totalAmount: rSpeakers.totalAmount,
      currency: 'BDT',
      customerName: renter2.name,
      customerEmail: renter2.email,
    });
    await Payment.create({
      rental: rSpeakers._id,
      renter: renter2._id,
      tranId,
      sessionKey: session.sessionkey,
      rentalAmount: rSpeakers.rentalCost,
      securityDeposit: rSpeakers.securityDeposit,
      totalAmount: rSpeakers.totalAmount,
      status: 'CANCELLED',
    });
  }

  // --- Scenario 8: cheapest possible rental (small numbers, one day) ---
  const rSewing = await buildRental(sewing, renter, upcoming(1), 'Requested', 'Pending');

  // --- Scenario 9: paid, due 2 days ago, not yet returned - the everyday
  //     late-fee case. Open /return/:id and the preview should already show ~2 days late. ---
  const rWasher = await buildRental(pressureWasher, renter, overdue(3, 2), 'Checked Out', 'Paid');
  await issueAgreement(rWasher._id);

  // --- Scenario 10: paid, due 20 days ago, not yet returned - the fee this
  //     late would exceed the deposit, so the preview should show it capped. ---
  const rGoPro = await buildRental(goPro, renter2, overdue(2, 20), 'Checked Out', 'Paid');
  await issueAgreement(rGoPro._id);

  // --- Scenario 11: paid, due 1 day from now, not yet returned - returning
  //     "now" should preview as on-time (0 fee). ---
  const rTrimmerUpcoming = await buildRental(hedgeTrimmer, renter2, upcoming(1), 'Checked Out', 'Paid');
  await issueAgreement(rTrimmerUpcoming._id);

  // --- Scenario 12: already returned on time - /return/:id should render
  //     the read-only receipt with a full deposit refund. ---
  const rMic = await buildRental(wirelessMic, renter, overdue(3, 1), 'Checked Out', 'Paid');
  await issueAgreement(rMic._id);
  await applyReturn(rMic, rMic.endDate);

  // --- Scenario 13: already returned late - /return/:id should render the
  //     read-only receipt showing the fee that was deducted. ---
  const rTrimmerLate = await buildRental(hedgeTrimmer, renter, overdue(4, 5), 'Checked Out', 'Paid');
  await issueAgreement(rTrimmerLate._id);
  await applyReturn(rTrimmerLate, new Date(rTrimmerLate.endDate.getTime() + 3 * MS_PER_DAY));

  // --- Scenario 14: paid, due in 3 hours - inside the 6h reminder window.
  //     No reminder sent yet, so POST /api/reminders/run should text this one. ---
  const rVacuum = await buildRental(vacuum, renter, dueInHours(3), 'Checked Out', 'Paid');
  await issueAgreement(rVacuum._id);

  // --- Scenario 15: paid, due in 5 hours - also inside the window, second
  //     renter, so the sweep demonstrates texting more than one person. ---
  const rCarpetCleaner = await buildRental(carpetCleaner, renter2, dueInHours(5), 'Checked Out', 'Paid');
  await issueAgreement(rCarpetCleaner._id);

  // --- Scenario 13 revisited: file a damage claim + chat transcript against
  //     the already-returned, already-late hedge trimmer rental, and leave it
  //     unsettled - this is the primary "needs admin review" case. ---
  await DamageLog.create({
    rental: rTrimmerLate._id,
    reportedBy: lender._id,
    description: 'The trimmer\'s blade guard arrived cracked and one battery no longer holds a charge.',
    claimedAmount: 900,
  });
  const trimmerChat = [
    { role: 'Lender', body: 'Hi Nadia, I noticed the blade guard is cracked and a battery seems dead after inspecting the return. Could you let me know what happened?' },
    { role: 'Renter', body: "Sorry about that - it slipped off a ladder on the last day. Didn't think it cracked anything though." },
    { role: 'Lender', body: "It did crack the guard, and one of the two batteries won't hold charge anymore. I've filed a damage claim for 900 to cover a replacement guard + battery." },
    { role: 'Renter', body: "That seems steep for a small crack, but I understand equipment needs to be replaced. I'll leave it to RentAll to sort out a fair split." },
  ];
  for (const m of trimmerChat) {
    const sender = m.role === 'Lender' ? lender._id : renter._id;
    await ChatMessage.create({ rental: rTrimmerLate._id, sender, role: m.role, body: m.body });
  }

  // --- Scenario 16: paid, returned on time, no dispute, and already
  //     settled by the admin panel - the "Checked & Approved" end state. ---
  const rSpeakerSettled = await buildRental(jblSpeaker, renter2, overdue(2, 3), 'Checked Out', 'Paid');
  await issueAgreement(rSpeakerSettled._id);
  await applyReturn(rSpeakerSettled, rSpeakerSettled.endDate);
  const speakerSettlement = await settleRental(rSpeakerSettled._id, {
    amountToRenter: rSpeakerSettled.depositRefundAmount,
    adminNote: 'No damage reported, returned on time - full deposit refunded to renter.',
  });

  console.log('\nSeed complete. 16 rentals created:\n');
  console.log('Ready to pay (happy path):');
  console.log(`  - ${drill.title.padEnd(28)} ${rDrill._id}`);
  console.log(`  - ${tent.title.padEnd(28)} ${rTent._id}`);
  console.log(`  - ${sewing.title.padEnd(28)} ${rSewing._id}  (smallest amounts)`);
  console.log(`  - ${projector.title.padEnd(28)} ${rProjector._id}  (renter: ${renter2.email})`);
  console.log(`  - ${generator.title.padEnd(28)} ${rGenerator._id}  (largest amounts)`);
  console.log('\nAlready paid (view receipt / re-pay should be blocked):');
  console.log(`  - ${camera.title.padEnd(28)} ${rCamera._id}`);
  console.log('\nPrevious attempt failed (retry should work):');
  console.log(`  - ${tableSaw.title.padEnd(28)} ${rSaw._id}`);
  console.log('\nPrevious attempt cancelled (rental still Pending, retry should work):');
  console.log(`  - ${speakers.title.padEnd(28)} ${rSpeakers._id}`);
  console.log('\nLate Return Fee Generator - paid, not yet returned:');
  console.log(`  - ${pressureWasher.title.padEnd(28)} ${rWasher._id}  (2 days overdue)`);
  console.log(`  - ${goPro.title.padEnd(28)} ${rGoPro._id}  (20 days overdue, fee should cap at deposit)`);
  console.log(`  - ${hedgeTrimmer.title.padEnd(28)} ${rTrimmerUpcoming._id}  (due tomorrow, still on-time)`);
  console.log('\nLate Return Fee Generator - already returned:');
  console.log(`  - ${wirelessMic.title.padEnd(28)} ${rMic._id}  (returned on time, full refund)`);
  console.log(`  - ${hedgeTrimmer.title.padEnd(28)} ${rTrimmerLate._id}  (returned 3 days late, fee deducted)`);
  console.log(`\nRenters: ${renter.email} (most rentals), ${renter2.email}`);
  console.log('\nDigital Rental Agreement Mailing: 8 agreements auto-issued for the paid');
  console.log('rentals above (2 emails each) - check GET /api/mailbox or the Mailbox page.');
  console.log(`  - ${drill.title.padEnd(28)} ${rDrill._id}  (Pending - agreement page should say "pay first")`);
  console.log('\nReturn Window SMS Reminders - paid, due soon, not yet texted:');
  console.log(`  - ${vacuum.title.padEnd(28)} ${rVacuum._id}  (due in 3h - inside the 6h window)`);
  console.log(`  - ${carpetCleaner.title.padEnd(28)} ${rCarpetCleaner._id}  (due in 5h - inside the 6h window, renter: ${renter2.email})`);
  console.log(`  - ${hedgeTrimmer.title.padEnd(28)} ${rTrimmerUpcoming._id}  (due in 24h - outside the window, should NOT be texted)`);
  console.log('POST /api/reminders/run (or the "Run sweep now" button on /reminders) sends them.');
  console.log('\nAdmin Escrow Settlement Panel - open /admin to review:');
  console.log(`  - ${hedgeTrimmer.title.padEnd(28)} ${rTrimmerLate._id}  (damage claim + 4-message chat, UNSETTLED - try settling it)`);
  console.log(`  - ${wirelessMic.title.padEnd(28)} ${rMic._id}  (no dispute, UNSETTLED - simple full-refund case)`);
  console.log(`  - ${jblSpeaker.title.padEnd(28)} ${rSpeakerSettled._id}  (already SETTLED: ${speakerSettlement.amountToRenter} to renter, ${speakerSettlement.amountToLender} to lender)`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
