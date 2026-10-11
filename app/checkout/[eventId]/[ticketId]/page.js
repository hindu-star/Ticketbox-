'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../../components/Navbar';
import Footer from '../../../../components/Footer';
import { supabase } from '../../../../lib/supabase';
import { getEvent, getTicketTypes } from '../../../../lib/events';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { eventId, ticketId } = params;

  const [event, setEvent] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [user, setUser] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push(`/login?next=/checkout/${eventId}/${ticketId}`);
          return;
        }
        setUser(user);

        const ev = await getEvent(eventId);
        setEvent(ev);

        const tickets = await getTicketTypes(eventId);
        const t = tickets.find((x) => x.id === ticketId);

        if (!t) throw new Error('Ticket not found');
        setTicket(t);
      } catch (err) {
        setError(err.message || 'Failed to load checkout');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [eventId, ticketId, router]);

  const subtotal = ticket ? Number(ticket.price) * quantity : 0;
  const serviceFee = Math.round(subtotal * 0.05);
  const total = subtotal + serviceFee;

  async function handlePay() {
    setPaying(true);
    setError('');

    try {
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          ticketId,
          quantity,
          buyerEmail: user.email,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment init failed');

      window.location.href = data.authorization_url;
    } catch (err) {
      setError(err.message || 'Payment failed to start');
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="auth-page">
          <p style={{ color: '#64748b' }}>Loading checkout...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error && !event) {
    return (
      <>
        <Navbar />
        <div className="auth-page">
          <div className="auth-error">{error}</div>
          <Link href="/browse" className="content-btn-secondary">Back to events</Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="auth-page" style={{ maxWidth: 520 }}>
        <h1>Checkout</h1>
        <p>Review your order and complete payment.</p>

        {error && <div className="auth-error">{error}</div>}

        <div className="checkout-card">
          <div className="checkout-event-title">{event.title}</div>
          <div className="checkout-event-meta">
            📍 {event.location}
          </div>
        </div>

        <div className="checkout-card">
          <div className="checkout-ticket-name">{ticket.name}</div>
          {ticket.description && (
            <div className="checkout-ticket-desc">{ticket.description}</div>
          )}

          <div className="quantity-row">
            <span>Quantity</span>
            <div className="quantity-controls">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                −
              </button>
              <span className="quantity-value">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(10, quantity + 1))}
                disabled={quantity >= 10}
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="checkout-summary">
          <div className="summary-row">
            <span>Subtotal ({quantity} × ₦{Number(ticket.price).toLocaleString()})</span>
            <span>₦{subtotal.toLocaleString()}</span>
          </div>
          <div className="summary-row">
            <span>Service fee (5%)</span>
            <span>₦{serviceFee.toLocaleString()}</span>
          </div>
          <div className="summary-row summary-total">
            <span>Total</span>
            <span>₦{total.toLocaleString()}</span>
          </div>
        </div>

        <button
          onClick={handlePay}
          disabled={paying}
          className="checkout-pay-btn"
        >
          {paying ? 'Redirecting to Paystack...' : `Pay ₦${total.toLocaleString()}`}
        </button>

        <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 12 }}>
          Secure payment powered by Paystack
        </p>
      </div>
      <Footer />
    </>
  );
      }
