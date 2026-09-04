import crypto from 'crypto';

// ---------------------------------------------------------------------------
// MOCK SSLCommerz gateway.
//
// This file stands in for the real `sslcommerz-lts` SDK. It reproduces the
// three calls a real integration makes (init session, hosted checkout page,
// validate transaction) so the rest of the app (controllers, routes, React
// pages) is written exactly as it would be against the live gateway. Going
// live later means replacing the bodies of these three functions with real
// SSLCommerz API calls - nothing else in the codebase should need to change.
// ---------------------------------------------------------------------------

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

/**
 * Real equivalent: sslcz.init(data) -> POST securepay/api/v4/api.php
 * Returns a GatewayPageURL the browser is redirected to.
 */
export function initiateSession({ tranId, totalAmount, currency, customerName, customerEmail }) {
  const sessionKey = `mock_sess_${crypto.randomBytes(12).toString('hex')}`;

  return Promise.resolve({
    status: 'SUCCESS',
    sessionkey: sessionKey,
    // In production this points at SSLCommerz's hosted page. Here it points
    // at our own React "mock gateway" page which plays that role instead.
    GatewayPageURL: `${CLIENT_URL}/mock-gateway/${tranId}`,
    tran_id: tranId,
    amount: totalAmount,
    currency,
    customerName,
    customerEmail,
  });
}

/**
 * Real equivalent: sslcz.validate({ val_id }) -> GET validator/api/validationserverAPI.php
 * Confirms the transaction actually succeeded before trusting the client's
 * redirect. We fabricate a val_id at "payment time" and just echo it back,
 * since there's no real gateway on the other end to ask.
 */
export function validateTransaction({ tranId, valId, amount, currency }) {
  const isValid = Boolean(valId) && valId.startsWith('mock_val_');

  return Promise.resolve({
    status: isValid ? 'VALID' : 'INVALID_TRANSACTION',
    tran_id: tranId,
    val_id: valId,
    amount: String(amount),
    currency,
    tran_date: new Date().toISOString(),
    card_type: 'mock-visa',
    risk_level: '0',
    risk_title: 'Safe',
  });
}

export function generateValId() {
  return `mock_val_${crypto.randomBytes(10).toString('hex')}`;
}
