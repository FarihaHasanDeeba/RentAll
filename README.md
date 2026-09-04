# RentAll

Hyperlocal tool & equipment sharing platform. This repo currently implements
all five features from the **Payment Operations & Reminders** module:

- **Two-Tier Payment Processing** — charges the daily rental cost and the
  refundable security deposit together as one transaction, while tracking
  them as separate line items (`Payment.rentalAmount` / `Payment.securityDeposit`).
- **Late Return Fee Generator** — when an item is marked returned, automatically
  computes a late fee (1.5x the daily rate per day late, capped at the deposit)
  and deducts it from the refundable security deposit.
- **Digital Rental Agreement Mailing** — once payment completes, generates a
  PDF rental agreement covering liability and late-return terms and "emails"
  it to both the renter and the lender.
- **Return Window SMS Reminders** — a background sweep automatically texts the
  renter once their rental is within 6 hours of its due date.
- **Admin Escrow Settlement Panel** — lets an admin review damage claims and
  the renter/lender chat transcript for a returned rental, then split the
  held deposit between refunding the renter and compensating the lender.

## Stack

- `backend/` — Node.js, Express, MongoDB/Mongoose
- `frontend/` — React (Vite), Tailwind CSS, React Router

## About the mocked integrations

Nothing here talks to a real payment gateway or a real inbox — there are no
SSLCommerz or Google credentials involved. Instead, each external service is
stood in for by a mock module shaped like the real API it replaces, so
swapping in real credentials later means rewriting one file, not restructuring
the app:

- `backend/src/services/sslcommerzMockService.js` mimics the three calls a real
  SSLCommerz integration makes (`init`, hosted checkout page, `validate`).
  The "hosted checkout page" is a page in this app (`/mock-gateway/:tranId`)
  instead of SSLCommerz's servers.
- `backend/src/services/gmailMockService.js` mimics `gmail.users.messages.send`
  from the `googleapis` SDK — same `{ id, threadId, labelIds }` response shape,
  no OAuth or real MIME encoding. Every "sent" email is saved as a `MailMessage`
  and viewable on the in-app **Mailbox** page (`/mailbox`), which plays the
  role of the recipient's real inbox.
- The rental agreement PDF itself is **real** — generated on the server with
  `pdfkit`, no template service involved. Download it from the Agreement page
  or via `GET /api/agreements/:id/pdf`.
- `backend/src/services/smsMockService.js` mimics a Twilio-shaped SMS send call
  (`{ sid, status, to, from, body }`). Every "sent" text is saved as an
  `SmsMessage` and viewable on the **Reminders** page (`/reminders`).

## Running locally

Requires a local MongoDB running at `mongodb://127.0.0.1:27017`.

```bash
# backend
cd backend
cp .env.example .env
npm install
npm run seed   # creates demo users, items, rentals, agreements & mail
npm run dev    # http://localhost:5000

# frontend (separate terminal)
cd frontend
npm install
npm run dev    # http://localhost:5173
```

Open http://localhost:5173, pick a "Pending" rental, and pay it through
the mock gateway. Paying automatically issues and "mails" the rental
agreement — check the Mailbox page to see it.

## Payment flow

1. `POST /api/payments/initiate { rentalId }` — creates a `Payment` record
   and returns a `gatewayPageURL`.
2. Browser is routed to `/mock-gateway/:tranId`, which stands in for
   SSLCommerz's hosted checkout.
3. `POST /api/payments/mock-gateway/:tranId/confirm` — plays the role of
   SSLCommerz's success redirect + server-side validation call. Marks the
   `Payment` `COMPLETED` and the `Rental.paymentStatus` `Paid`, then issues
   the rental agreement (see below).
4. `/payment/result/:tranId` shows the final breakdown.

`.../cancel` and `.../fail` are also wired up (buttons on the mock gateway
page) to exercise the non-happy paths.

## Late return flow

1. `GET /api/rentals/:id/return-preview?at=<ISO timestamp>` — live late-fee
   calculation for a candidate return time, no writes. Used by the return
   form (`/return/:rentalId`) as the renter/lender picks a date.
2. `POST /api/rentals/:id/return { actualReturnDate }` — finalizes the return,
   marks the rental `Returned`, and permanently records `daysLate`,
   `lateFeeAmount`, and `depositRefundAmount`.

Policy lives in `backend/src/services/lateFeeService.js`: 1.5x the daily rate
per day (or part-day) late, withheld from the deposit, capped so it never
exceeds it.

## Agreement mailing flow

1. `POST /api/rentals/:id/agreement/send` — builds the PDF
   (`agreementPdfService.js`), saves it as an `Agreement`, and calls the mock
   Gmail service once per party, each creating a `MailMessage`. Fires
   automatically right after a payment completes; also available as a manual
   "Issue" / "Resend" button on `/agreement/:rentalId`.
2. `GET /api/rentals/:id/agreement` — the issued agreement + its send history
   for one rental.
3. `GET /api/agreements/:id/pdf` — streams the PDF.
4. `GET /api/mailbox` — every mock email ever sent, across all rentals; powers
   the `/mailbox` page.

## Return window SMS reminders

`backend/src/services/reminderScheduler.js` starts a background sweep when the
server boots (`checkAndSendReminders()` from `reminderService.js`) — once
immediately, then every 5 minutes. A rental qualifies once it's `Paid`, not
yet returned, and its `endDate` is within `REMINDER_WINDOW_HOURS` (6) but
hasn't passed. Each rental is texted at most once, tracked via
`Rental.returnReminderSentAt`.

1. `POST /api/reminders/run` — runs the same sweep on demand (the "Run sweep
   now" button on `/reminders`), so the demo doesn't depend on waiting for
   the real clock or the next 5-minute tick.
2. `GET /api/reminders` — every text ever sent; powers the `/reminders` page.
3. `GET /api/rentals/:id/reminder` — reminder status for one rental.

## Admin escrow settlement panel

There's no login system in this app, so "admin" is just a route
(`/admin`) rather than a gated role — anyone can open it, same as every other
page here. The renter/lender side of a dispute lives at `/dispute/:rentalId`:

1. `POST /api/rentals/:id/damage-logs` / `GET .../damage-logs` — the lender
   files a damage claim (description + claimed amount) after inspecting a
   returned item.
2. `POST /api/rentals/:id/messages` / `GET .../messages` — a lightweight
   renter <-> lender chat thread per rental (there's a role switcher on the
   page since there's no login).
3. `GET /api/admin/rentals` — every returned rental, with damage-claim and
   message counts, for the `/admin` queue.
4. `GET /api/admin/rentals/:id` — full review context: the rental, its
   damage logs, its chat transcript, and any existing settlement.
5. `POST /api/admin/rentals/:id/settle { amountToRenter, adminNote }` —
   splits `Rental.depositRefundAmount` (what's left after the Late Return Fee
   Generator's deduction) between the renter and the lender; the two amounts
   always sum to exactly what was held. Moves the rental to `Checked &
   Approved` and `Rental.paymentStatus` to `Refunded` — the final state in
   the project's structural-state lifecycle.

Policy lives in `backend/src/services/settlementService.js`.
