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
          // Fall back to signup metadata
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
      </div>
      <Footer />
    </>
  );
      }
