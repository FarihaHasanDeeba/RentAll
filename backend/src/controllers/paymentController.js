import crypto from 'crypto';
import Rental from '../models/Rental.js';
import Payment from '../models/Payment.js';
import * as sslcommerz from '../services/sslcommerzMockService.js';
import { issueAgreement } from '../services/agreementService.js';

// The gateway's returned amount must match what we expect to have charged -
// a mismatch means the transaction result can't be trusted, tampered or not.
// (Exported so it can be unit-tested directly: our mock gateway always
// echoes back the amount it's given, so it can't itself produce a mismatch
// over HTTP the way a live gateway divergence could.)
export function verifyAmount(expectedAmount, gatewayAmount) {
  return Number(gatewayAmount) === Number(expectedAmount);
}

// POST /api/payments/initiate  { rentalId }
// Charges the two tiers together as one transaction total, while keeping
// the rental cost and security deposit tracked as separate line items.
export async function initiatePayment(req, res) {
  const { rentalId } = req.body;
  if (!rentalId) return res.status(400).json({ message: 'rentalId is required' });

  const rental = await Rental.findById(rentalId).populate('renter');
  if (!rental) return res.status(404).json({ message: 'Rental not found' });

  if (rental.paymentStatus === 'Paid') {
    return res.status(409).json({ message: 'This rental has already been paid for' });
  }

  const tranId = `RENT-${rental._id.toString().slice(-6)}-${crypto.randomBytes(4).toString('hex')}`;

  const session = await sslcommerz.initiateSession({
    tranId,
    totalAmount: rental.totalAmount,
    currency: 'BDT',
    customerName: rental.renter.name,
    customerEmail: rental.renter.email,
  });

  const payment = await Payment.create({
    rental: rental._id,
    renter: rental.renter._id,
    tranId,
    sessionKey: session.sessionkey,
    rentalAmount: rental.rentalCost,
    securityDeposit: rental.securityDeposit,
    totalAmount: rental.totalAmount,
    status: 'PROCESSING',
  });

  rental.payment = payment._id;
  await rental.save();

  res.status(201).json({
    tranId,
    gatewayPageURL: session.GatewayPageURL,
    breakdown: {
      rentalAmount: payment.rentalAmount,
      securityDeposit: payment.securityDeposit,
      totalAmount: payment.totalAmount,
      currency: payment.currency,
    },
  });
}

// GET /api/payments/tran/:tranId
// Used by the mock gateway page and the result page to render amounts.
export async function getPaymentByTranId(req, res) {
  const payment = await Payment.findOne({ tranId: req.params.tranId }).populate({
    path: 'rental',
    populate: { path: 'item', select: 'title' },
  });
  if (!payment) return res.status(404).json({ message: 'Payment not found' });
  res.json(payment);
}

// POST /api/payments/mock-gateway/:tranId/confirm
// Plays the role of SSLCommerz's success redirect + IPN validation call.
export async function confirmMockPayment(req, res) {
  const payment = await Payment.findOne({ tranId: req.params.tranId });
  if (!payment) return res.status(404).json({ message: 'Payment not found' });
  if (payment.status === 'COMPLETED') {
    return res.json({ status: 'COMPLETED', tranId: payment.tranId });
  }

  const valId = sslcommerz.generateValId();
  const validation = await sslcommerz.validateTransaction({
    tranId: payment.tranId,
    valId,
    amount: payment.totalAmount,
    currency: payment.currency,
  });

  const amountOk = verifyAmount(payment.totalAmount, validation.amount);

  if (validation.status !== 'VALID' || !amountOk) {
    payment.status = 'FAILED';
    payment.gatewayResponse = validation;
    await payment.save();
    const message = amountOk ? 'Gateway validation failed' : 'Gateway amount did not match the expected charge';
    return res.status(402).json({ status: 'FAILED', message });
  }

  payment.status = 'COMPLETED';
  payment.valId = valId;
  payment.paidAt = new Date();
  payment.gatewayResponse = validation;
  await payment.save();

  await Rental.findByIdAndUpdate(payment.rental, {
    paymentStatus: 'Paid',
    securityDepositStatus: 'held',
  });

  // The rental agreement is issued right after payment succeeds. A failure
  // here (e.g. PDF generation) shouldn't roll back a completed payment -
  // the "Resend" button on the agreement page covers retrying it.
  try {
    await issueAgreement(payment.rental);
  } catch (err) {
    console.error('[agreement] failed to auto-issue after payment', err);
  }

  res.json({ status: 'COMPLETED', tranId: payment.tranId });
}

// POST /api/payments/mock-gateway/:tranId/cancel
export async function cancelMockPayment(req, res) {
  const payment = await Payment.findOneAndUpdate(
    { tranId: req.params.tranId },
    { status: 'CANCELLED' },
    { new: true }
  );
  if (!payment) return res.status(404).json({ message: 'Payment not found' });
  res.json({ status: 'CANCELLED', tranId: payment.tranId });
}

// POST /api/payments/mock-gateway/:tranId/fail
export async function failMockPayment(req, res) {
  const payment = await Payment.findOneAndUpdate(
    { tranId: req.params.tranId },
    { status: 'FAILED' },
    { new: true }
  );
  if (!payment) return res.status(404).json({ message: 'Payment not found' });
  await Rental.findByIdAndUpdate(payment.rental, { paymentStatus: 'Failed' });
  res.json({ status: 'FAILED', tranId: payment.tranId });
}
