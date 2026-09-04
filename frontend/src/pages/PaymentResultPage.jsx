import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';

const money = (n) => `৳${Number(n).toLocaleString('en-BD')}`;

const statusView = {
  COMPLETED: { title: 'Payment successful', tone: 'text-emerald-700 bg-emerald-50', icon: '✓' },
  FAILED: { title: 'Payment failed', tone: 'text-red-700 bg-red-50', icon: '✕' },
  CANCELLED: { title: 'Payment cancelled', tone: 'text-slate-600 bg-slate-100', icon: '–' },
  PENDING: { title: 'Payment pending', tone: 'text-amber-700 bg-amber-50', icon: '…' },
  PROCESSING: { title: 'Payment pending', tone: 'text-amber-700 bg-amber-50', icon: '…' },
};

export default function PaymentResultPage() {
  const { tranId } = useParams();
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/payments/tran/${tranId}`)
      .then((res) => setPayment(res.data))
      .catch(() => setError('Could not load payment.'));
  }, [tranId]);

  if (error) return <p className="mx-auto max-w-md px-4 py-10 text-red-700">{error}</p>;
  if (!payment) return <p className="mx-auto max-w-md px-4 py-10 text-slate-400">Loading...</p>;

  const view = statusView[payment.status];

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className={`rounded-xl p-6 text-center ${view.tone}`}>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl font-bold">
          {view.icon}
        </div>
        <h1 className="mt-3 text-lg font-semibold">{view.title}</h1>
        <p className="mt-1 text-sm opacity-80">{payment.rental?.item?.title}</p>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm text-sm">
        <div className="flex justify-between py-1">
          <span className="text-slate-500">Transaction ID</span>
          <span className="font-mono text-xs text-slate-700">{payment.tranId}</span>
        </div>
        {payment.valId && (
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Validation ID</span>
            <span className="font-mono text-xs text-slate-700">{payment.valId}</span>
          </div>
        )}
        <div className="flex justify-between py-1">
          <span className="text-slate-500">Rental cost</span>
          <span>{money(payment.rentalAmount)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-slate-500">Security deposit (held)</span>
          <span>{money(payment.securityDeposit)}</span>
        </div>
        <div className="flex justify-between border-t border-slate-100 py-2 font-semibold text-slate-900">
          <span>Total charged</span>
          <span>{money(payment.totalAmount)}</span>
        </div>
        {payment.paidAt && (
          <div className="flex justify-between py-1 text-xs text-slate-400">
            <span>Paid at</span>
            <span>{new Date(payment.paidAt).toLocaleString()}</span>
          </div>
        )}
      </div>

      {payment.status === 'COMPLETED' && (
        <p className="mt-4 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">
          A rental agreement covering liability and late-return terms has been emailed to both you
          and the lender.{' '}
          <Link to={`/agreement/${payment.rental?._id}`} className="font-medium underline">
            View it
          </Link>
          .
        </p>
      )}

      <Link
        to="/"
        className="mt-6 block rounded-lg bg-slate-900 py-3 text-center font-medium text-white hover:bg-slate-700"
      >
        Back to rentals
      </Link>
    </div>
  );
}
