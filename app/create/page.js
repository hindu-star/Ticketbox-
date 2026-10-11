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
  const [price, setPrice] = useState('');
  const [emoji, setEmoji] = useState('🎉');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

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

      const newEvent = await createEvent({
        title,
        location,
        event_date: date,
        event_time: time,
        description,
        price: Number(price) || 0,
        emoji,
        organizer_id: user.id,
      });

      router.push(`/event/${newEvent.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create event');
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <div className="auth-page">
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
          <input
            type="text"
            placeholder="Emoji (e.g. 🎵 🎤 🎨)"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
          />
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
          <input
            type="number"
            placeholder="Ticket price (₦) — leave 0 for free"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min="0"
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create event'}
          </button>
        </form>
      </div>
      <Footer />
    </>
  );
              }
