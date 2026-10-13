'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../../components/Navbar';
import Footer from '../../../../components/Footer';
import { supabase } from '../../../../lib/supabase';
import {
  getEvent,
  getEventStats,
  getEventOrders,
  getTicketSalesBreakdown,
} from '../../../../lib/events';

function formatNaira(n) {
  return `₦${Number(n || 0).toLocaleString()}`;
}

function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [event, setEvent] = useState(null);
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [breakdown, setBreakdown] = useState([]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const ev = await getEvent(eventId);

        if (ev.organizer_id !== user.id) {
          router.push('/my-events');
          return;
        }

        setEvent(ev);

        const [s, o, b] = await Promise.all([
          getEventStats(eventId),
          getEventOrders(eventId),
          getTicketSalesBreakdown(eventId),
        ]);

        setStats(s);
        setOrders(o);
        setBreakdown(b);
      } catch (err) {
        setError(err.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }
    if (eventId) load();
  }, [eventId, router]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="dashboard-page">
          <p style={{ color: '#64748b' }}>Loading analytics...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !event) {
    return (
      <>
        <Navbar />
        <div className="dashboard-page">
          <div className="auth-error">{error || 'Event not found'}</div>
          <Link href="/my-events" className="content-btn-secondary">
            Back to My Events
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="analytics-page">
        <div className="analytics-header">
          <Link href="/my-events" className="analytics-back">
            ← Back to My Events
          </Link>
          <h1>{event.title}</h1>
          <p className="analytics-subtitle">Sales analytics</p>
        </div>

        {/* SUMMARY CARDS */}
        <div className="analytics-summary">
          <div className="analytics-card">
            <div className="analytics-card-label">Tickets sold</div>
            <div className="analytics-card-value">{stats.ticketsSold}</div>
          </div>
          <div className="analytics-card">
            <div className="analytics-card-label">Revenue</div>
            <div className="analytics-card-value">
              {formatNaira(stats.revenue)}
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-card-label">Orders</div>
            <div className="analytics-card-value">{stats.ordersCount}</div>
          </div>
          <div className="analytics-card">
            <div className="analytics-card-label">Avg. order</div>
            <div className="analytics-card-value">
              {formatNaira(stats.avgOrder)}
            </div>
          </div>
        </div>

        {/* TICKET BREAKDOWN */}
        <div className="analytics-section">
          <h2>By ticket type</h2>
          {breakdown.length === 0 ? (
            <p style={{ color: '#64748b' }}>No tickets created yet.</p>
          ) : (
            <div className="analytics-breakdown">
              {breakdown.map((t) => {
                const percent = t.capacity
                  ? Math.round((t.sold / t.capacity) * 100)
                  : null;
                return (
                  <div key={t.id} className="breakdown-row">
                    <div className="breakdown-top">
                      <div className="breakdown-name">{t.name}</div>
                      <div className="breakdown-numbers">
                        <span>
                          <strong>{t.sold}</strong> sold
                          {t.capacity ? ` / ${t.capacity}` : ''}
                        </span>
                        <span className="breakdown-revenue">
                          {formatNaira(t.revenue)}
                        </span>
                      </div>
                    </div>
                    {t.capacity && (
                      <div className="breakdown-bar">
                        <div
                          className="breakdown-bar-fill"
                          style={{
                            width: `${Math.min(100, percent)}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RECENT ORDERS */}
        <div className="analytics-section">
          <h2>Recent orders</h2>
          {orders.length === 0 ? (
            <p style={{ color: '#64748b' }}>
              No paid orders yet. Share your event to start selling.
            </p>
          ) : (
            <div className="analytics-orders">
              {orders.slice(0, 30).map((o) => (
                <div key={o.id} className="analytics-order-row">
                  <div className="analytics-order-main">
                    <div className="analytics-order-email">
                      {o.buyer_email}
                    </div>
                    <div className="analytics-order-meta">
                      {formatDateTime(o.created_at)} · {o.quantity} ticket
                      {o.quantity === 1 ? '' : 's'}
                    </div>
                  </div>
                  <div className="analytics-order-amount">
                    {formatNaira(o.total)}
                  </div>
                </div>
              ))}
              {orders.length > 30 && (
                <p className="analytics-more">
                  Showing latest 30 of {orders.length} orders.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
