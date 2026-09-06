# RentAll — Module 3 Complete

## Rental Lifecycle Tracking

This version completes the five Module 3 requirements:

| Feature | Status | Implementation |
|---|---|---|
| 11. Submit Rent Request | ✅ | Real MongoDB data, validation, pricing, date-overlap protection |
| 12. Asset Status Workflow Engine | ✅ | Role-aware transitions, lifecycle history, OTP-only handover statuses |
| 13. Geographic Exchange Mapper | ✅ | Pickup radius, coordinate validation, Google Maps geocoding, public handover spot |
| 14. Handover Verification Handshake | ✅ | 6-digit hashed OTP, 15-minute expiry, 3 attempts, optional Twilio SMS |
| 15. Damage Incident Logger | ✅ | Damage records, escrow freeze, lender resolution, deposit deduction/release |

## 1. Backend setup

Open Command Prompt in `backend`:

```bat
npm install
```

Create `backend\.env` from `.env.example`:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
PORT=5000
CORS_ORIGIN=http://localhost:5173
GOOGLE_MAPS_API_KEY=your_google_maps_key

# Optional SMS:
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM=

NODE_ENV=development
```

**Important:** this project no longer falls back to MongoMemoryServer. It connects directly to the MongoDB Atlas URI.

Start:

```bat
npm run dev
```

Health check:

```text
http://localhost:5000/api/health
```

## 2. Create real demo data

Run once:

```bat
npm run seed
```

It creates:
- one RENTER
- one LENDER
- one available tool

The command prints their MongoDB ObjectIds. Use the IDs only when working directly with the API. The React UI loads real IDs automatically.

Demo password:

```text
RentAll@123
```

## 3. Frontend setup

Open another Command Prompt in `frontend`:

```bat
npm install
npm run dev
```

Open the Vite address shown in the terminal, normally:

```text
http://localhost:5173
```

## 4. Recommended full test

1. Run `npm run seed`.
2. Open **New Request**.
3. Select the Demo Renter and Demo Cordless Drill.
4. Choose a future start/end date.
5. Submit.
6. Open the rental.
7. Switch **Acting as** to Demo Lender.
8. In Status, change `REQUESTED → ACCEPTED`.
9. In Location, geocode/save a pickup address.
10. Propose a public handover spot inside the configured pickup radius.
11. Confirm the spot as lender.
12. Switch to renter and confirm the same spot.
13. In Handover, generate a CHECKOUT OTP.
14. In development without Twilio, the API displays the OTP. Enter it and confirm item condition.
15. Switch to renter and change `CHECKED_OUT → IN_USE`.
16. For return, generate a RETURN OTP and verify it.
17. As lender, approve the return.
18. To test Feature 15, report damage before approval. The deposit becomes `FROZEN`.
19. As lender, resolve the incident using either `DEDUCT_FROM_DEPOSIT` or `NO_ACTION`.
20. Close the rental. A legitimate deposit deduction is preserved.

## Google Maps

Enable the **Geocoding API** in your Google Cloud project and put its server-side key in `GOOGLE_MAPS_API_KEY`.

The backend endpoint is:

```text
GET /api/maps/geocode?address=Uttara,Dhaka
```

The application also creates Google Maps search URLs for pickup/handover locations.

## SMS / OTP

Without Twilio credentials, development mode returns the OTP so the complete lifecycle can be tested locally.

For real SMS, configure:

```env
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM=
```

In production (`NODE_ENV=production`), the backend refuses to expose an OTP when SMS is not configured.

## Important security notes

- Never commit `.env` or API keys to GitHub.
- Do not use `0.0.0.0/0` in MongoDB Atlas permanently; restrict the IPs that need access.
- For a production deployment, replace the demo `actorId/userId` mechanism with the project's real JWT authentication middleware.
- The Module 3 business rules are implemented, but payment processing itself is outside this module.
