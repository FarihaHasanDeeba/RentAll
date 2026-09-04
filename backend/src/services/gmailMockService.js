import crypto from 'crypto';

// ---------------------------------------------------------------------------
// MOCK Gmail API.
//
// Stands in for `gmail.users.messages.send` from the `googleapis` SDK, which
// expects a base64url-encoded RFC 2822 MIME message and returns
// { id, threadId, labelIds }. This mock skips OAuth and the real MIME
// encoding but returns the same response shape, so swapping in the real
// call later only means rewriting the body of sendMail().
// ---------------------------------------------------------------------------

export function sendMail({ to, subject, text, attachmentName }) {
  const id = `mock_gmail_${crypto.randomBytes(8).toString('hex')}`;
  const threadId = `mock_thread_${crypto.randomBytes(8).toString('hex')}`;

  return Promise.resolve({
    id,
    threadId,
    labelIds: ['SENT'],
    to,
    subject,
    text,
    attachmentName,
    sentAt: new Date(),
  });
}
