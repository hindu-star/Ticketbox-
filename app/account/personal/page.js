'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { supabase } from '../../../lib/supabase';
import { getProfile, updatePersonalInfo } from '../../../lib/profile';

export default function PersonalProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');

  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  // Delete account state
  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      setEmail(user.email || '');

      try {
        const profile = await getProfile(user.id);

        if (profile) {
          setFirstName(profile.first_name || '');
          setMiddleName(profile.middle_name || '');
          setLastName(profile.last_name || '');
          setPhone(profile.phone || '');
        } else {
          const meta = user.user_metadata || {};
          setFirstName(meta.first_name || '');
          setMiddleName(meta.middle_name || '');
          setLastName(meta.last_name || '');
        }
      } catch (err) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    if (!firstName.trim()) {
      setError('First name is required');
      setSaving(false);
      return;
    }
    if (!lastName.trim()) {
      setError('Last name is required');
      setSaving(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      await updatePersonalInfo(user.id, {
        first_name: firstName.trim(),
        middle_name: middleName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
      });

      setSuccess('Profile saved.');
    } catch (err) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount(e) {
    e.preventDefault();
    setDeleteError('');

    if (deleteConfirm !== 'DELETE') {
      setDeleteError('Type DELETE (all caps) to confirm');
      return;
    }
    if (!deletePassword) {
      setDeleteError('Enter your password');
      return;
    }

    setDeleting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) {
        throw new Error('Not logged in');
      }

      // Verify password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: deletePassword,
      });

      if (signInError) {
        setDeleteError('Incorrect password');
        setDeleting(false);
        return;
      }

      // Call server route to delete everything
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete account');

      // Sign out locally and redirect
      await supabase.auth.signOut();
      router.push('/');
    } catch (err) {
      console.error(err);
      setDeleteError(err.message || 'Failed to delete account');
      setDeleting(false);
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
        <h1>Personal profile</h1>
        <p>Update your name and contact information.</p>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
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

          <label className="field-label">Email address</label>
          <input
            type="email"
            value={email}
            disabled
            style={{ background: '#f8fafc', color: '#64748b' }}
          />
          <p className="field-hint" style={{ marginTop: -6, marginBottom: 10 }}>
            Email can&apos;t be changed here.
          </p>

          <input
            type="tel"
            placeholder="Phone number (e.g. +2348012345678)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>

        {/* DANGER ZONE */}
        <div className="danger-zone">
          <h2 className="danger-zone-title">Danger zone</h2>
          <p className="danger-zone-text">
            Deleting your account removes everything: your profile, all your
            events, and all associated ticket records. This cannot be undone.
          </p>
          <button
            type="button"
            className="danger-zone-btn"
            onClick={() => {
              setShowDelete(true);
              setDeleteError('');
              setDeletePassword('');
              setDeleteConfirm('');
            }}
          >
            Delete my account
          </button>
        </div>
      </div>

      {/* DELETE MODAL */}
      {showDelete && (
        <div className="modal-backdrop" onClick={() => setShowDelete(false)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-title">Delete your account?</h2>
            <p className="modal-text">
              This permanently deletes your account, all events you&apos;ve
              created, and all associated ticket data. This cannot be undone.
            </p>

            {deleteError && <div className="auth-error">{deleteError}</div>}

            <form className="auth-form" onSubmit={handleDeleteAccount}>
              <label className="field-label">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                required
              />

              <label className="field-label">
                Type <strong>DELETE</strong> to confirm
              </label>
              <input
                type="text"
                placeholder="DELETE"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                required
              />

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-cancel"
                  onClick={() => setShowDelete(false)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-delete"
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
  }
