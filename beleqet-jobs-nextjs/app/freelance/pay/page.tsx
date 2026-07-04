'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

function EscrowPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const escrowId = searchParams.get('escrow');

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!escrowId) {
      setError('Invalid or missing escrow ID. Please return to the gig and try again.');
    }
  }, [escrowId]);

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    setError(null);
    // In production this page is never shown — Chapa redirects here after payment.
    // For development, simulate a successful fund.
    setTimeout(() => {
      setPaymentComplete(true);
      setIsProcessing(false);
      toast.success('Escrow funded successfully!');
      setTimeout(() => router.push('/freelance/contracts'), 2500);
    }, 2000);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-ink mb-2">Payment Error</h2>
          <p className="text-sm text-muted mb-6">{error}</p>
          <button onClick={() => router.push('/freelance')}
            className="px-5 py-2.5 bg-brandGreen text-white rounded-lg text-sm font-semibold hover:bg-darkGreen">
            Back to Freelance
          </button>
        </div>
      </div>
    );
  }

  if (paymentComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-ink mb-2">Escrow Funded!</h2>
          <p className="text-sm text-muted mb-4">
            Funds are secured. The freelancer can now start working. Redirecting to your contracts...
          </p>
          <Loader2 className="h-5 w-5 animate-spin text-muted mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow p-8">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="h-8 w-8 text-brandGreen" />
            <div>
              <h1 className="text-xl font-bold text-ink">Fund Escrow</h1>
              <p className="text-sm text-muted">Secure payment for your freelance gig</p>
            </div>
          </div>

          {/* Escrow details */}
          <div className="rounded-xl bg-pageBg border border-border p-4 mb-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Escrow ID</span>
              <span className="font-mono text-xs text-ink">{escrowId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Status</span>
              <span className="font-semibold text-orange-600">Pending payment</span>
            </div>
          </div>

          {/* Info banner */}
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 mb-6 text-sm text-blue-800">
            <p className="font-semibold mb-1">How escrow works</p>
            <p>Your payment is held securely until you approve each milestone. If no agreement is reached, funds can be refunded.</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleSimulatePayment}
              disabled={isProcessing}
              className="w-full bg-brandGreen text-white px-4 py-3 rounded-xl font-semibold hover:bg-darkGreen disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isProcessing
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                : 'Complete Payment'}
            </button>
            <button
              onClick={() => router.back()}
              disabled={isProcessing}
              className="w-full border border-border px-4 py-3 rounded-xl font-semibold text-sm hover:bg-pageBg disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EscrowPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted" />
      </div>
    }>
      <EscrowPaymentContent />
    </Suspense>
  );
}
