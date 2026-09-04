import crypto from 'crypto';

// ---------------------------------------------------------------------------
// MOCK SMS API.
//
// Stands in for a real SMS gateway's "send message" call (Twilio-shaped:
// POST /Messages.json -> { sid, status, to, from, body, date_created }).
// No carrier, no phone number, no network call - just the same response
// shape, so wiring in a real provider later means rewriting this one file.
// ---------------------------------------------------------------------------

export function sendSms({ to, body }) {
  const sid = `mock_sms_${crypto.randomBytes(8).toString('hex')}`;

  return Promise.resolve({
    sid,
    status: 'sent',
    to,
    from: '+8809606999999',
    body,
    dateCreated: new Date(),
  });
}
