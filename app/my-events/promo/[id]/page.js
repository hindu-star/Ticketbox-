'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../../components/Navbar';
import Footer from '../../../../components/Footer';
import { supabase } from '../../../../lib/supabase';
import { getEvent } from '../../../../lib/events';
import {
  createPromoCode,
  getPromoCodesForEvent,
  deletePromoCode,
} from '../../../../lib/promo';

export default function PromoCodesPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id;

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [codes, setCodes] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Form state
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

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
        const list = await getPromoCodesForEvent(eventId);
        setCodes(list);
      } catch (err) {
        setError(err.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    if (eventId) load();
  }, [eventId, router]);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      await createPromoCode({
        eventId,
        organizerId: user.id,
        code,
        discountType,
        discountValue,
        maxUses: maxUses ? Number(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      });

      setSuccess(`Code "${code.toUpperCase()}" created.`);
      setCode('');
      setDiscountValue('');
      setMaxUses('');
      setExpiresAt('');

      const list = await getPromoCodesForEvent(eventId);
      setCodes(list);
    } catch (err) {
      setError(err.message || 'Failed to create code');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, codeText) {
    const confirmed = window.confirm(
      `Delete code "${codeText}"? This can't be undone.`
    );
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await deletePromoCode(id);
      setCodes(codes.filter((c) => c.id !== id));
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(iso) {
    if (!iso) return 'Never';
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  function formatDiscount(c) {
    if (c.discount_type === 'percent') {
      return `${c.discount_value}% off`;
    }
    return `₦${Number(c.discount_value).toLocaleString()} off`;
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="account-page">
          <p style={{ color: '#64748b' }}>Loading...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error && !event) {
    return (
      <>
        <Navbar />
        <div className="account-page">
          <div className="auth-error">{error}</div>
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
      <div className="account-page" style={{ maxWidth: 640 }}>
        <Link href="/my-events" className="analytics-back">
          ← Back to My Events
        </Link>
        <h1>Promo codes</h1>
        <p>
          Create discount codes for <strong>{event?.title}</strong>. Share them
          with your audience — buyers enter them at checkout.
        </p>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        {/* CREATE FORM */}
        <form className="auth-form promo-form" onSubmit={handleCreate}>
          <label className="field-label">Code</label>
          <input
            type="text"
            placeholder="e.g. EARLYBIRD"
            value={code}
            onChange={(e) =>
              setCode(
                e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, '')
                  .slice(0, 20)
              )
            }
            required
          />

          <div className="promo-row">
            <div style={{ flex: 1 }}>
              <label className="field-label">Type</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
              >
                <option value="percent">Percent off</option>
                <option value="fixed">Fixed amount off</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="field-label">
                {discountType === 'percent' ? 'Percent' : 'Amount (₦)'}
              </label>
              <input
                type="number"
                placeholder={
                  discountType === 'percent' ? 'e.g. 20' : 'e.g. 1000'
                }
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                min="1"
                max={discountType === 'percent' ? 100 : undefined}
                required
              />
            </div>
          </div>

          <div className="promo-row">
            <div style={{ flex: 1 }}>
              <label className="field-label">
                Max uses (optional)
              </label>
              <input
                type="number"
                placeholder="Unlimited"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                min="1"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="field-label">
                Expires (optional)
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" disabled={saving}>
            {saving ? 'Creating...' : 'Create code'}
          </button>
        </form>

        {/* EXISTING CODES */}
        <div className="promo-list-section">
          <h2 className="promo-list-title">
            Active codes ({codes.length})
          </h2>

          {codes.length === 0 ? (
            <div className="empty-state">
              <p>No codes yet. Create one above.</p>
            </div>
          ) : (
            <div className="promo-list">
              {codes.map((c) => {
                const expired =
                  c.expires_at && new Date(c.expires_at) < new Date();
                const maxed =
                  c.max_uses !== null &&
                  c.times_used >= c.max_uses;

                return (
                  <div key={c.id} className="promo-row-item">
                    <div className="promo-row-left">
                      <div className="promo-code-label">{c.code}</div>
                      <div className="promo-code-meta">
                        {formatDiscount(c)} · Used {c.times_used}
                        {c.max_uses ? ` / ${c.max_uses}` : ''}
                        {c.expires_at
                          ? ` · Expires ${formatDate(c.expires_at)}`
                          : ''}
                      </div>
                      {(expired || maxed) && (
                        <div className="promo-code-status">
                          {expired ? 'Expired' : 'Maxed out'}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="promo-delete-btn"
                      onClick={() => handleDelete(c.id, c.code)}
                      disabled={deletingId === c.id}
                    >
                      {deletingId === c.id ? '...' : 'Delete'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
          }
