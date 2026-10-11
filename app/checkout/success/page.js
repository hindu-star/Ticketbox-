'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';

function SuccessContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');
  const [status, setStatus] = useState('verifying');
  const [order, setOrder] = useState(null);

  useEffect(() => {
    async function verify() {
      if (!reference) {
        setStatus('error');
        return;
      }

      try {
        const res = await fetch(`/api/paystack/verify?reference=${reference}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Verification failed');

        setOrder(data.order);
        setStatus('success');
      } catch (err) {
        console.error(err);
        setStatus('error');
      }
    }
    verify();
  }, [reference]);

  if (status === 'verifying') {
    return (
      <div className="auth-page" style={{ textAlign: 'center' }}>
        <div className="success-icon">⏳</div>
        <h1>Verifying payment...</h1>
        <p>Please wait a moment.</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="auth-page" style={{ textAlign: 'center' }}>
        <div className="success-icon">⚠️</div>
        <h1>Something went wrong</h1>
        <p>We couldn't verify your payment. Please check your email or contact support.</p>
        <Link href="/browse" className="content-btn-primary">Back to events</Link>
      </div>
    );
  }

  return (
    <div className="auth-page" style={{ textAlign: 'center', maxWidth: 520 }}>
      <div className="success-icon">🎉</div>
      <h1>You're going!</h1>
      <p style={{ color: '#64748b', marginBottom: 24 }}>
        Your ticket confirmation has been sent to your email.
      </p>

      {order && (
        <div className="checkout-summary">
          <div className="summary-row">
            <span>Order ID</span>
            <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
              {order.paystack_reference}
            </span>
          </div>
          <div className="summary-row summary-total">
            <span>Amount paid</span>
            <span>₦{Number(order.total).toLocaleString()}</span>
          </div>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <Link href="/browse" className="content-btn-primary">
          Browse more events
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={
        <div className="auth-page" style={{ textAlign: 'center' }}>
          <p>Loading...</p>
        </div>
      }>
        <SuccessContent />
      </Suspense>
      <Footer />
    </>
  );
}
