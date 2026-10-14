'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { supabase } from '../../../lib/supabase';
import {
  getProfile,
  updatePayoutAccount,
  getSignupName,
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
  const [selectedBankCode, setSelectedBankCode] = useState('');
  const [selectedBankName, setSelectedBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [resolved, setResolved] = useState(false);

  const [existingAccountNumber, setExistingAccountNumber] = useState('');
  const [existingAccountName, setExistingAccountName] = useState('');
  const [existingBankName, setExistingBankName] = useState('');

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
          if (profile.account_number) setResolved(true);
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

  // Auto-resolve when account number is 10 digits and bank is selected
  useEffect(() => {
    if (accountNumber.length === 10 && selectedBankCode) {
      // Only auto-resolve if the number or bank changed from what's saved
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

    // Get signup name for comparison
    const signupName = await getSignupName();
    const { match, reason } = namesMatch(accountName, signupName);

    if (!match) {
      setError(
        `Your bank account name doesn't match your signup name. (${reason})`
      );
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      await updatePayoutAccount(user.id, {
        bank_code: selectedBankCode,
        bank_name: selectedBankName,
        account_number: accountNumber,
        account_name: accountName,
      });

      setExistingAccountNumber(accountNumber);
      setExistingAccountName(accountName);
      setExistingBankName(selectedBankName);
      setSuccess('Payout account saved.');
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
        <p>
          Add your bank account to receive payouts from ticket sales. The
          account name must match your signup name.
        </p>

        {existingAccountNumber && !success && (
          <div className="payout-current">
            <div className="payout-current-label">Current payout account</div>
            <div className="payout-current-value">
              {existingAccountName}
            </div>
            <div className="payout-current-meta">
              {existingBankName} · ••••{existingAccountNumber.slice(-4)}
            </div>
          </div>
        )}

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
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

          <button
            type="submit"
            disabled={saving || !resolved}
          >
            {saving ? 'Saving...' : 'Save payout account'}
          </button>
        </form>
      </div>
      <Footer />
    </>
  );
            }
