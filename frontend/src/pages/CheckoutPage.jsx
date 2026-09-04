import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api/client';

const money = (n) => `৳${Number(n).toLocaleString('en-BD')}`;

export default function CheckoutPage() {
  const { rentalId } = useParams();
  const navigate = useNavigate();
  const [rental, setRental] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get(`/rentals/${rentalId}`)
      .then((res) => setRental(res.data))
      .catch(() => setError('Rental not found.'));
  }, [rentalId]);

  async function handlePay() {
    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post('/payments/initiate', { rentalId });
      // gatewayPageURL is same-origin (our mock plays the SSLCommerz host role),
      // so we route to it client-side instead of a full page redirect.
      const url = new URL(data.gatewayPageURL);
      navigate(url.pathname);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start payment.');
      setSubmitting(false);
    }
  }

  if (error && !rental) {
    return <p className="mx-auto max-w-md px-4 py-10 text-red-700">{error}</p>;
  }
  if (!rental) return <p className="mx-auto max-w-md px-4 py-10 text-slate-400">Loading...</p>;

  const alreadyPaid = rental.paymentStatus === 'Paid';

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
        >
          <path
            fillRule="evenodd"
            d="M17 10a.75.75 0 0 1-.75.75H5.56l3.72 3.72a.75.75 0 1 1-1.06 1.06l-5-5a.75.75 0 0 1 0-1.06l5-5a.75.75 0 1 1 1.06 1.06L5.56 9.25H16.25A.75.75 0 0 1 17 10Z"
            clipRule="evenodd"
          />
        </svg>
        Back
      </Link>

      <h1 className="mt-3 text-xl font-semibold text-slate-900">{rental.item?.title}</h1>
      <p className="text-sm text-slate-500">
        {new Date(rental.startDate).toLocaleDateString()} &ndash;{' '}
        {new Date(rental.endDate).toLocaleDateString()} ({rental.days} days)
      </p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Two-Tier Payment Breakdown
        </h2>

        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">
              Rental cost ({money(rental.dailyRate)} &times; {rental.days} days)
            </dt>
            <dd className="font-medium text-slate-900">{money(rental.rentalCost)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Refundable security deposit</dt>
            <dd className="font-medium text-slate-900">{money(rental.securityDeposit)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-2 text-base">
            <dt className="font-semibold text-slate-900">Total payable now</dt>
            <dd className="font-semibold text-slate-900">{money(rental.totalAmount)}</dd>
          </div>
        </dl>

        <p className="mt-3 text-xs text-slate-400">
          The deposit tier is held, not spent — it's released back to you when the item is
          returned and approved.
        </p>
      </div>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      {alreadyPaid ? (
        <p className="mt-6 rounded-lg bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
          This rental is already paid for.
        </p>
      ) : (
        <button
          onClick={handlePay}
          disabled={submitting}
          className="mt-6 w-full rounded-lg bg-emerald-600 py-3 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {submitting ? 'Starting payment...' : `Pay ${money(rental.totalAmount)} with SSLCommerz`}
        </button>
      )}
    </div>
  );
}
