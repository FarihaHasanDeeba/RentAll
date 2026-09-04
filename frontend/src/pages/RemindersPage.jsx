import { useEffect, useState } from 'react';
import api from '../api/client';

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(date).toLocaleDateString();
}

export default function RemindersPage() {
  const [messages, setMessages] = useState(null);
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState(null);

  function load() {
    api
      .get('/reminders')
      .then((res) => setMessages(res.data))
      .catch(() => setError('Could not load reminders.'));
  }

  useEffect(load, []);

  async function handleRun() {
    setRunning(true);
    setError('');
    try {
      const { data } = await api.post('/reminders/run');
      setLastRun(data);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not run the reminder sweep.');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Return Reminders</h1>
          <p className="mt-1 text-sm text-slate-500">
            Every SMS the mock gateway has "sent" — automatically texted 6 hours before a rental's
            due date.
          </p>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
          Mock SMS
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            A background sweep runs automatically every few minutes. You can also trigger it right
            now to see it work immediately.
          </p>
          <button
            onClick={handleRun}
            disabled={running}
            className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {running ? 'Checking...' : 'Run sweep now'}
          </button>
        </div>
        {lastRun && (
          <p className="mt-2 text-xs text-slate-400">
            Last run: checked {lastRun.checked} due-soon rental(s), sent {lastRun.sentCount} new
            text(s).
          </p>
        )}
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {!messages && !error && <p className="mt-6 text-sm text-slate-400">Loading...</p>}

      <div className="mt-4 space-y-3">
        {messages?.map((m) => (
          <div key={m._id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              📱
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-900">
                  {m.toName} <span className="font-normal text-slate-400">&middot; {m.to}</span>
                </p>
                <span className="shrink-0 text-xs text-slate-400">{timeAgo(m.sentAt)}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{m.body}</p>
              {m.rental?.item?.title && (
                <p className="mt-1 text-xs text-slate-400">
                  Rental: {m.rental.item.title} &middot; due {new Date(m.rental.endDate).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {messages && messages.length === 0 && (
        <p className="mt-6 text-sm text-slate-400">
          No reminders sent yet. A rental has to be paid and within 6 hours of its due date.
        </p>
      )}
    </div>
  );
}
