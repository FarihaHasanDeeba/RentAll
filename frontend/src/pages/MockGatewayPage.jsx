import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';

const money = (n) => `৳${Number(n).toLocaleString('en-BD')}`;

// Stands in for the page SSLCommerz would host at GatewayPageURL. The card
// fields aren't wired to a real card network, but they're not decorative
// either — the shopper has to fill in something card-shaped before "Pay"
// will submit, same as a real checkout would require.
function validateCard({ cardNumber, expiry, cvc }) {
  const digits = cardNumber.replace(/\s+/g, '');
  if (!/^\d{12,19}$/.test(digits)) return 'Enter a valid card number.';
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) return 'Enter expiry as MM/YY.';
  if (!/^\d{3,4}$/.test(cvc)) return 'Enter a valid CVC.';
  return '';
}

export default function MockGatewayPage() {
  const { tranId } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState({ cardNumber: '', expiry: '', cvc: '' });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    api
      .get(`/payments/tran/${tranId}`)
      .then((res) => setPayment(res.data))
      .catch(() => setError('Transaction not found or expired.'));
  }, [tranId]);

  function updateCard(field, value) {
    setCard((c) => ({ ...c, [field]: value }));
  }

  async function handleAction(action) {
    if (action === 'confirm') {
      const message = validateCard(card);
      if (message) {
        setFormError(message);
        return;
      }
    }
    setFormError('');
    setBusy(true);
    try {
      await api.post(`/payments/mock-gateway/${tranId}/${action}`);
      navigate(`/payment/result/${tranId}`);
    } catch {
      navigate(`/payment/result/${tranId}`);
    }
  }

  if (error) return <p className="mx-auto max-w-sm px-4 py-10 text-red-700">{error}</p>;
  if (!payment) return <p className="mx-auto max-w-sm px-4 py-10 text-slate-400">Loading...</p>;

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-slate-800 px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold tracking-tight text-blue-700">SSLCOMMERZ</span>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
            Mock Gateway
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">Secure payment simulation — no real charge occurs</p>

        <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>Rental cost</span>
            <span>{money(payment.rentalAmount)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Security deposit</span>
            <span>{money(payment.securityDeposit)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 font-semibold text-slate-900">
            <span>Total</span>
            <span>{money(payment.totalAmount)}</span>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <input
            value={card.cardNumber}
            onChange={(e) => updateCard('cardNumber', e.target.value)}
            placeholder="Card number  e.g. 4111 1111 1111 1111"
            inputMode="numeric"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
          />
          <div className="flex gap-3">
            <input
              value={card.expiry}
              onChange={(e) => updateCard('expiry', e.target.value)}
              placeholder="MM/YY"
              className="w-1/2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
            />
            <input
              value={card.cvc}
              onChange={(e) => updateCard('cvc', e.target.value)}
              placeholder="CVC"
              inputMode="numeric"
              className="w-1/2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
            />
          </div>
          {formError && <p className="text-xs text-red-600">{formError}</p>}
        </div>

        <button
          onClick={() => handleAction('confirm')}
          disabled={busy}
          className="mt-5 w-full rounded-lg bg-blue-700 py-3 font-medium text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {busy ? 'Processing...' : `Pay ${money(payment.totalAmount)}`}
        </button>
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => handleAction('fail')}
            disabled={busy}
            className="w-1/2 rounded-lg border border-slate-200 py-2 text-xs text-slate-500 hover:bg-slate-50"
          >
            Simulate failure
          </button>
          <button
            onClick={() => handleAction('cancel')}
            disabled={busy}
            className="w-1/2 rounded-lg border border-slate-200 py-2 text-xs text-slate-500 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-400">tran_id: {tranId}</p>
      </div>
    </div>
  );
}
