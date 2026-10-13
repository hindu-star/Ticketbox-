'use client';

import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import EventCard from '../../components/EventCard';
import { getPublishedEvents, addSoldOutFlags } from '../../lib/events';

export default function BrowsePage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const all = await getPublishedEvents();
        const withFlags = await addSoldOutFlags(all);
        setEvents(withFlags);
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const q = query.trim().toLowerCase();

  const filtered = q
    ? events.filter((e) => {
        const haystack = `${e.title || ''} ${e.location || ''} ${
          e.event_category || ''
        } ${e.event_format || ''}`.toLowerCase();
        return haystack.includes(q);
      })
    : events;

  return (
    <>
      <Navbar />
      <section className="section">
        <h2>🎟️ All Events</h2>

        <div className="browse-search">
          <input
            type="text"
            placeholder="Search by event name, city or category..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              className="browse-search-clear"
              onClick={() => setQuery('')}
            >
              ×
            </button>
          )}
        </div>

        {loading ? (
          <p style={{ color: '#64748b' }}>Loading events...</p>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            {q ? (
              <>
                <p>No events match &ldquo;{query}&rdquo;.</p>
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="content-btn-secondary"
                >
                  Clear search
                </button>
              </>
            ) : (
              <p>No events yet. Be the first to create one!</p>
            )}
          </div>
        ) : (
          <>
            {q && (
              <p className="browse-result-count">
                {filtered.length} event{filtered.length === 1 ? '' : 's'} found
              </p>
            )}
            <div className="events-grid">
              {filtered.map((e) => (
                <EventCard
                  key={e.id}
                  event={{
                    id: e.id,
                    emoji: e.emoji || '🎉',
                    image_url: e.image_url,
                    soldOut: e.soldOut,
                    date: e.event_date
                      ? new Date(e.event_date).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })
                      : 'Date TBA',
                    title: e.title,
                    location: e.location,
                    price: e.soldOut ? 'Sold out' : 'View tickets →',
                  }}
                />
              ))}
            </div>
          </>
        )}
      </section>
      <Footer />
    </>
  );
              }
