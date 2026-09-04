import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';

const money = (n) => `৳${Number(n).toLocaleString('en-BD')}`;

export default function AdminRentalPage() {
  const { rentalId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [amountToRenter, setAmountToRenter] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    api
      .get(`/admin/rentals/${rentalId}`)
      .then((res) => {
        setData(res.data);
        if (!res.data.settlement) {
          setAmountToRenter(String(res.data.rental.depositRefundAmount));
        }
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load this rental.'));
  }

  useEffect(load, [rentalId]);

  async function handleSettle(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post(`/admin/rentals/${rentalId}/settle`, {
        amountToRenter: Number(amountToRenter),
        adminNote,
      });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not settle this rental.');
    } finally {
      setBusy(false);
    }
  }

  if (error && !data) return <p className="mx-auto max-w-lg px-4 py-10 text-red-700">{error}</p>;
  if (!data) return <p className="mx-auto max-w-lg px-4 py-10 text-slate-400">Loading...</p>;

  const { rental, damageLogs, messages, settlement } = data;
  const deposit = rental.depositRefundAmount;
  const claimedTotal = damageLogs.reduce((sum, d) => sum + d.claimedAmount, 0);
  const toRenterNum = Number(amountToRenter) || 0;
  const toLenderPreview = deposit - toRenterNum;
  const invalid = toRenterNum < 0 || toRenterNum > deposit;

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <Link
        to="/admin"
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path
            fillRule="evenodd"
            d="M17 10a.75.75 0 0 1-.75.75H5.56l3.72 3.72a.75.75 0 1 1-1.06 1.06l-5-5a.75.75 0 0 1 0-1.06l5-5a.75.75 0 1 1 1.06 1.06L5.56 9.25H16.25A.75.75 0 0 1 17 10Z"
            clipRule="evenodd"
          />
        </svg>
        Admin queue
      </Link>

      <h1 className="mt-3 text-xl font-semibold text-slate-900">{rental.item?.title}</h1>
      <p className="text-sm text-slate-500">
        {rental.renter?.name} (renter) &middot; {rental.lender?.name} (lender)
      </p>

      {/* Rental & late-fee summary */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm text-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Escrow Summary</p>
        <div className="mt-2 space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Original security deposit</span>
            <span>{money(rental.securityDeposit)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">
              Late fee already deducted {rental.daysLate > 0 ? `(${rental.daysLate}d late)` : ''}
            </span>
            <span className={rental.lateFeeAmount > 0 ? 'text-red-600' : ''}>
              {rental.lateFeeAmount > 0 ? `- ${money(rental.lateFeeAmount)}` : money(0)}
            </span>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-1 font-semibold text-slate-900">
            <span>Held deposit available to distribute</span>
            <span>{money(deposit)}</span>
          </div>
          {claimedTotal > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Total damage claimed</span>
              <span>{money(claimedTotal)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Damage logs */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm text-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Damage Logs</p>
        {damageLogs.length === 0 && <p className="mt-2 text-slate-400">No damage reported.</p>}
        <div className="mt-2 space-y-2">
          {damageLogs.map((d) => (
            <div key={d._id} className="rounded-lg bg-red-50 p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-red-700">
                  {d.reportedBy?.name} claims {money(d.claimedAmount)}
                </span>
                <span className="text-xs text-red-400">{new Date(d.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="mt-1 text-red-700">{d.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chat transcript */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm">
        <p className="border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Chat Transcript
        </p>
        <div className="max-h-72 space-y-2 overflow-y-auto px-5 py-4 text-sm">
          {messages.length === 0 && <p className="text-slate-400">No messages.</p>}
          {messages.map((m) => (
            <div key={m._id} className={`flex ${m.role === 'Renter' ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 ${
                  m.role === 'Renter' ? 'bg-slate-100 text-slate-800' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                <p className="text-[11px] font-semibold opacity-70">
                  {m.sender?.name} &middot; {m.role}
                </p>
                <p>{m.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settlement */}
      {settlement ? (
        <div className="mt-4 rounded-xl bg-emerald-50 p-5 text-sm">
          <p className="font-semibold text-emerald-700">
            Settled {new Date(settlement.settledAt).toLocaleString()}
          </p>
          <div className="mt-2 space-y-1 text-emerald-800">
            <div className="flex justify-between">
              <span>To renter</span>
              <span className="font-medium">{money(settlement.amountToRenter)}</span>
            </div>
            <div className="flex justify-between">
              <span>To lender</span>
              <span className="font-medium">{money(settlement.amountToLender)}</span>
            </div>
          </div>
          {settlement.adminNote && <p className="mt-2 text-xs text-emerald-700">{settlement.adminNote}</p>}
        </div>
      ) : (
        <form onSubmit={handleSettle} className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Distribute the {money(deposit)} held deposit
          </p>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setAmountToRenter(String(deposit))}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-50"
            >
              Full refund to renter
            </button>
            <button
              type="button"
              onClick={() => setAmountToRenter('0')}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-50"
            >
              Full to lender
            </button>
            {claimedTotal > 0 && claimedTotal <= deposit && (
              <button
                type="button"
                onClick={() => setAmountToRenter(String(deposit - claimedTotal))}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-50"
              >
                Cover the claim
              </button>
            )}
          </div>

          <label className="mt-4 block text-xs font-medium text-slate-500">Amount to renter (৳)</label>
          <input
            type="number"
            min="0"
            max={deposit}
            value={amountToRenter}
            onChange={(e) => setAmountToRenter(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />

          <div className="mt-2 flex justify-between text-sm">
            <span className="text-slate-500">Amount to lender (remainder)</span>
            <span className={invalid ? 'text-red-600' : 'font-medium text-slate-900'}>
              {money(toLenderPreview)}
            </span>
          </div>

          <label className="mt-3 block text-xs font-medium text-slate-500">Admin note</label>
          <textarea
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            rows={2}
            placeholder="Reasoning for this split..."
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />

          {error && <p className="mt-2 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={busy || invalid}
            className="mt-4 w-full rounded-lg bg-emerald-600 py-3 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {busy ? 'Settling...' : 'Distribute funds & settle'}
          </button>
        </form>
      )}
    </div>
  );
}
