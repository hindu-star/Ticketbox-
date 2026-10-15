'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { supabase } from '../../lib/supabase';
import {
  ADMIN_USER_ID,
  getPlatformStats,
  getRecentOrders,
  searchUserByEmail,
} from '../../lib/admin';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [stats, setStats] = useState(null);
  const [approvals, setApprovals] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [busyId, setBusyId] = useState(null);

  // User search
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();

      // Admin-only guard
      if (!user || user.id !== ADMIN_USER_ID) {
        router.replace('/');
        return;
      }

      setUser(user);

      try {
        const s = await getPlatformStats();
        setStats(s);

        const o = await getRecentOrders(20);
        setRecentOrders(o);

        await loadApprovals();
      } catch (err) {
        setError(err.message || 'Failed to load admin data');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  async function loadApprovals() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch('/api/admin/pending-approvals', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load approvals');
      }

      const data = await res.json();
      setApprovals(data.approvals || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleApprove(userId, name) {
    const ok = window.confirm(
      `Approve business account for ${name}? This will activate their payouts.`
    );
    if (!ok) return;

    setBusyId(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch('/api/admin/approve-business', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to approve');
      }

      setApprovals(approvals.filter((a) => a.id !== userId));
    } catch (err) {
      alert(err.message || 'Failed to approve');
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(userId, name) {
    const ok = window.confirm(
      `Reject business account for ${name}? This will clear their bank details.`
    );
    if (!ok) return;

    setBusyId(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch('/api/admin/reject-business', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reject');
      }

      setApprovals(approvals.filter((a) => a.id !== userId));
    } catch (err) {
      alert(err.message || 'Failed to reject');
    } finally {
      setBusyId(null);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    setSearchError('');
    setSearchResult(null);

    if (!searchEmail.trim()) return;

    setSearching(true);
    try {
      const result = await searchUserByEmail(searchEmail.trim().toLowerCase());
      if (!result) {
        setSearchError('No user found with that email.');
      } else {
        setSearchResult(result);
      }
    } catch (err) {
      setSearchError(err.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  }

  function formatNaira(n) {
    return `₦${Number(n || 0).toLocaleString()}`;
  }

  function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  function timeAgo(iso) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="admin-page">
          <p style={{ color: '#64748b' }}>Loading admin...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!user) return null;

  return (
    <>
      <Navbar />
      <div className="admin-page">
        <div className="admin-header">
          <h1>Admin</h1>
          <p>Platform overview and controls. Only visible to you.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {/* STATS */}
        {stats && (
          <section className="admin-section">
            <h2 className="admin-section-title">Platform stats</h2>

            <div className="admin-stats-grid">
              <div className="admin-stat">
                <div className="admin-stat-label">Organizers</div>
                <div className="admin-stat-value">{stats.organizers}</div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat-label">Events</div>
                <div className="admin-stat-value">
                  {stats.publishedEvents}
                  <span className="admin-stat-sub">
                    {' '}/ {stats.totalEvents} total
                  </span>
                </div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat-label">Drafts</div>
                <div className="admin-stat-value">
                  {stats.draftEvents}
                </div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat-label">Tickets sold</div>
                <div className="admin-stat-value">
                  {stats.ticketsSold}
                </div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat-label">Revenue (all time)</div>
                <div className="admin-stat-value">
                  {formatNaira(stats.revenueAllTime)}
                </div>
              </div>
              <div className="admin-stat">
                <div className="admin-stat-label">Revenue (this month)</div>
                <div className="admin-stat-value">
                  {formatNaira(stats.revenueThisMonth)}
                </div>
              </div>
              <div className="admin-stat admin-stat-highlight">
                <div className="admin-stat-label">
                  Your earnings (all time)
                </div>
                <div className="admin-stat-value">
                  {formatNaira(stats.platformFeeAllTime)}
                </div>
              </div>
              <div className="admin-stat admin-stat-highlight">
                <div className="admin-stat-label">
                  Your earnings (this month)
                </div>
                <div className="admin-stat-value">
                  {formatNaira(stats.platformFeeThisMonth)}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* PENDING APPROVALS */}
        <section className="admin-section">
          <h2 className="admin-section-title">
            Pending business approvals
            {approvals.length > 0 && (
              <span className="admin-count-badge">
                {approvals.length}
              </span>
            )}
          </h2>

          {approvals.length === 0 ? (
            <div className="admin-empty">
              No pending approvals. 🎉
            </div>
          ) : (
            <div className="admin-approval-list">
              {approvals.map((a) => {
                const name =
                  a.display_name ||
                  [a.first_name, a.last_name].filter(Boolean).join(' ') ||
                  a.username ||
                  'Organizer';

                return (
                  <div key={a.id} className="admin-approval-card">
                    <div className="admin-approval-header">
                      <div>
                        <div className="admin-approval-name">{name}</div>
                        <div className="admin-approval-email">
                          {a.email || '—'}
                        </div>
                      </div>
                      <div className="admin-approval-time">
                        {timeAgo(a.updated_at)}
                      </div>
                    </div>

                    <div className="admin-approval-details">
                      <div className="admin-detail-row">
                        <span className="admin-detail-label">Bank</span>
                        <span>{a.bank_name || '—'}</span>
                      </div>
                      <div className="admin-detail-row">
                        <span className="admin-detail-label">
                          Account number
                        </span>
                        <span style={{ fontFamily: 'monospace' }}>
                          {a.account_number || '—'}
                        </span>
                      </div>
                      <div className="admin-detail-row">
                        <span className="admin-detail-label">
                          Account name
                        </span>
                        <span>{a.account_name || '—'}</span>
                      </div>
                      <div className="admin-detail-row">
                        <span className="admin-detail-label">User ID</span>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: 11,
                          }}
                        >
                          {a.id}
                        </span>
                      </div>
                    </div>

                    <div className="admin-approval-note">
                      📧 Email this organizer for CAC + bank statement + ID
                      before approving. See the SOP.
                    </div>

                    <div className="admin-approval-actions">
                      <button
                        type="button"
                        className="admin-btn-approve"
                        onClick={() => handleApprove(a.id, name)}
                        disabled={busyId === a.id}
                      >
                        {busyId === a.id ? '...' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        className="admin-btn-reject"
                        onClick={() => handleReject(a.id, name)}
                        disabled={busyId === a.id}
                      >
                        {busyId === a.id ? '...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* RECENT ORDERS */}
        <section className="admin-section">
          <h2 className="admin-section-title">Recent orders</h2>

          {recentOrders.length === 0 ? (
            <div className="admin-empty">No orders yet.</div>
          ) : (
            <div className="admin-table">
              {recentOrders.map((o) => (
                <div key={o.id} className="admin-table-row">
                  <div className="admin-table-left">
                    <div className="admin-table-primary">
                      {o.buyer_email}
                    </div>
                    <div className="admin-table-secondary">
                      {o.events?.title || 'Event'} · {o.quantity} ticket
                      {o.quantity === 1 ? '' : 's'} · {timeAgo(o.created_at)}
                    </div>
                  </div>
                  <div className="admin-table-right">
                    <div className="admin-table-amount">
                      {formatNaira(o.total)}
                    </div>
                    <div
                      className={`admin-table-status status-${o.status}`}
                    >
                      {o.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* USER SEARCH */}
        <section className="admin-section">
          <h2 className="admin-section-title">Find a user</h2>

          <form className="admin-search-form" onSubmit={handleSearch}>
            <input
              type="email"
              placeholder="Search by email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
            />
            <button type="submit" disabled={searching}>
              {searching ? '...' : 'Search'}
            </button>
          </form>

          {searchError && (
            <div className="admin-empty" style={{ color: '#b91c1c' }}>
              {searchError}
            </div>
          )}

          {searchResult && (
            <div className="admin-user-result">
              <div className="admin-approval-name">
                {searchResult.profile.display_name ||
                  [searchResult.profile.first_name, searchResult.profile.last_name]
                    .filter(Boolean)
                    .join(' ') ||
                  searchResult.profile.username ||
                  'User'}
              </div>
              <div className="admin-detail-row">
                <span className="admin-detail-label">Email</span>
                <span>{searchResult.profile.email || '—'}</span>
              </div>
              <div className="admin-detail-row">
                <span className="admin-detail-label">Username</span>
                <span>
                  {searchResult.profile.username
                    ? `@${searchResult.profile.username}`
                    : '—'}
                </span>
              </div>
              <div className="admin-detail-row">
                <span className="admin-detail-label">Account type</span>
                <span>{searchResult.profile.account_type || 'personal'}</span>
              </div>
              <div className="admin-detail-row">
                <span className="admin-detail-label">
                  Payout verified
                </span>
                <span>
                  {searchResult.profile.payout_verified ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div className="admin-detail-row">
                <span className="admin-detail-label">Events</span>
                <span>{searchResult.events.length}</span>
              </div>

              {searchResult.events.length > 0 && (
                <div className="admin-user-events">
                  {searchResult.events.map((ev) => (
                    <div key={ev.id} className="admin-user-event">
                      <span>{ev.title}</span>
                      <span className="admin-user-event-status">
                        {ev.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
      <Footer />
    </>
  );
            }
