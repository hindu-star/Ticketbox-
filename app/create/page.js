'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { supabase } from '../../lib/supabase';
import { createEvent } from '../../lib/events';

export default function CreatePage() {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [tickets, setTickets] = useState([
    { name: 'Regular', description: 'General admission', price: '' },
  ]);
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
    setTickets([...tickets, { name: '', description: '', price: '' }]);
  }

  function removeTicket(index) {
    if (tickets.length === 1) return;
    setTickets(tickets.filter((_, i) => i !== index));
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

      // Validate tickets
      const validTickets = tickets.filter((t) => t.name.trim());
      if (validTickets.length === 0) {
        setError('Add at least one ticket type');
        setLoading(false);
        return;
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
        validTickets
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
      <div className="auth-page" style={{ maxWidth: 560 }}>
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

          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create event'}
          </button>
        </form>
      </div>
      <Footer />
    </>
  );
              }
