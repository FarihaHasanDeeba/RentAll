import request from 'supertest';
import app from '../app.js';
import Rental from '../models/Rental.js';
import Payment from '../models/Payment.js';
import { verifyAmount } from '../controllers/paymentController.js';
import { buildScenario } from './fixtures.js';

// Spec scenario: daily rate 500 x 3 days = 1500 rental cost, +5000 deposit = 6500 total.
describe('Two-Tier Payment Processing', () => {
  it('Test 1 - normal payment: server computes rentalAmount/securityDeposit/totalAmount independently of the client', async () => {
    const { rental } = await buildScenario();

    const res = await request(app).post('/api/payments/initiate').send({ rentalId: rental._id.toString() });

    expect(res.status).toBe(201);
    expect(res.body.breakdown).toEqual({
      rentalAmount: 1500,
      securityDeposit: 5000,
      totalAmount: 6500,
      currency: 'BDT',
    });

    const payment = await Payment.findOne({ tranId: res.body.tranId });
    expect(payment).not.toBeNull();
    expect(payment.rentalAmount).toBe(1500);
    expect(payment.securityDeposit).toBe(5000);
    expect(payment.totalAmount).toBe(6500);
    expect(payment.status).toBe('PROCESSING');
  });

  it('the client cannot influence the charged amount even if it sends its own numbers', async () => {
    const { rental } = await buildScenario();

    // initiatePayment only reads rentalId from the body - extra fields are ignored.
    const res = await request(app)
      .post('/api/payments/initiate')
      .send({ rentalId: rental._id.toString(), totalAmount: 1, rentalAmount: 1, securityDeposit: 1 });

    expect(res.status).toBe(201);
    expect(res.body.breakdown.totalAmount).toBe(6500);
  });

  it('Test 2 - successful SSLCommerz payment: paymentStatus -> paid, securityDepositStatus -> held', async () => {
    const { rental } = await buildScenario();
    const init = await request(app).post('/api/payments/initiate').send({ rentalId: rental._id.toString() });
    const { tranId } = init.body;

    const confirm = await request(app).post(`/api/payments/mock-gateway/${tranId}/confirm`);

    expect(confirm.status).toBe(200);
    expect(confirm.body.status).toBe('COMPLETED');

    const payment = await Payment.findOne({ tranId });
    expect(payment.status).toBe('COMPLETED');
    expect(payment.paidAt).not.toBeNull();

    const updated = await Rental.findById(rental._id);
    expect(updated.paymentStatus).toBe('Paid');
    expect(updated.securityDepositStatus).toBe('held');
  });

  it('Test 3 - failed payment: rental is not treated as paid', async () => {
    const { rental } = await buildScenario();
    const init = await request(app).post('/api/payments/initiate').send({ rentalId: rental._id.toString() });
    const { tranId } = init.body;

    const fail = await request(app).post(`/api/payments/mock-gateway/${tranId}/fail`);
    expect(fail.status).toBe(200);
    expect(fail.body.status).toBe('FAILED');

    const payment = await Payment.findOne({ tranId });
    expect(payment.status).toBe('FAILED');

    const updated = await Rental.findById(rental._id);
    expect(updated.paymentStatus).toBe('Failed');
    expect(updated.securityDepositStatus).toBe('pending'); // never became held
  });

  it('Test 4 - cancelled payment: no deposit is considered held', async () => {
    const { rental } = await buildScenario();
    const init = await request(app).post('/api/payments/initiate').send({ rentalId: rental._id.toString() });
    const { tranId } = init.body;

    const cancel = await request(app).post(`/api/payments/mock-gateway/${tranId}/cancel`);
    expect(cancel.status).toBe(200);
    expect(cancel.body.status).toBe('CANCELLED');

    const payment = await Payment.findOne({ tranId });
    expect(payment.status).toBe('CANCELLED');

    const updated = await Rental.findById(rental._id);
    expect(updated.paymentStatus).toBe('Pending'); // untouched by cancellation
    expect(updated.securityDepositStatus).toBe('pending');
  });

  it('Test 5 - amount tampering: the verifyAmount guard rejects a mismatched gateway amount', () => {
    // This exercises the guard wired into confirmMockPayment directly. Our
    // mock gateway always echoes back the amount it's given (there's no
    // independent "gateway side" for it to diverge from over HTTP the way a
    // live SSLCommerz IPN payload could), so this proves the comparison
    // logic itself is correct rather than trying to force the mock to lie.
    expect(verifyAmount(6500, 6500)).toBe(true);
    expect(verifyAmount(6500, '6500')).toBe(true); // gateway amounts arrive as strings
    expect(verifyAmount(6500, 1500)).toBe(false);
    expect(verifyAmount(6500, '1500')).toBe(false);
  });

  it('Test 6 - duplicate callback: only one successful state transition happens', async () => {
    const { rental } = await buildScenario();
    const init = await request(app).post('/api/payments/initiate').send({ rentalId: rental._id.toString() });
    const { tranId } = init.body;

    const first = await request(app).post(`/api/payments/mock-gateway/${tranId}/confirm`);
    expect(first.status).toBe(200);
    const afterFirst = await Payment.findOne({ tranId });
    const firstPaidAt = afterFirst.paidAt.getTime();

    const second = await request(app).post(`/api/payments/mock-gateway/${tranId}/confirm`);
    expect(second.status).toBe(200);
    expect(second.body.status).toBe('COMPLETED');

    const allPayments = await Payment.find({ tranId });
    expect(allPayments).toHaveLength(1); // no duplicate payment record

    const afterSecond = await Payment.findOne({ tranId });
    expect(afterSecond.paidAt.getTime()).toBe(firstPaidAt); // untouched by the replay
  });
});
