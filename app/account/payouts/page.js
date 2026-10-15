'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { supabase } from '../../../lib/supabase';
import {
  getProfile,
  updatePayoutAccount,
  updatePayoutAccountBusiness,
  getCurrentName,
  namesMatch,
} from '../../../lib/profile';

export default function PayoutsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [banksLoading, setBanksLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [banks, setBanks] = useState([]);
  const [isBusiness, setIsBusiness] = useState(false);
  const [selectedBankCode, setSelectedBankCode] = useState('');
  const [selectedBankName, setSelectedBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [resolved, setResolved] = useState(false);
  const [pendingReview, setPendingReview] = useState(false);

  const [existingAccountNumber, setExistingAccountNumber] = useState('');
  const [existingAccountName, setExistingAccountName] = useState('');
  const [existingBankName, setExistingBankName] = useState('');
  const [existingAccountType, setExistingAccountType] = useState('personal');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const profile = await getProfile(user.id);
        if (profile) {
          setSelectedBankCode(profile.bank_code || '');
          setSelectedBankName(profile.bank_name || '');
          setAccountNumber(profile.account_number || '');
          setAccountName(profile.account_name || '');
          setExistingAccountNumber(profile.account_number || '');
          setExistingAccountName(profile.account_name || '');
          setExistingBankName(profile.bank_name || '');
          setExistingAccountType(profile.account_type || 'personal');
          setIsBusiness(profile.account_type === 'business');

          if (profile.account_number) setResolved(true);
          if (
            profile.account_type === 'business' &&
            !profile.payout_verified
          ) {
            setPendingReview(true);
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    load();

    async function loadBanks() {
      try {
        const res = await fetch('/api/paystack/banks');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load banks');
        setBanks(data.banks || []);
      } catch (err) {
        setError(err.message || 'Failed to load banks');
      } finally {
        setBanksLoading(false);
      }
    }
    loadBanks();
  }, [router]);

  useEffect(() => {
    if (accountNumber.length === 10 && selectedBankCode) {
      if (
        accountNumber !== existingAccountNumber ||
        selectedBankCode !== existingBankCodeFromName()
      ) {
        resolveAccount();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountNumber, selectedBankCode]);

  function existingBankCodeFromName() {
    const match = banks.find((b) => b.name === existingBankName);
    return match ? match.code : '';
  }

  async function resolveAccount() {
    setResolving(true);
    setError('');
    setAccountName('');
    setResolved(false);

    try {
      const res = await fetch('/api/paystack/resolve-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_number: accountNumber,
          bank_code: selectedBankCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Could not verify this account');
        setResolving(false);
        return;
      }

      setAccountName(data.account_name);
      setResolved(true);
    } catch (err) {
      setError(err.message || 'Failed to verify account');
    } finally {
      setResolving(false);
    }
  }

  function handleBankChange(e) {
    const code = e.target.value;
    const bank = banks.find((b) => b.code === code);
    setSelectedBankCode(code);
    setSelectedBankName(bank ? bank.name : '');
    setAccountName('');
    setResolved(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedBankCode) {
      setError('Select your bank');
      return;
    }
    if (!accountNumber || accountNumber.length !== 10) {
      setError('Enter a valid 10-digit account number');
      return;
    }
    if (!resolved || !accountName) {
      setError('Verify your account number first');
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      if (isBusiness) {
        // Business flow — skip name match, submit for review
        await updatePayoutAccountBusiness(user.id, {
          bank_code: selectedBankCode,
          bank_name: selectedBankName,
          account_number: accountNumber,
          account_name: accountName,
        });

        // Fire subaccount route — returns pending_review for business
        await fetch('/api/paystack/subaccount', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });

        setExistingAccountNumber(accountNumber);
        setExistingAccountName(accountName);
        setExistingBankName(selectedBankName);
        setExistingAccountType('business');
        setPendingReview(true);
        setSuccess(
          'Business account submitted. We will verify and approve within 24 hours.'
        );
      } else {
        // Personal flow — enforce bidirectional name match
        const currentName = await getCurrentName();
        const { match, reason } = namesMatch(accountName, currentName);

        if (!match) {
          setError(
            `Your bank account name doesn't match your profile name. ${reason} — Update your Personal profile to match, or check the business box above.`
          );
          setSaving(false);
          return;
        }

        await updatePayoutAccount(user.id, {
          bank_code: selectedBankCode,
          bank_name: selectedBankName,
          account_number: accountNumber,
          account_name: accountName,
        });

        const subRes = await fetch('/api/paystack/subaccount', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });

        const subData = await subRes.json();

        if (!subRes.ok) {
          setError(
            `Bank details saved, but Paystack setup failed: ${
              subData.error || 'Unknown error'
            }. Contact support.`
          );
          setSaving(false);
          return;
        }

        setExistingAccountNumber(accountNumber);
        setExistingAccountName(accountName);
        setExistingBankName(selectedBankName);
        setExistingAccountType('personal');
        setSuccess('Payout account saved and verified.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save payout account');
    } finally {
      setSaving(false);
    }
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

  return (
    <>
      <Navbar />
      <div className="account-page">
        <h1>Payout account</h1>
        <p>Add your bank account to receive payouts from ticket sales.</p>

        {existingAccountNumber && !success && (
          <div className="payout-current">
            <div className="payout-current-label">Current payout account</div>
            <div className="payout-current-value">
              {existingAccountName}
            </div>
            <div className="payout-current-meta">
              {existingBankName} · ••••{existingAccountNumber.slice(-4)}
              {existingAccountType === 'business' && ' · Business'}
            </div>
          </div>
        )}

        {pendingReview && !success && (
          <div className="payout-pending">
            <strong>Pending review.</strong> This business account is awaiting
            approval. We&apos;ll verify and activate within 24 hours. You&apos;ll
            be notified by email.
          </div>
        )}

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="business-checkbox">
            <input
              type="checkbox"
              checked={isBusiness}
              onChange={(e) => setIsBusiness(e.target.checked)}
            />
            <span>This is a business bank account</span>
          </label>

          {isBusiness && (
            <p className="field-hint" style={{ marginTop: -8 }}>
              Business accounts are manually verified. Please upload your CAC
              registration to <strong>ticketboxhq@gmail.com</strong> after
              submitting.
            </p>
          )}

          <label className="field-label">Bank</label>
          <select
            value={selectedBankCode}
            onChange={handleBankChange}
            required
            disabled={banksLoading}
          >
            <option value="">
              {banksLoading ? 'Loading banks...' : 'Select bank'}
            </option>
            {banks.map((b) => (
              <option key={b.code} value={b.code}>
                {b.name}
              </option>
            ))}
          </select>

          <label className="field-label">Account number</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="10-digit account number"
            value={accountNumber}
            onChange={(e) =>
              setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))
            }
            maxLength={10}
            required
          />

          <label className="field-label">Account name</label>
          <input
            type="text"
            value={
              resolving
                ? 'Verifying...'
                : accountName || 'Auto-filled from bank'
            }
            disabled
            style={{
              background: '#f8fafc',
              color: accountName ? '#16a34a' : '#64748b',
              fontWeight: accountName ? 700 : 400,
            }}
          />

          {resolved && accountName && (
            <p className="field-hint" style={{ color: '#16a34a' }}>
              ✓ Account verified
            </p>
          )}

          {!isBusiness && (
            <p className="field-hint" style={{ marginTop: 8 }}>
              If your bank name doesn&apos;t match your profile name, update
              your{' '}
              <Link
                href="/account/personal"
                style={{ color: 'var(--blue)', fontWeight: 600 }}
              >
                Personal profile
              </Link>{' '}
              first, or check the business box above.
            </p>
          )}

          <button type="submit" disabled={saving || !resolved}>
            {saving
              ? 'Saving...'
              : isBusiness
              ? 'Submit for review'
              : 'Save payout account'}
          </button>
        </form>
      </div>
      <Footer />
    </>
  );
              }
