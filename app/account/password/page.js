'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { supabase } from '../../../lib/supabase';

export default function SetPasswordPage() {
  const router = useRouter();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    if (!oldPassword) {
      setError('Enter your current password');
      setSaving(false);
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      setSaving(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setSaving(false);
      return;
    }
    if (newPassword === oldPassword) {
      setError('New password must be different from current password');
      setSaving(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) {
        router.push('/login');
        return;
      }

      // 1. Verify old password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword,
      });

      if (signInError) {
        setError('Current password is incorrect');
        setSaving(false);
        return;
      }

      // 2. Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      // 3. Reset form
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Password updated successfully.');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Navbar />
      <div className="account-page">
        <h1>Set password</h1>
        <p>Change the password you use to log in.</p>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field-label">Current password</label>
          <input
            type="password"
            placeholder="Your current password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          <label className="field-label">New password</label>
          <input
            type="password"
            placeholder="At least 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={6}
            autoComplete="new-password"
            required
          />

          <label className="field-label">Confirm new password</label>
          <input
            type="password"
            placeholder="Retype your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={6}
            autoComplete="new-password"
            required
          />

          <button type="submit" disabled={saving}>
            {saving ? 'Updating...' : 'Save'}
          </button>
        </form>
      </div>
      <Footer />
    </>
  );
    }
