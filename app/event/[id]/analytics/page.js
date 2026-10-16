'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import Navbar from '../../../../components/Navbar';
import Footer from '../../../../components/Footer';
import { supabase } from '../../../../lib/supabase';
import {
  getEvent,
  getEventStats,
  getEventOrders,
  getTicketSalesBreakdown,
  getRevenueByDay,
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

function formatChartDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
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

  // Chart
  const [range, setRange] = useState(30);
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);

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

  // Load chart data when range changes
  useEffect(() => {
    if (!eventId || loading) return;

    async function loadChart() {
      setChartLoading(true);
      try {
        const data = await getRevenueByDay(eventId, range);
        setChartData(data);
      } catch (err) {
        console.error('Chart data error:', err);
      } finally {
        setChartLoading(false);
      }
    }
    loadChart();
  }, [eventId, range, loading]);

  // Chart summary stats
  const chartTotal = chartData.reduce((s, d) => s + d.revenue, 0);
  const chartTickets = chartData.reduce((s, d) => s + d.tickets, 0);
  const bestDay = chartData.reduce(
    (best, d) => (d.revenue > (best?.revenue || 0) ? d : best),
    null
  );
  const avgPerDay = chartData.length > 0
    ? Math.round(chartTotal / chartData.length)
    : 0;

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
            <div className="analytics-card-value">
              {stats.ticketsSold}
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-card-label">Revenue</div>
            <div className="analytics-card-value">
              {formatNaira(stats.revenue)}
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-card-label">Orders</div>
            <div className="analytics-card-value">
              {stats.ordersCount}
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-card-label">Avg. order</div>
            <div className="analytics-card-value">
              {formatNaira(stats.avgOrder)}
            </div>
          </div>
        </div>

        {/* CHART */}
        <div className="analytics-section">
          <div className="chart-header">
            <h2>Revenue over time</h2>
            <div className="chart-range-tabs">
              <button
                type="button"
                className={range === 7 ? 'active' : ''}
                onClick={() => setRange(7)}
              >
                7 days
              </button>
              <button
                type="button"
                className={range === 30 ? 'active' : ''}
                onClick={() => setRange(30)}
              >
                30 days
              </button>
              <button
                type="button"
                className={range === 90 ? 'active' : ''}
                onClick={() => setRange(90)}
              >
                90 days
              </button>
            </div>
          </div>

          {chartLoading ? (
            <div className="chart-loading">
              <div className="skeleton skeleton-text-lg" style={{ width: '100%', height: 240 }} />
            </div>
          ) : chartTotal === 0 ? (
            <div className="chart-empty">
              No sales in this period yet.
            </div>
          ) : (
            <>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart
                    data={chartData}
                    margin={{ top: 10, right: 8, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e2e8f0"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatChartDate}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                      minTickGap={30}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) =>
                        v >= 1000 ? `₦${Math.round(v / 1000)}k` : `₦${v}`
                      }
                      width={50}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 10,
                        fontSize: 13,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                      }}
                      labelFormatter={(v) => formatChartDate(v)}
                      formatter={(value, name) => {
                        if (name === 'revenue') {
                          return [formatNaira(value), 'Revenue'];
                        }
                        return [value, name];
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-stats">
                <div className="chart-stat">
                  <div className="chart-stat-label">Total</div>
                  <div className="chart-stat-value">
                    {formatNaira(chartTotal)}
                  </div>
                </div>
                <div className="chart-stat">
                  <div className="chart-stat-label">Tickets</div>
                  <div className="chart-stat-value">{chartTickets}</div>
                </div>
                <div className="chart-stat">
                  <div className="chart-stat-label">Best day</div>
                  <div className="chart-stat-value">
                    {bestDay && bestDay.revenue > 0
                      ? `${formatNaira(bestDay.revenue)}`
                      : '—'}
                    {bestDay && bestDay.revenue > 0 && (
                      <span className="chart-stat-sub">
                        {' '}
                        · {formatChartDate(bestDay.date)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="chart-stat">
                  <div className="chart-stat-label">Avg / day</div>
                  <div className="chart-stat-value">
                    {formatNaira(avgPerDay)}
                  </div>
                </div>
              </div>
            </>
          )}
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
