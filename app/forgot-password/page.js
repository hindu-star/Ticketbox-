'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { supabase } from '../../lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (resetError) throw resetError;

      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <div className="auth-page" style={{ maxWidth: 440 }}>
        {success ? (
          <>
            <h1>Check your email</h1>
            <p>
              If an account exists for <strong>{email}</strong>, we&apos;ve sent
              a link to reset your password. Check your inbox (and spam folder).
            </p>
            <Link
              href="/login"
              className="content-btn-primary"
              style={{ display: 'inline-block', marginTop: 16 }}
            >
              Back to login
            </Link>
          </>
        ) : (
          <>
            <h1>Forgot password?</h1>
            <p>
              Enter the email address you used to sign up. We&apos;ll send you a
              link to reset your password.
            </p>

            {error && <div className="auth-error">{error}</div>}

            <form className="auth-form" onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>

            <p className="auth-switch">
              Remembered it?{' '}
              <Link href="/login" className="auth-link">
                Back to login
              </Link>
            </p>
          </>
        )}
      </div>
      <Footer />
    </>
  );
          }
