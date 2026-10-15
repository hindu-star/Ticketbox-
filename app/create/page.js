'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { supabase } from '../../lib/supabase';
import { createEvent } from '../../lib/events';
import { createPromoCodesForEvent } from '../../lib/promo';
import { EVENT_FORMATS } from '../../lib/eventFormats';
import { EVENT_CATEGORIES } from '../../lib/eventCategories';
import { NIGERIA_STATES, NIGERIA_STATE_NAMES } from '../../lib/nigeriaStates';
import { EVENT_THEMES } from '../../lib/eventThemes';
import RichTextEditor from '../../components/RichTextEditor';
import ThemePreview from '../../components/ThemePreview';

function emptyTicket() {
  return {
    name: 'Regular',
    description: 'General admission',
    ticket_kind: 'paid',
    price: '',
    capacity: '',
    unlimited: false,
    order_limit: 10,
    perks: [],
    is_invite_only: false,
    invite_password: '',
  };
}

function emptyPromo() {
  return {
    code: '',
    discount_type: 'percent',
    discount_value: '',
    max_uses: '',
    expires_at: '',
  };
}

const DESCRIPTION_MAX = 300;

export default function CreatePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [state, setState] = useState('');
  const [lga, setLga] = useState('');
  const [cityArea, setCityArea] = useState('');
  const [locationTip, setLocationTip] = useState('');
  const [eventFormat, setEventFormat] = useState('');
  const [eventCategory, setEventCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [theme, setTheme] = useState('classic');

  const [tickets, setTickets] = useState([emptyTicket()]);
  const [promoCodes, setPromoCodes] = useState([]);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [promoDraft, setPromoDraft] = useState(emptyPromo());
  const [promoError, setPromoError] = useState('');

  const [submitting, setSubmitting] = useState(null);
  const [error, setError] = useState('');

  const lgasForState =
    state && NIGERIA_STATES[state] ? NIGERIA_STATES[state] : [];

  const descTextLength = (description || '')
    .replace(/<[^>]*>/g, '')
    .trim().length;

  function handleFileChange(e) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB');
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setError('');
  }

  function updateTicket(index, field, value) {
    const updated = [...tickets];
    updated[index][field] = value;
    setTickets(updated);
  }

  function addTicket() {
    setTickets([...tickets, emptyTicket()]);
  }

  function removeTicket(index) {
    if (tickets.length === 1) return;
    setTickets(tickets.filter((_, i) => i !== index));
  }

  function addPerk(ticketIndex) {
    const updated = [...tickets];
    updated[ticketIndex].perks = [...updated[ticketIndex].perks, ''];
    setTickets(updated);
  }

  function updatePerk(ticketIndex, perkIndex, value) {
    const updated = [...tickets];
    updated[ticketIndex].perks[perkIndex] = value;
    setTickets(updated);
  }

  function removePerk(ticketIndex, perkIndex) {
    const updated = [...tickets];
    updated[ticketIndex].perks = updated[ticketIndex].perks.filter(
      (_, i) => i !== perkIndex
    );
    setTickets(updated);
  }

  // === PROMO HANDLERS ===
  function addPromoCode() {
    setPromoError('');
    const clean = promoDraft.code.toUpperCase().trim().replace(/\s+/g, '');
    if (clean.length < 3) {
      setPromoError('Code must be at least 3 characters');
      return;
    }
    if (promoCodes.some((c) => c.code === clean)) {
      setPromoError('That code already exists');
      return;
    }
    const value = Number(promoDraft.discount_value);
    if (!value || value <= 0) {
      setPromoError('Enter a valid discount value');
      return;
    }
    if (promoDraft.discount_type === 'percent' && value > 100) {
      setPromoError('Percent cannot exceed 100');
      return;
    }

    const newCode = {
      code: clean,
      discount_type: promoDraft.discount_type,
      discount_value: value,
      max_uses: promoDraft.max_uses ? Number(promoDraft.max_uses) : null,
      expires_at: promoDraft.expires_at
        ? new Date(promoDraft.expires_at).toISOString()
        : null,
    };

    setPromoCodes([...promoCodes, newCode]);
    setPromoDraft(emptyPromo());
    setShowPromoForm(false);
    setPromoError('');
  }

  function removePromoCode(index) {
    setPromoCodes(promoCodes.filter((_, i) => i !== index));
  }

  function formatPromoDiscount(p) {
    if (p.discount_type === 'percent') return `${p.discount_value}% off`;
    return `₦${Number(p.discount_value).toLocaleString()} off`;
  }

  // === STEP VALIDATION ===
  function validateStep1() {
    if (!title.trim()) return 'Event name is required';

    const descText = (description || '').replace(/<[^>]*>/g, '').trim();
    if (descText.length < 20) {
      return 'Please describe your event (at least 20 characters)';
    }
    if (descText.length > DESCRIPTION_MAX) {
      return `Description must be ${DESCRIPTION_MAX} characters or less`;
    }

    if (!streetAddress.trim()) return 'Street address is required';
    if (!state) return 'Please select a state';
    if (!lga) return 'Please select an LGA';
    if (!eventFormat) return 'Please select an event format';
    if (!eventCategory) return 'Please select a category';
    if (!startDate) return 'Start date is required';
    if (!startTime) return 'Start time is required';
    if (!endDate) return 'End date is required';
    if (!endTime) return 'End time is required';

    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    if (end <= start) return 'End date/time must be after start date/time';

    return '';
  }

  function goToStep2(e) {
    e.preventDefault();
    const err = validateStep1();
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setStep(2);
  }

  function goToStep3(e) {
    e.preventDefault();
    setError('');
    setStep(3);
  }

  function formatTime(t) {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = Number(h);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${display}:${m} ${suffix}`;
  }

  async function handleSubmit(mode) {
    setSubmitting(mode);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to create an event.');
        setSubmitting(null);
        return;
      }

      const validTickets = tickets.filter((t) => t.name.trim());
      if (validTickets.length === 0) {
        setError('Add at least one ticket type');
        setSubmitting(null);
        return;
      }

      for (const t of validTickets) {
        if (t.is_invite_only && !t.invite_password.trim()) {
          setError(`Invite ticket "${t.name}" needs a password`);
          setSubmitting(null);
          return;
        }
      }

      let imageUrl = null;
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('event-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const locationString = [streetAddress, cityArea, lga, state]
        .filter(Boolean)
        .join(', ');

      const timeString = `${formatTime(startTime)} – ${formatTime(endTime)}`;

      const newEvent = await createEvent(
        {
          title,
          description,
          location: locationString,
          event_date: startDate,
          event_time: timeString,
          image_url: imageUrl,
          emoji: '🎉',
          organizer_id: user.id,
          country: 'Nigeria',
          state,
          lga,
          city_area: cityArea || null,
          location_tip: locationTip || null,
          event_format: eventFormat,
          event_category: eventCategory,
          start_date: startDate,
          start_time: startTime,
          end_date: endDate,
          end_time: endTime,
          website_url: websiteUrl || null,
          instagram_url: instagramUrl || null,
          twitter_url: twitterUrl || null,
          facebook_url: facebookUrl || null,
          theme,
          status: mode === 'draft' ? 'draft' : 'published',
        },
        validTickets.map((t) => ({
          name: t.name,
          description: t.description,
          ticket_kind: t.ticket_kind,
          price: t.ticket_kind === 'paid' ? t.price : 0,
          capacity: t.unlimited ? null : t.capacity,
          order_limit: t.order_limit,
          perks: t.perks.filter((p) => p.trim()),
          is_invite_only: t.is_invite_only,
          invite_password: t.is_invite_only ? t.invite_password : null,
        }))
      );

      // Save promo codes now that event exists
      if (promoCodes.length > 0) {
        try {
          await createPromoCodesForEvent(newEvent.id, user.id, promoCodes);
        } catch (promoErr) {
          console.error('Promo save error:', promoErr);
          // non-fatal — event still created
        }
      }

      if (mode === 'draft') {
        router.push('/my-events');
      } else {
        router.push(`/event/${newEvent.id}`);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create event');
      setSubmitting(null);
    }
  }

  return (
    <>
      <Navbar />
      <div className="wizard-page">
        <div className="wizard-header">
          <h1>Create an event</h1>
          <div className="wizard-steps">
            <div className={`wizard-step ${step >= 1 ? 'active' : ''}`}>
              <span className="wizard-step-num">1</span>
              <span className="wizard-step-label">Details</span>
            </div>
            <div className="wizard-line" />
            <div className={`wizard-step ${step >= 2 ? 'active' : ''}`}>
              <span className="wizard-step-num">2</span>
              <span className="wizard-step-label">Appearance</span>
            </div>
            <div className="wizard-line" />
            <div className={`wizard-step ${step >= 3 ? 'active' : ''}`}>
              <span className="wizard-step-num">3</span>
              <span className="wizard-step-label">Tickets</span>
            </div>
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {step === 1 && (
          <form className="auth-form" onSubmit={goToStep2}>
            <div className="form-section">
              <h3 className="form-section-title">Event basics</h3>

              <input
                type="text"
                placeholder="Event name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={75}
                required
              />

              <label className="field-label">Description</label>
              <div className="rte-wrap-with-counter">
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Describe your event..."
                  maxLength={DESCRIPTION_MAX}
                />
                <div className="rte-counter">
                  {descTextLength} / {DESCRIPTION_MAX} characters
                </div>
              </div>
              <p className="field-hint">
                Required — tell attendees what to expect (20–{DESCRIPTION_MAX} characters).
              </p>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">Location</h3>
              <p className="form-section-hint">Event is in Nigeria</p>

              <input
                type="text"
                placeholder="Street address"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                required
              />

              <select
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                  setLga('');
                }}
                required
              >
                <option value="">Select state</option>
                {NIGERIA_STATE_NAMES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select
                value={lga}
                onChange={(e) => setLga(e.target.value)}
                disabled={!state}
                required
              >
                <option value="">{state ? 'Select LGA' : 'Select state first'}</option>
                {lgasForState.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>

              <input
                type="text"
                placeholder="City / Area (optional)"
                value={cityArea}
                onChange={(e) => setCityArea(e.target.value)}
              />

              <input
                type="text"
                placeholder="Location tip (e.g. Behind the blue gate)"
                value={locationTip}
                onChange={(e) => setLocationTip(e.target.value)}
              />
            </div>

            <div className="form-section">
              <h3 className="form-section-title">Format & category</h3>

              <select
                value={eventFormat}
                onChange={(e) => setEventFormat(e.target.value)}
                required
              >
                <option value="">Select event format</option>
                {EVENT_FORMATS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>

              <select
                value={eventCategory}
                onChange={(e) => setEventCategory(e.target.value)}
                required
              >
                <option value="">Select category</option>
                {EVENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">Schedule</h3>

              <label className="field-label">Starts</label>
              <div className="datetime-row">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>

              <label className="field-label">Ends</label>
              <div className="datetime-row">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">Social links (optional)</h3>

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
            </div>

            <button type="submit">Continue →</button>
          </form>
        )}

        {step === 2 && (
          <form className="auth-form" onSubmit={goToStep3}>
            <div className="form-section">
              <h3 className="form-section-title">Event image</h3>
              <p className="form-section-hint">
                Use a portrait (4:5) or square image. Max 5MB.
              </p>

              <label className="image-upload">
                {preview ? (
                  <img src={preview} alt="Preview" className="image-preview" />
                ) : (
                  <div className="image-placeholder">
                    <span>📷</span>
                    <span>Tap to upload event image</span>
                    <span className="image-hint">JPG, PNG — max 5MB</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  hidden
                />
              </label>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">Choose a theme</h3>
              <p className="form-section-hint">
                Pick how your event page will look to buyers.
              </p>

              <div className="theme-grid">
                {EVENT_THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`theme-card ${theme === t.id ? 'active' : ''}`}
                    onClick={() => setTheme(t.id)}
                  >
                    <ThemePreview theme={t.id} />

                    {theme === t.id && <div className="theme-check">✓</div>}

                    <div className="theme-card-footer">
                      <div className="theme-name">{t.name}</div>
                      <div className="theme-desc">{t.description}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="theme-live-preview">
                <div className="theme-live-label">Live preview</div>
                <ThemePreview theme={theme} large />
              </div>
            </div>

            <div className="wizard-actions">
              <button
                type="button"
                className="wizard-back"
                onClick={() => setStep(1)}
              >
                ← Back
              </button>
              <button type="submit">Continue →</button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
            <div className="form-section">
              <div className="tickets-header">
                <h3>Ticket types</h3>
                <button
                  type="button"
                  onClick={addTicket}
                  className="add-ticket-btn"
                >
                  + Add ticket
                </button>
              </div>

              {tickets.map((ticket, i) => (
                <div key={i} className="ticket-block">
                  <div className="ticket-block-header">
                    <span>Ticket {i + 1}</span>
                    {tickets.length > 1 && (
                      <button
                        type="button"
                        className="remove-ticket-btn"
                        onClick={() => removeTicket(i)}
                      >
                        ×
                      </button>
                    )}
                  </div>

                  <div className="kind-row">
                    <div className="kind-toggle">
                      <button
                        type="button"
                        className={
                          ticket.ticket_kind === 'free' ? 'kind active' : 'kind'
                        }
                        onClick={() => updateTicket(i, 'ticket_kind', 'free')}
                      >
                        Free
                      </button>
                      <button
                        type="button"
                        className={
                          ticket.ticket_kind === 'paid' ? 'kind active' : 'kind'
                        }
                        onClick={() => updateTicket(i, 'ticket_kind', 'paid')}
                      >
                        Paid
                      </button>
                    </div>
                    <label className="invite-toggle">
                      <input
                        type="checkbox"
                        checked={ticket.is_invite_only}
                        onChange={(e) =>
                          updateTicket(i, 'is_invite_only', e.target.checked)
                        }
                      />
                      <span>Invite-only</span>
                    </label>
                  </div>

                  <input
                    type="text"
                    placeholder="Ticket name (e.g. VIP)"
                    value={ticket.name}
                    onChange={(e) => updateTicket(i, 'name', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Short description"
                    value={ticket.description}
                    onChange={(e) =>
                      updateTicket(i, 'description', e.target.value)
                    }
                  />

                  {ticket.ticket_kind === 'paid' && (
                    <div className="price-input-wrap">
                      <span className="price-prefix">₦</span>
                      <input
                        type="number"
                        placeholder="Price"
                        value={ticket.price}
                        onChange={(e) =>
                          updateTicket(i, 'price', e.target.value)
                        }
                        min="0"
                      />
                    </div>
                  )}

                  {ticket.is_invite_only && (
                    <div className="invite-password-block">
                      <label>Invite password</label>
                      <input
                        type="text"
                        placeholder="e.g. vip2026"
                        value={ticket.invite_password}
                        onChange={(e) =>
                          updateTicket(i, 'invite_password', e.target.value)
                        }
                      />
                      <p className="invite-hint">
                        {ticket.ticket_kind === 'free'
                          ? 'Free, but only invited guests can claim it.'
                          : 'Paid, but only invited guests can see and buy it.'}
                      </p>
                    </div>
                  )}

                  <div className="quantity-block">
                    <select
                      value={ticket.unlimited ? 'unlimited' : 'limited'}
                      onChange={(e) =>
                        updateTicket(
                          i,
                          'unlimited',
                          e.target.value === 'unlimited'
                        )
                      }
                    >
                      <option value="limited">Limited quantity</option>
                      <option value="unlimited">Unlimited quantity</option>
                    </select>

                    {!ticket.unlimited ? (
                      <input
                        type="number"
                        placeholder="How many?"
                        value={ticket.capacity}
                        onChange={(e) =>
                          updateTicket(i, 'capacity', e.target.value)
                        }
                        min="1"
                      />
                    ) : (
                      <div className="unlimited-badge">∞</div>
                    )}
                  </div>

                  <div className="order-limit-row">
                    <label>Order limit per person</label>
                    <select
                      value={ticket.order_limit}
                      onChange={(e) =>
                        updateTicket(i, 'order_limit', Number(e.target.value))
                      }
                    >
                      {[1, 2, 3, 4, 5, 6, 8, 10, 15, 20, 50].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>

                  <div className="perks-section">
                    <label>Perks (optional)</label>
                    {ticket.perks.map((perk, j) => (
                      <div key={j} className="perk-row">
                        <input
                          type="text"
                          placeholder="e.g. Free drink"
                          value={perk}
                          onChange={(e) => updatePerk(i, j, e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => removePerk(i, j)}
                          className="perk-remove"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="add-perk-btn"
                      onClick={() => addPerk(i)}
                    >
                      + Add perk
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* PROMO CODES SECTION */}
            <div className="form-section promo-inline-section">
              <div className="tickets-header">
                <div>
                  <h3>Promo codes</h3>
                  <p className="promo-inline-hint">
                    Optional — let buyers enter a code at checkout for a
                    discount.
                  </p>
                </div>
                {!showPromoForm && (
                  <button
                    type="button"
                    onClick={() => setShowPromoForm(true)}
                    className="add-ticket-btn"
                  >
                    + Add code
                  </button>
                )}
              </div>

              {showPromoForm && (
                <div className="promo-inline-form">
                  {promoError && (
                    <div className="auth-error">{promoError}</div>
                  )}

                  <input
                    type="text"
                    placeholder="e.g. EARLYBIRD"
                    value={promoDraft.code}
                    onChange={(e) =>
                      setPromoDraft({
                        ...promoDraft,
                        code: e.target.value
                          .toUpperCase()
                          .replace(/[^A-Z0-9]/g, '')
                          .slice(0, 20),
                      })
                    }
                  />

                  <div className="promo-row">
                    <div style={{ flex: 1 }}>
                      <label className="field-label">Type</label>
                      <select
                        value={promoDraft.discount_type}
                        onChange={(e) =>
                          setPromoDraft({
                            ...promoDraft,
                            discount_type: e.target.value,
                          })
                        }
                      >
                        <option value="percent">Percent off</option>
                        <option value="fixed">Fixed amount off</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="field-label">
                        {promoDraft.discount_type === 'percent'
                          ? 'Percent'
                          : 'Amount (₦)'}
                      </label>
                      <input
                        type="number"
                        placeholder={
                          promoDraft.discount_type === 'percent'
                            ? 'e.g. 20'
                            : 'e.g. 1000'
                        }
                        value={promoDraft.discount_value}
                        onChange={(e) =>
                          setPromoDraft({
                            ...promoDraft,
                            discount_value: e.target.value,
                          })
                        }
                        min="1"
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
                        value={promoDraft.max_uses}
                        onChange={(e) =>
                          setPromoDraft({
                            ...promoDraft,
                            max_uses: e.target.value,
                          })
                        }
                        min="1"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="field-label">
                        Expires (optional)
                      </label>
                      <input
                        type="date"
                        value={promoDraft.expires_at}
                        onChange={(e) =>
                          setPromoDraft({
                            ...promoDraft,
                            expires_at: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="promo-form-actions">
                    <button
                      type="button"
                      className="promo-cancel-btn"
                      onClick={() => {
                        setShowPromoForm(false);
                        setPromoDraft(emptyPromo());
                        setPromoError('');
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="promo-save-btn"
                      onClick={addPromoCode}
                    >
                      Save code
                    </button>
                  </div>
                </div>
              )}

              {promoCodes.length > 0 && (
                <div className="promo-list">
                  {promoCodes.map((c, i) => (
                    <div key={i} className="promo-row-item">
                      <div className="promo-row-left">
                        <div className="promo-code-label">{c.code}</div>
                        <div className="promo-code-meta">
                          {formatPromoDiscount(c)}
                          {c.max_uses ? ` · Max ${c.max_uses} uses` : ''}
                          {c.expires_at ? ' · Has expiry' : ''}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="promo-delete-btn"
                        onClick={() => removePromoCode(i)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {promoCodes.length === 0 && !showPromoForm && (
                <p className="promo-inline-hint" style={{ marginTop: 4 }}>
                  No promo codes yet.
                </p>
              )}
            </div>

            <div className="publish-actions">
              <button
                type="button"
                className="publish-draft"
                onClick={() => handleSubmit('draft')}
                disabled={submitting !== null}
              >
                {submitting === 'draft' ? 'Saving...' : 'Save as draft'}
              </button>
              <button
                type="button"
                className="publish-live"
                onClick={() => handleSubmit('published')}
                disabled={submitting !== null}
              >
                {submitting === 'published' ? 'Publishing...' : 'Publish event'}
              </button>
            </div>

            <button
              type="button"
              className="wizard-back-full"
              onClick={() => setStep(2)}
            >
              ← Back to appearance
            </button>
          </form>
        )}
      </div>
      <Footer />
    </>
  );
    }
