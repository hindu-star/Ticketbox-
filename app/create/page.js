'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { supabase } from '../../lib/supabase';
import { createEvent } from '../../lib/events';

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
    invite_password: '',
  };
}

export default function CreatePage() {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [tickets, setTickets] = useState([emptyTicket()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  function handleFileChange(e) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB');
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
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

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to create an event.');
        setLoading(false);
        return;
      }

      const validTickets = tickets.filter((t) => t.name.trim());
      if (validTickets.length === 0) {
        setError('Add at least one ticket type');
        setLoading(false);
        return;
      }

      // Validate invite tickets have a password
      for (const t of validTickets) {
        if (t.ticket_kind === 'invite' && !t.invite_password.trim()) {
          setError(`Invite ticket "${t.name}" needs a password`);
          setLoading(false);
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

      const newEvent = await createEvent(
        {
          title,
          location,
          event_date: date,
          event_time: time,
          description,
          image_url: imageUrl,
          emoji: '🎉',
          organizer_id: user.id,
        },
        validTickets.map((t) => ({
          name: t.name,
          description: t.description,
          ticket_kind: t.ticket_kind,
          price: t.ticket_kind === 'paid' ? t.price : 0,
          capacity: t.unlimited ? null : t.capacity,
          order_limit: t.order_limit,
          perks: t.perks.filter((p) => p.trim()),
          invite_password:
            t.ticket_kind === 'invite' ? t.invite_password : null,
        }))
      );

      router.push(`/event/${newEvent.id}`);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create event');
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <div className="auth-page" style={{ maxWidth: 600 }}>
        <h1>Create an event</h1>
        <p>Fill in the details and start selling tickets.</p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Event title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

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
            <input type="file" accept="image/*" onChange={handleFileChange} hidden />
          </label>

          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Time (e.g. 6:00 PM – 11:00 PM)"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
          <textarea
            placeholder="Description"
            rows="4"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="tickets-section">
            <div className="tickets-header">
              <h3>Ticket types</h3>
              <button type="button" onClick={addTicket} className="add-ticket-btn">
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
                      className={ticket.ticket_kind === 'free' ? 'kind active' : 'kind'}
                      onClick={() => updateTicket(i, 'ticket_kind', 'free')}
                    >
                      Free
                    </button>
                    <button
                      type="button"
                      className={ticket.ticket_kind === 'paid' ? 'kind active' : 'kind'}
                      onClick={() => updateTicket(i, 'ticket_kind', 'paid')}
                    >
                      Paid
                    </button>
                  </div>
                  <label className="invite-toggle">
                    <input
                      type="checkbox"
                      checked={ticket.ticket_kind === 'invite'}
                      onChange={(e) =>
                        updateTicket(
                          i,
                          'ticket_kind',
                          e.target.checked ? 'invite' : 'paid'
                        )
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
                  onChange={(e) => updateTicket(i, 'description', e.target.value)}
                />

                {ticket.ticket_kind === 'paid' && (
                  <div className="price-input-wrap">
                    <span className="price-prefix">₦</span>
                    <input
                      type="number"
                      placeholder="Price"
                      value={ticket.price}
                      onChange={(e) => updateTicket(i, 'price', e.target.value)}
                      min="0"
                    />
                  </div>
                )}

                {ticket.ticket_kind === 'invite' && (
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
                      Buyers will need this password to see and buy this ticket.
                    </p>
                  </div>
                )}

                <div className="quantity-block">
                  <select
                    value={ticket.unlimited ? 'unlimited' : 'limited'}
                    onChange={(e) =>
                      updateTicket(i, 'unlimited', e.target.value === 'unlimited')
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
                      onChange={(e) => updateTicket(i, 'capacity', e.target.value)}
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

          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create event'}
          </button>
        </form>
      </div>
      <Footer />
    </>
  );
              }
