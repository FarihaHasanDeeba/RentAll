import Rental from '../models/Rental.js';
import Payment from '../models/Payment.js';
import Agreement from '../models/Agreement.js';
import MailMessage from '../models/MailMessage.js';
import { buildAgreementPdf } from './agreementPdfService.js';
import * as gmail from './gmailMockService.js';

// Generates the liability-terms PDF and mock-emails it to both the renter
// and the lender via Gmail. Called once automatically right after a
// two-tier payment completes, and again on demand from the "Resend" button.
export async function issueAgreement(rentalId) {
  const rental = await Rental.findById(rentalId)
    .populate('item', 'title dailyRate securityDeposit')
    .populate('renter', 'name email')
    .populate('lender', 'name email');
  if (!rental) throw Object.assign(new Error('Rental not found'), { status: 404 });
  if (rental.paymentStatus !== 'Paid') {
    throw Object.assign(new Error('Rental must be paid before an agreement can be issued'), { status: 409 });
  }

  const payment = rental.payment ? await Payment.findById(rental.payment) : null;
  const pdf = await buildAgreementPdf({ rental, payment });
  const fileName = `RentAll-Agreement-${rental._id}.pdf`;
  const generatedAt = new Date();

  const agreement = await Agreement.findOneAndUpdate(
    { rental: rental._id },
    { rental: rental._id, pdf, fileName, generatedAt },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const recipients = [
    { role: 'Renter', person: rental.renter },
    { role: 'Lender', person: rental.lender },
  ];

  const messages = [];
  for (const { role, person } of recipients) {
    const subject = `Your RentAll agreement for ${rental.item.title}`;
    const text =
      `Hi ${person.name},\n\n` +
      `Attached is the digital rental agreement for "${rental.item.title}" ` +
      `(${new Date(rental.startDate).toLocaleDateString()} - ${new Date(rental.endDate).toLocaleDateString()}). ` +
      `It covers liability, deposit, and late-return terms for this rental.\n\n— RentAll`;

    const sent = await gmail.sendMail({ to: person.email, subject, text, attachmentName: fileName });

    const message = await MailMessage.create({
      rental: rental._id,
      agreement: agreement._id,
      role,
      to: person.email,
      toName: person.name,
      subject,
      bodyText: text,
      attachmentName: fileName,
      gmailMessageId: sent.id,
      gmailThreadId: sent.threadId,
      sentAt: sent.sentAt,
    });
    messages.push(message);
  }

  return { agreement, messages };
}
