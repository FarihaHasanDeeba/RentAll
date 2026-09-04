import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

const money = (n) => `৳${Number(n).toLocaleString('en-BD')}`;

export default function AdminDashboardPage() {
  const [rentals, setRentals] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/admin/rentals')
      .then((res) => setRentals(res.data))
      .catch(() => setError('Could not load the admin queue.'));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Admin Escrow Settlement</h1>
          <p className="mt-1 text-sm text-slate-500">
            Every rental that has been returned. Review damage logs and chat transcripts, then
            distribute the held deposit.
          </p>
        </div>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
          Admin
        </span>
      </div>

      {error && <p className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {!rentals && !error && <p className="mt-6 text-sm text-slate-400">Loading...</p>}

      <div className="mt-6 space-y-3">
        {rentals?.map((r) => {
          const settled = !!r.settlement;
          const disputed = r.damageLogCount > 0;
          return (
            <Link
              key={r._id}
              to={`/admin/rentals/${r._id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300"
            >
              <div>
                <p className="font-medium text-slate-900">{r.item?.title}</p>
                <p className="text-sm text-slate-500">
                  {r.renter?.name} &rarr; {r.lender?.name} &middot; held deposit {money(r.depositRefundAmount)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {disputed && (
                  <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                    {r.damageLogCount} damage claim{r.damageLogCount === 1 ? '' : 's'}
                  </span>
                )}
                {r.messageCount > 0 && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {r.messageCount} messages
                  </span>
                )}
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    settled ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {settled ? 'Settled' : 'Needs review'}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {rentals && rentals.length === 0 && (
        <p className="mt-6 text-sm text-slate-400">No returned rentals yet.</p>
      )}
    </div>
  );
}
