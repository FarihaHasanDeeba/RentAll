import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

const paymentBadge = {
  Pending: 'bg-amber-100 text-amber-700',
  Paid: 'bg-emerald-100 text-emerald-700',
  Failed: 'bg-red-100 text-red-700',
  Refunded: 'bg-slate-100 text-slate-600',
};

const RETURNED_STATUSES = ['Returned', 'Checked & Approved'];
const REMINDER_WINDOW_HOURS = 6;

function dueSoonHint(rental) {
  const hoursLeft = (new Date(rental.endDate).getTime() - Date.now()) / (60 * 60 * 1000);
  if (hoursLeft <= 0 || hoursLeft > REMINDER_WINDOW_HOURS) return null;
  return rental.returnReminderSentAt
    ? { text: 'Reminder texted', tone: 'text-emerald-600' }
    : { text: `Due in ${Math.max(0, Math.round(hoursLeft))}h — reminder pending`, tone: 'text-amber-600' };
}

export default function RentalListPage() {
  const [rentals, setRentals] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/rentals')
      .then((res) => setRentals(res.data))
      .catch(() => setError('Could not load rentals. Is the server running and seeded?'));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Rental Requests</h1>
      <p className="mt-1 text-sm text-slate-500">
        Demo data from <code className="rounded bg-slate-100 px-1 py-0.5">npm run seed</code>. Pick a
        rental to pay, then return it to see the late fee generator in action.
      </p>

      {error && <p className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      {!rentals && !error && <p className="mt-6 text-sm text-slate-400">Loading...</p>}

      <div className="mt-6 space-y-3">
        {rentals?.map((r) => {
          const returned = RETURNED_STATUSES.includes(r.status);
          // 'Refunded' only happens after the admin settles a rental that was
          // already Paid - it's still a completed payment, not an unpaid one.
          const paid = r.paymentStatus === 'Paid' || r.paymentStatus === 'Refunded';
          const dueSoon = paid && !returned ? dueSoonHint(r) : null;

          let badgeLabel = r.paymentStatus;
          let badgeClass = paymentBadge[r.paymentStatus];
          if (paid && r.status === 'Checked & Approved') {
            badgeLabel = 'Settled';
            badgeClass = 'bg-slate-800 text-white';
          } else if (paid && returned) {
            badgeLabel = r.daysLate > 0 ? 'Returned late' : 'Returned';
            badgeClass = r.daysLate > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700';
          }

          return (
            <div
              key={r._id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div>
                <p className="font-medium text-slate-900">{r.item?.title}</p>
                <p className="text-sm text-slate-500">
                  {r.days} day(s) &middot; renter: {r.renter?.name}
                </p>
                {dueSoon && <p className={`mt-0.5 text-xs font-medium ${dueSoon.tone}`}>{dueSoon.text}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass}`}>
                  {badgeLabel}
                </span>

                {!paid && (
                  <Link
                    to={`/checkout/${r._id}`}
                    className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
                  >
                    Pay now
                  </Link>
                )}

                {paid && (
                  <Link
                    to={`/agreement/${r._id}`}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Agreement
                  </Link>
                )}

                {paid && !returned && (
                  <>
                    <Link
                      to={`/checkout/${r._id}`}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Details
                    </Link>
                    <Link
                      to={`/return/${r._id}`}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
                    >
                      Return
                    </Link>
                  </>
                )}

                {paid && returned && (
                  <>
                    <Link
                      to={`/return/${r._id}`}
                      className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
                    >
                      View return
                    </Link>
                    <Link
                      to={`/dispute/${r._id}`}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Dispute
                    </Link>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {rentals && rentals.length === 0 && (
        <p className="mt-6 text-sm text-slate-400">
          No rentals yet. Run <code className="rounded bg-slate-100 px-1 py-0.5">npm run seed</code> in
          the server folder.
        </p>
      )}
    </div>
  );
}
