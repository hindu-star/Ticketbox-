'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { signIn, signUp } from '../../lib/auth';

export default function LoginPage() {
  const [mode, setMode] = useState('login');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup state
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await signIn(loginEmail, loginPassword);
      router.push('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!firstName.trim()) {
      setError('First name is required');
      return;
    }
    if (!lastName.trim()) {
      setError('Last name is required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, firstName.trim(), lastName.trim(), middleName.trim());
      setSuccess(
        'Account created! Check your email to confirm your account, then log in.'
      );
      // Reset signup fields
      setFirstName('');
      setMiddleName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  function switchToSignup() {
    setMode('signup');
    setError('');
    setSuccess('');
  }

  function switchToLogin() {
    setMode('login');
    setError('');
    setSuccess('');
  }

  return (
    <>
      <Navbar />
      <div className="auth-page" style={{ maxWidth: 480 }}>
        {mode === 'login' ? (
          <>
            <h1>Welcome back</h1>
            <p>Log in to manage your events and tickets.</p>

            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}

            <form className="auth-form" onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="Email address"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Logging in...' : 'Log in'}
              </button>
            </form>

            <p className="auth-switch">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                className="auth-link"
                onClick={switchToSignup}
              >
                Sign up
              </button>
            </p>
          </>
        ) : (
          <>
            <h1>Create an account</h1>
            <p>Give us a few details and start buying and selling tickets.</p>

            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}

            <form className="auth-form" onSubmit={handleSignup}>
              <input
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Middle name (optional)"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Creating account...' : 'Sign up'}
              </button>
            </form>

            <p className="auth-switch">
              Already have an account?{' '}
              <button
                type="button"
                className="auth-link"
                onClick={switchToLogin}
              >
                Log in
              </button>
            </p>
          </>
        )}
      </div>
      <Footer />
    </>
  );
                  }
