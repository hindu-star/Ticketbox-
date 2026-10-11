'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { supabase } from '../../lib/supabase';
import { getMyEvents, deleteEvent } from '../../lib/events';

export default function MyEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const myEvents = await getMyEvents(user.id);
        setEvents(myEvents);
      } catch (err) {
        setError(err.message || 'Failed to load events');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  async function handleDelete(id, title) {
    const confirmed = window.confirm(
      `Delete "${title}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeleting(id);
    try {
      await deleteEvent(id);
      setEvents(events.filter((e) => e.id !== id));
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      <Navbar />
      <div className="dashboard-page">
        <div className="dashboard-header">
          <div>
            <h1>My Events</h1>
            <p>Manage the events you've created.</p>
          </div>
          <Link href="/create" className="dashboard-create-btn">
            + Create event
          </Link>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {loading ? (
          <p style={{ color: '#64748b' }}>Loading your events...</p>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <p>You haven't created any events yet.</p>
            <Link href="/create">Create your first event</Link>
          </div>
        ) : (
          <div className="dashboard-list">
            {events.map((e) => (
              <div key={e.id} className="dashboard-row">
                <div className="dashboard-row-img">
                  {e.image_url ? (
                    <img src={e.image_url} alt={e.title} />
                  ) : (
                    <span>{e.emoji || '🎉'}</span>
                  )}
                </div>
                <div className="dashboard-row-info">
                  <div className="dashboard-row-title">{e.title}</div>
                  <div className="dashboard-row-meta">
                    📍 {e.location} · 📅{' '}
                    {e.event_date
                      ? new Date(e.event_date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'TBA'}
                  </div>
                </div>
                <div className="dashboard-row-actions">
                  <Link href={`/event/${e.id}`} className="dash-btn">View</Link>
                  <Link href={`/my-events/edit/${e.id}`} className="dash-btn">Edit</Link>
                  <button
                    onClick={() => handleDelete(e.id, e.title)}
                    disabled={deleting === e.id}
                    className="dash-btn dash-btn-danger"
                  >
                    {deleting === e.id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
