import Agreement from '../models/Agreement.js';
import MailMessage from '../models/MailMessage.js';
import { issueAgreement } from '../services/agreementService.js';
import { LIABILITY_CLAUSES } from '../services/agreementPdfService.js';

// POST /api/rentals/:id/agreement/send
export async function sendAgreement(req, res) {
  const { agreement, messages } = await issueAgreement(req.params.id);
  res.status(201).json({
    agreementId: agreement._id,
    generatedAt: agreement.generatedAt,
    messages: messages.map(({ role, to, toName, sentAt, gmailMessageId }) => ({
      role,
      to,
      toName,
      sentAt,
      gmailMessageId,
    })),
  });
}

// GET /api/rentals/:id/agreement
export async function getAgreementForRental(req, res) {
  const agreement = await Agreement.findOne({ rental: req.params.id }).select('-pdf');
  if (!agreement) return res.status(404).json({ message: 'No agreement has been issued for this rental yet' });

  const messages = await MailMessage.find({ rental: req.params.id }).sort({ sentAt: -1 });
  res.json({ agreement, messages, clauses: LIABILITY_CLAUSES });
}

// GET /api/agreements/:id/pdf
export async function streamAgreementPdf(req, res) {
  const agreement = await Agreement.findById(req.params.id);
  if (!agreement) return res.status(404).json({ message: 'Agreement not found' });

  res.set('Content-Type', 'application/pdf');
  res.set('Content-Disposition', `attachment; filename="${agreement.fileName}"`);
  res.send(agreement.pdf);
}

// GET /api/mailbox
export async function listMailbox(req, res) {
  const messages = await MailMessage.find()
    .populate({ path: 'rental', select: 'item', populate: { path: 'item', select: 'title' } })
    .sort({ sentAt: -1 });
  res.json(messages);
}

// GET /api/mailbox/:id
export async function getMailMessage(req, res) {
  const message = await MailMessage.findById(req.params.id).populate({
    path: 'rental',
    populate: { path: 'item', select: 'title' },
  });
  if (!message) return res.status(404).json({ message: 'Message not found' });
  res.json(message);
}
