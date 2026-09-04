import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';

const money = (n) => `৳${Number(n).toLocaleString('en-BD')}`;

// datetime-local wants "YYYY-MM-DDTHH:mm" in local time, not UTC.
function toLocalInputValue(date) {
  const d = new Date(date);
  const offsetMs = d.getTimezoneOffset() * 60 * 1000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16);
}

export default function ReturnPage() {
  const { rentalId } = useParams();
  const [rental, setRental] = useState(null);
  const [error, setError] = useState('');
  const [returnAt, setReturnAt] = useState('');
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get(`/rentals/${rentalId}`)
      .then((res) => {
        setRental(res.data);
        setReturnAt(toLocalInputValue(new Date()));
      })
      .catch(() => setError('Rental not found.'));
  }, [rentalId]);

  const alreadyReturned = rental && ['Returned', 'Checked & Approved'].includes(rental.status);

  useEffect(() => {
    if (!rental || alreadyReturned || !returnAt) return;
    api
      .get(`/rentals/${rentalId}/return-preview`, { params: { at: new Date(returnAt).toISOString() } })
      .then((res) => setPreview(res.data))
      .catch(() => setPreview(null));
  }, [rental, alreadyReturned, returnAt, rentalId]);

  async function handleConfirm() {
    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post(`/rentals/${rentalId}/return`, {
        actualReturnDate: new Date(returnAt).toISOString(),
      });
      setRental(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not process the return.');
    } finally {
      setSubmitting(false);
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
          This rental hasn't been paid for yet, so it can't be returned. Pay for it first.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <BackButton />

      <h1 className="mt-3 text-xl font-semibold text-slate-900">{rental.item?.title}</h1>
      <p className="text-sm text-slate-500">Due back {new Date(rental.endDate).toLocaleString()}</p>

      {alreadyReturned ? (
        <ReturnReceipt rental={rental} />
      ) : (
        <>
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Actual return date &amp; time
            </label>
            <input
              type="datetime-local"
              value={returnAt}
              onChange={(e) => setReturnAt(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
            <p className="mt-2 text-xs text-slate-400">
              Defaults to now — change it to simulate an early, on-time, or late return.
            </p>
          </div>

          {preview && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Late Fee Preview
                </h2>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    preview.isLate ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {preview.isLate ? `${preview.daysLate} day(s) late` : 'On time'}
                </span>
              </div>

              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Security deposit held</dt>
                  <dd className="font-medium text-slate-900">{money(rental.securityDeposit)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Late fee (1.5&times; daily rate / day late)</dt>
                  <dd className="font-medium text-red-600">
                    {preview.lateFeeAmount > 0 ? `- ${money(preview.lateFeeAmount)}` : money(0)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 text-base">
                  <dt className="font-semibold text-slate-900">Deposit refund</dt>
                  <dd className="font-semibold text-slate-900">{money(preview.depositRefundAmount)}</dd>
                </div>
              </dl>
            </div>
          )}

          {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="mt-6 w-full rounded-lg bg-emerald-600 py-3 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {submitting ? 'Processing...' : 'Confirm return'}
          </button>
        </>
      )}
    </div>
  );
}

function ReturnReceipt({ rental }) {
  const isLate = rental.daysLate > 0;
  return (
    <div className="mt-6">
      <div className={`rounded-xl p-5 ${isLate ? 'bg-red-50' : 'bg-emerald-50'}`}>
        <p className={`text-sm font-semibold ${isLate ? 'text-red-700' : 'text-emerald-700'}`}>
          {isLate ? `Returned ${rental.daysLate} day(s) late` : 'Returned on time'}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Actual return: {new Date(rental.actualReturnDate).toLocaleString()}
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm text-sm">
        <div className="flex justify-between py-1">
          <span className="text-slate-500">Security deposit held</span>
          <span>{money(rental.securityDeposit)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-slate-500">Late fee deducted</span>
          <span className="text-red-600">
            {rental.lateFeeAmount > 0 ? `- ${money(rental.lateFeeAmount)}` : money(0)}
          </span>
        </div>
        <div className="flex justify-between border-t border-slate-100 py-2 font-semibold text-slate-900">
          <span>Deposit refund</span>
          <span>{money(rental.depositRefundAmount)}</span>
        </div>
      </div>
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
