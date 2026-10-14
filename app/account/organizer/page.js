'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { supabase } from '../../../lib/supabase';
import {
  getProfile,
  updateOrganizerInfo,
  isUsernameTaken,
} from '../../../lib/profile';

export default function OrganizerProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [about, setAbout] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');

  const [pictureUrl, setPictureUrl] = useState('');
  const [pictureFile, setPictureFile] = useState(null);
  const [picturePreview, setPicturePreview] = useState('');

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
          setUsername(profile.username || '');
          setDisplayName(profile.display_name || '');
          setAbout(profile.about || '');
          setWebsiteUrl(profile.website_url || '');
          setInstagramUrl(profile.instagram_url || '');
          setTwitterUrl(profile.twitter_url || '');
          setFacebookUrl(profile.facebook_url || '');
          setPictureUrl(profile.profile_picture_url || '');
          setPicturePreview(profile.profile_picture_url || '');
        }

        // Fallback for display name if empty
        if (!profile?.display_name) {
          const meta = user.user_metadata || {};
          const fallback = [meta.first_name, meta.last_name]
            .filter(Boolean)
            .join(' ');
          if (fallback) setDisplayName(fallback);
        }
      } catch (err) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  function handlePictureChange(e) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > 3 * 1024 * 1024) {
      setError('Profile picture must be under 3MB');
      return;
    }
    setPictureFile(selected);
    setPicturePreview(URL.createObjectURL(selected));
    setError('');
  }

  function normalizeUsername(value) {
    return value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    if (!username.trim()) {
      setError('Username is required');
      setSaving(false);
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      setSaving(false);
      return;
    }

    if (!displayName.trim()) {
      setError('Display name is required');
      setSaving(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Check username availability
      const taken = await isUsernameTaken(username, user.id);
      if (taken) {
        setError('That username is already taken.');
        setSaving(false);
        return;
      }

      // Upload new picture if provided
      let finalPictureUrl = pictureUrl;

      if (pictureFile) {
        const ext = pictureFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(fileName, pictureFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('event-images')
          .getPublicUrl(fileName);

        finalPictureUrl = publicUrl;
      }

      await updateOrganizerInfo(user.id, {
        username: username.trim(),
        display_name: displayName.trim(),
        about: about.trim(),
        profile_picture_url: finalPictureUrl,
        website_url: websiteUrl.trim(),
        instagram_url: instagramUrl.trim(),
        twitter_url: twitterUrl.trim(),
        facebook_url: facebookUrl.trim(),
      });

      setPictureUrl(finalPictureUrl);
      setPictureFile(null);
      setSuccess('Organizer profile saved.');
    } catch (err) {
      console.error(err);
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
        <h1>Organizer profile</h1>
        <p>This is what buyers will see on your events.</p>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Profile picture */}
          <label className="organizer-picture-upload">
            {picturePreview ? (
              <img
                src={picturePreview}
                alt="Profile"
                className="organizer-picture-preview"
              />
            ) : (
              <div className="organizer-picture-placeholder">
                <span>📷</span>
                <span>Upload profile picture</span>
                <span className="image-hint">JPG, PNG — max 3MB</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handlePictureChange}
              hidden
            />
          </label>

          {/* Username */}
          <label className="field-label">Username</label>
          <div className="username-input-wrap">
            <span className="username-prefix">ticketbox.com.ng/u/</span>
            <input
              type="text"
              placeholder="yourname"
              value={username}
              onChange={(e) =>
                setUsername(normalizeUsername(e.target.value))
              }
              maxLength={30}
              required
            />
          </div>

          <input
            type="text"
            placeholder="Display name (e.g. Lagos Party Co.)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={60}
            required
          />

          <label className="field-label">Email</label>
          <input
            type="email"
            value={email}
            disabled
            style={{ background: '#f8fafc', color: '#64748b' }}
          />

          <textarea
            placeholder="Tell buyers about your events and your story..."
            rows="4"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            maxLength={300}
          />

          <label className="field-label">Social links (optional)</label>
          <input
            type="url"
            placeholder="Website URL"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
          />
          <input
            type="text"
            placeholder="Instagram handle or URL"
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
          />
          <input
            type="text"
            placeholder="Twitter / X handle or URL"
            value={twitterUrl}
            onChange={(e) => setTwitterUrl(e.target.value)}
          />
          <input
            type="text"
            placeholder="Facebook URL"
            value={facebookUrl}
            onChange={(e) => setFacebookUrl(e.target.value)}
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
