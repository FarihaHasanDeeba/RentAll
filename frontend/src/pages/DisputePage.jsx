import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';

const money = (n) => `৳${Number(n).toLocaleString('en-BD')}`;

export default function DisputePage() {
  const { rentalId } = useParams();
  const [rental, setRental] = useState(null);
  const [damageLogs, setDamageLogs] = useState(null);
  const [messages, setMessages] = useState(null);
  const [error, setError] = useState('');

  const [asRole, setAsRole] = useState('Renter');
  const [chatText, setChatText] = useState('');
  const [showDamageForm, setShowDamageForm] = useState(false);
  const [damageDesc, setDamageDesc] = useState('');
  const [damageAmount, setDamageAmount] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get(`/rentals/${rentalId}/damage-logs`).then((res) => setDamageLogs(res.data));
    api.get(`/rentals/${rentalId}/messages`).then((res) => setMessages(res.data));
  }, [rentalId]);

  useEffect(() => {
    api
      .get(`/rentals/${rentalId}`)
      .then((res) => setRental(res.data))
      .catch(() => setError('Rental not found.'));
    load();
  }, [rentalId, load]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!chatText.trim()) return;
    setBusy(true);
    try {
      await api.post(`/rentals/${rentalId}/messages`, { body: chatText, role: asRole });
      setChatText('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send message.');
    } finally {
      setBusy(false);
    }
  }

  async function fileDamageClaim(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post(`/rentals/${rentalId}/damage-logs`, {
        description: damageDesc,
        claimedAmount: Number(damageAmount),
        role: 'Lender',
      });
      setDamageDesc('');
      setDamageAmount('');
      setShowDamageForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not file the damage claim.');
    } finally {
      setBusy(false);
    }
  }

  if (error && !rental) return <p className="mx-auto max-w-md px-4 py-10 text-red-700">{error}</p>;
  if (!rental) return <p className="mx-auto max-w-md px-4 py-10 text-slate-400">Loading...</p>;

  const returned = ['Returned', 'Checked & Approved'].includes(rental.status);
  if (!returned) {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <BackButton />
        <p className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-700">
          This rental hasn't been returned yet. Damage claims and chat open up once it has.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <BackButton />

      <h1 className="mt-3 text-xl font-semibold text-slate-900">{rental.item?.title}</h1>
      <p className="text-sm text-slate-500">Damage log &amp; chat &mdash; reviewed by the admin escrow panel</p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Damage Log</p>
          {rental.status === 'Returned' && (
            <button
              onClick={() => setShowDamageForm((v) => !v)}
              className="text-xs font-medium text-emerald-700 hover:underline"
            >
              {showDamageForm ? 'Cancel' : '+ File a claim (as lender)'}
            </button>
          )}
        </div>

        {showDamageForm && (
          <form onSubmit={fileDamageClaim} className="mt-3 space-y-2">
            <textarea
              value={damageDesc}
              onChange={(e) => setDamageDesc(e.target.value)}
              placeholder="Describe the damage..."
              required
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
            <input
              type="number"
              min="0"
              step="1"
              value={damageAmount}
              onChange={(e) => setDamageAmount(e.target.value)}
              placeholder="Claimed amount (৳)"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              Submit claim
            </button>
          </form>
        )}

        <div className="mt-3 space-y-2">
          {damageLogs?.length === 0 && <p className="text-sm text-slate-400">No damage reported.</p>}
          {damageLogs?.map((d) => (
            <div key={d._id} className="rounded-lg bg-red-50 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-red-700">{d.reportedBy?.name} claims {money(d.claimedAmount)}</span>
                <span className="text-xs text-red-400">{new Date(d.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="mt-1 text-red-700">{d.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm">
        <p className="border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Chat Transcript
        </p>
        <div className="max-h-80 space-y-2 overflow-y-auto px-5 py-4">
          {messages?.length === 0 && <p className="text-sm text-slate-400">No messages yet.</p>}
          {messages?.map((m) => (
            <div key={m._id} className={`flex ${m.role === 'Renter' ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  m.role === 'Renter' ? 'bg-slate-100 text-slate-800' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                <p className="text-[11px] font-semibold opacity-70">{m.sender?.name} &middot; {m.role}</p>
                <p>{m.body}</p>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-slate-100 p-3">
          <select
            value={asRole}
            onChange={(e) => setAsRole(e.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-2 text-xs"
          >
            <option value="Renter">As Renter</option>
            <option value="Lender">As Lender</option>
          </select>
          <input
            value={chatText}
            onChange={(e) => setChatText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
    </div>
  );
}

function BackButton() {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path
          fillRule="evenodd"
          d="M17 10a.75.75 0 0 1-.75.75H5.56l3.72 3.72a.75.75 0 1 1-1.06 1.06l-5-5a.75.75 0 0 1 0-1.06l5-5a.75.75 0 1 1 1.06 1.06L5.56 9.25H16.25A.75.75 0 0 1 17 10Z"
          clipRule="evenodd"
        />
      </svg>
      Back
    </Link>
  );
}
