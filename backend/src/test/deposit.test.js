import request from 'supertest';
import app from '../app.js';
import Rental from '../models/Rental.js';
import Settlement from '../models/Settlement.js';
import { buildScenario } from './fixtures.js';

// Simulates a rental that has already been paid and returned, with the Late
// Return Fee Generator's numbers already applied - i.e. it's sitting in the
// Admin Escrow Settlement Panel's queue, ready to be distributed.
async function buildReturnedRental({ lateFeeAmount = 0 } = {}) {
  const { rental, renter, lender } = await buildScenario({ paymentStatus: 'Paid' });
  rental.status = 'Returned';
  rental.actualReturnDate = new Date();
  rental.lateFeeAmount = lateFeeAmount;
  rental.depositRefundAmount = rental.securityDeposit - lateFeeAmount;
  await rental.save();
  return { rental, renter, lender };
}

describe('Security Deposit Lifecycle (Admin Escrow Settlement)', () => {
  it('Test 7 - full deposit refund: no damage, no late fee', async () => {
    const { rental } = await buildReturnedRental({ lateFeeAmount: 0 });
    expect(rental.depositRefundAmount).toBe(5000);

    const res = await request(app)
      .post(`/api/admin/rentals/${rental._id}/settle`)
      .send({ amountToRenter: 5000, adminNote: 'No issues.' });

    expect(res.status).toBe(201);
    expect(res.body.amountToRenter).toBe(5000);
    expect(res.body.amountToLender).toBe(0);

    const updated = await Rental.findById(rental._id);
    expect(updated.securityDepositStatus).toBe('refunded');
    expect(updated.paymentStatus).toBe('Refunded');
    expect(updated.status).toBe('Checked & Approved');
  });

  it('Test 8 - partial deposit refund: damage penalty deducted', async () => {
    const { rental } = await buildReturnedRental({ lateFeeAmount: 0 });

    const res = await request(app)
      .post(`/api/admin/rentals/${rental._id}/settle`)
      .send({ amountToRenter: 4000, adminNote: 'Deducted 1000 for damage.' });

    expect(res.status).toBe(201);
    expect(res.body.amountToRenter).toBe(4000);
    expect(res.body.amountToLender).toBe(1000);

    const updated = await Rental.findById(rental._id);
    expect(updated.securityDepositStatus).toBe('partially_refunded');
  });

  it('Test 9 - deposit fully deducted: claims consume the entire deposit', async () => {
    const { rental } = await buildReturnedRental({ lateFeeAmount: 0 });

    const res = await request(app)
      .post(`/api/admin/rentals/${rental._id}/settle`)
      .send({ amountToRenter: 0, adminNote: 'Damage exceeded the deposit; deposit fully retained.' });

    expect(res.status).toBe(201);
    expect(res.body.amountToRenter).toBe(0);
    expect(res.body.amountToLender).toBe(5000);

    const updated = await Rental.findById(rental._id);
    expect(updated.securityDepositStatus).toBe('deducted');
  });

  it('rejects a split that exceeds the held deposit rather than allowing a negative refund', async () => {
    const { rental } = await buildReturnedRental({ lateFeeAmount: 0 });

    const res = await request(app)
      .post(`/api/admin/rentals/${rental._id}/settle`)
      .send({ amountToRenter: 999999 });

    expect(res.status).toBe(400);
    const settlementCount = await Settlement.countDocuments({ rental: rental._id });
    expect(settlementCount).toBe(0); // nothing was created
  });

  it('rejects settling the same rental twice', async () => {
    const { rental } = await buildReturnedRental({ lateFeeAmount: 0 });
    await request(app).post(`/api/admin/rentals/${rental._id}/settle`).send({ amountToRenter: 5000 });

    const secondAttempt = await request(app)
      .post(`/api/admin/rentals/${rental._id}/settle`)
      .send({ amountToRenter: 0 });

    expect(secondAttempt.status).toBe(409);
    const settlementCount = await Settlement.countDocuments({ rental: rental._id });
    expect(settlementCount).toBe(1); // still only the first one
  });

  // Test 10 - Unauthorized Access: deliberately not implemented. This
  // codebase has no authentication/authorization layer anywhere (confirmed
  // by inspection - no login route, no session/JWT middleware, no `req.user`
  // in any controller). Every route trusts whatever id is in the URL. Adding
  // real per-user authorization would mean building a login system across
  // the whole app, which is out of scope for this feature and was explicitly
  // deferred per a decision made during this task's inspection step rather
  // than silently faked here.
  it.skip('Test 10 - unauthorized access (SKIPPED: no auth system exists in this app - see report)', () => {});
});
