import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';

const money = (n) => `৳${Number(n).toLocaleString('en-BD')}`;

export default function AgreementPage() {
  const { rentalId } = useParams();
  const [rental, setRental] = useState(null);
  const [record, setRecord] = useState(null); // { agreement, messages } | 'none' | null
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadAgreement = useCallback(() => {
    api
      .get(`/rentals/${rentalId}/agreement`)
      .then((res) => setRecord(res.data))
      .catch((err) => setRecord(err.response?.status === 404 ? 'none' : null));
  }, [rentalId]);

  useEffect(() => {
    api
      .get(`/rentals/${rentalId}`)
      .then((res) => setRental(res.data))
      .catch(() => setError('Rental not found.'));
    loadAgreement();
  }, [rentalId, loadAgreement]);

  async function handleIssue() {
    setBusy(true);
    setError('');
    try {
      await api.post(`/rentals/${rentalId}/agreement/send`);
      loadAgreement();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not issue the agreement.');
    } finally {
      setBusy(false);
    }
  }

  if (error && !rental) {
    return <p className="mx-auto max-w-md px-4 py-10 text-red-700">{error}</p>;
  }
  if (!rental) return <p className="mx-auto max-w-md px-4 py-10 text-slate-400">Loading...</p>;

  if (rental.paymentStatus !== 'Paid') {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <BackButton />
        <p className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-700">
          This rental hasn't been paid for yet. The agreement is issued automatically once payment
          completes.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <BackButton />

      <h1 className="mt-3 text-xl font-semibold text-slate-900">{rental.item?.title}</h1>
      <p className="text-sm text-slate-500">Rental Agreement &amp; Liability Terms</p>

      {record === null && <p className="mt-6 text-sm text-slate-400">Loading...</p>}

      {record === 'none' && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">No agreement has been issued for this rental yet.</p>
          <button
            onClick={handleIssue}
            disabled={busy}
            className="mt-4 w-full rounded-lg bg-emerald-600 py-3 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {busy ? 'Issuing...' : 'Issue & email agreement'}
          </button>
        </div>
      )}

      {record && record !== 'none' && (
        <>
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                Issued
              </span>
              <span className="text-xs text-slate-400">
                {new Date(record.agreement.generatedAt).toLocaleString()}
              </span>
            </div>

            <a
              href={`/api/agreements/${record.agreement._id}/pdf`}
              download={`RentAll-Agreement-${rental._id}.pdf`}
              className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
            >
              Download PDF agreement
            </a>

            <button
              onClick={handleIssue}
              disabled={busy}
              className="mt-2 w-full rounded-lg border border-slate-200 py-2 text-xs text-slate-500 hover:bg-slate-50 disabled:opacity-50"
            >
              {busy ? 'Resending...' : 'Resend to both parties'}
            </button>
          </div>

          {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Read the agreement (in case the PDF download doesn't work here)
            </p>

            <div className="mt-3 space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Parties</p>
                <p className="text-slate-700">Lender: {rental.lender?.name} &lt;{rental.lender?.email}&gt;</p>
                <p className="text-slate-700">Renter: {rental.renter?.name} &lt;{rental.renter?.email}&gt;</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Item &amp; Rental Period
                </p>
                <p className="text-slate-700">Item: {rental.item?.title}</p>
                <p className="text-slate-700">
                  Period: {new Date(rental.startDate).toLocaleDateString()} to{' '}
                  {new Date(rental.endDate).toLocaleDateString()} ({rental.days} day
                  {rental.days === 1 ? '' : 's'})
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Financial Terms
                </p>
                <p className="text-slate-700">Daily rate: {money(rental.dailyRate)}</p>
                <p className="text-slate-700">Rental cost: {money(rental.rentalCost)}</p>
                <p className="text-slate-700">Refundable security deposit: {money(rental.securityDeposit)}</p>
                <p className="font-semibold text-slate-900">Total paid: {money(rental.totalAmount)}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Liability &amp; Late Return Terms
                </p>
                <ol className="list-decimal space-y-1 pl-4 text-slate-700">
                  {record.clauses?.map((clause, i) => (
                    <li key={i}>{clause}</li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm">
            <p className="border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Emailed via Gmail (mock)
            </p>
            <ul className="divide-y divide-slate-100">
              {record.messages.map((m) => (
                <li key={m._id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">
                      {m.role} &middot; {m.toName}
                    </p>
                    <p className="text-xs text-slate-400">{m.to}</p>
                  </div>
                  <span className="text-xs text-slate-400">{new Date(m.sentAt).toLocaleTimeString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
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
