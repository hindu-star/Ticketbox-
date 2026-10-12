'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '../../../../components/Navbar';
import Footer from '../../../../components/Footer';
import { supabase } from '../../../../lib/supabase';
import { getEvent, getTicketTypes, updateEvent } from '../../../../lib/events';

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id;

  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const event = await getEvent(eventId);

        if (event.organizer_id !== user.id) {
          router.push('/my-events');
          return;
        }

        setTitle(event.title || '');
        setLocation(event.location || '');
        setDate(event.event_date || '');
        setTime(event.event_time || '');
        setDescription(event.description || '');
        setImageUrl(event.image_url || '');
        setPreview(event.image_url || '');

        const t = await getTicketTypes(eventId);
        setTickets(
          t.length > 0
            ? t.map((x) => ({
                name: x.name,
                description: x.description || '',
                price: String(x.price || 0),
                capacity: x.capacity ? String(x.capacity) : '',
              }))
            : [{ name: '', description: '', price: '', capacity: '' }]
        );
      } catch (err) {
        setError(err.message || 'Failed to load event');
      } finally {
        setLoading(false);
      }
    }
    if (eventId) load();
  }, [eventId, router]);

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
    setTickets([...tickets, { name: '', description: '', price: '', capacity: '' }]);
  }

  function removeTicket(index) {
    if (tickets.length === 1) return;
    setTickets(tickets.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const validTickets = tickets.filter((t) => t.name.trim());
      if (validTickets.length === 0) {
        setError('Add at least one ticket type');
        setSaving(false);
        return;
      }

      for (const t of validTickets) {
        if (t.capacity && Number(t.capacity) < 1) {
          setError(`Capacity for "${t.name}" must be at least 1`);
          setSaving(false);
          return;
        }
      }

      let finalImageUrl = imageUrl;

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

        finalImageUrl = publicUrl;
      }

      await updateEvent(
        eventId,
        {
          title,
          location,
          event_date: date,
          event_time: time,
          description,
          image_url: finalImageUrl,
        },
        validTickets.map((t) => ({
          name: t.name,
          description: t.description,
          price: t.price,
          capacity: t.capacity ? Number(t.capacity) : null,
        }))
      );

      router.push('/my-events');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to update event');
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="auth-page">
          <p style={{ color: '#64748b' }}>Loading event...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="auth-page" style={{ maxWidth: 560 }}>
        <h1>Edit event</h1>
        <p>Update the details and save your changes.</p>

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
            placeholder="Time"
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

            <p className="tickets-hint">
              Capacity is optional. Leave it blank for unlimited tickets.
            </p>

            {tickets.map((ticket, i) => (
              <div key={i} className="ticket-input-row">
                <input
                  type="text"
                  placeholder="Name (e.g. VIP)"
                  value={ticket.name}
                  onChange={(e) => updateTicket(i, 'name', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Short description"
                  value={ticket.description}
                  onChange={(e) => updateTicket(i, 'description', e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Price (₦)"
                  value={ticket.price}
                  onChange={(e) => updateTicket(i, 'price', e.target.value)}
                  min="0"
                />
                <input
                  type="number"
                  placeholder="Limit (optional)"
                  value={ticket.capacity}
                  onChange={(e) => updateTicket(i, 'capacity', e.target.value)}
                  min="1"
                />
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
            ))}
          </div>

          <button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>
      <Footer />
    </>
  );
              }
