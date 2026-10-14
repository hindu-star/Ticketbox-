'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { supabase } from '../../lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [validSession, setValidSession] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Supabase puts a session in the URL hash when the user clicks the reset link.
    // The client library automatically picks it up via onAuthStateChange.
    supabase.auth.getSession().then(({ data }) => {
      setValidSession(!!data.session);
      setChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setValidSession(!!session);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSaving(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      setSuccess(true);

      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  }

  if (checking) {
    return (
      <>
        <Navbar />
        <div className="auth-page">
          <p style={{ color: '#64748b' }}>Checking reset link...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!validSession) {
    return (
      <>
        <Navbar />
        <div className="auth-page">
          <h1>Reset link invalid</h1>
          <p>
            This password reset link has expired or was already used. Please
            request a new one.
          </p>
          <a
            href="/forgot-password"
            className="content-btn-primary"
            style={{ display: 'inline-block', marginTop: 16 }}
          >
            Request new link
          </a>
        </div>
        <Footer />
      </>
    );
  }

  if (success) {
    return (
      <>
        <Navbar />
        <div className="auth-page">
          <h1>Password updated ✅</h1>
          <p>Redirecting you to login...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="auth-page">
        <h1>Set a new password</h1>
        <p>Choose something you&apos;ll remember.</p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            autoComplete="new-password"
            required
            autoFocus
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={6}
            autoComplete="new-password"
            required
          />
          <button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Update password'}
          </button>
        </form>
      </div>
      <Footer />
    </>
  );
      }
