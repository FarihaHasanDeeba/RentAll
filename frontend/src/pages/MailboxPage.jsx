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

export default function MailboxPage() {
  const [messages, setMessages] = useState(null);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    api
      .get('/mailbox')
      .then((res) => setMessages(res.data))
      .catch(() => setError('Could not load the mailbox.'));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Mailbox</h1>
          <p className="mt-1 text-sm text-slate-500">
            Every email the mock Gmail service has "sent" — rental agreements go here.
          </p>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
          Mock Gmail
        </span>
      </div>

      {error && <p className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {!messages && !error && <p className="mt-6 text-sm text-slate-400">Loading...</p>}

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {messages?.map((m) => {
          const open = openId === m._id;
          return (
            <div key={m._id} className="border-b border-slate-100 last:border-0">
              <button
                onClick={() => setOpenId(open ? null : m._id)}
                className="flex w-full items-center gap-4 px-5 py-3 text-left hover:bg-slate-50"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                  {m.toName?.[0] ?? '?'}
                </span>
                <span className="w-40 shrink-0 truncate text-sm font-medium text-slate-900">{m.toName}</span>
                <span className="flex-1 truncate text-sm text-slate-500">
                  {m.subject}
                  {m.rental?.item?.title && (
                    <span className="text-slate-400"> — {m.rental.item.title}</span>
                  )}
                </span>
                <span className="shrink-0 text-xs text-slate-400">{timeAgo(m.sentAt)}</span>
              </button>

              {open && (
                <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 text-sm">
                  <div className="text-xs text-slate-400">
                    From: RentAll &lt;noreply@rentall.app&gt; &middot; To: {m.toName} &lt;{m.to}&gt;
                  </div>
                  <p className="mt-2 whitespace-pre-line text-slate-700">{m.bodyText}</p>
                  <a
                    href={`/api/agreements/${m.agreement}/pdf`}
                    download={m.attachmentName}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    📎 {m.attachmentName}
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {messages && messages.length === 0 && (
        <p className="mt-6 text-sm text-slate-400">
          No emails sent yet — pay for a rental to trigger the agreement mailing.
        </p>
      )}
    </div>
  );
}
