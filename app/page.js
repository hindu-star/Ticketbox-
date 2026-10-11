import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import EventCard from '../components/EventCard';
import Link from 'next/link';
import { getEvents } from '../lib/events';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let events = [];

  try {
    const all = await getEvents();
    events = all.slice(0, 4);
  } catch (err) {
    console.error('Failed to load events:', err);
  }

  return (
    <>
      <Navbar />

      <div className="hero">
        <h1>Find events <span>near you</span></h1>
        <p>Discover concerts, parties, conferences and more. Buy tickets in seconds.</p>
        <div className="search-bar">
          <input type="text" placeholder="Search events or cities..." />
          <Link href="/browse"><button>Browse all</button></Link>
        </div>
      </div>

      <section className="section">
        <h2>🔥 Trending now</h2>
        {events.length === 0 ? (
          <div className="empty-state">
            <p>No events yet. <Link href="/create">Be the first to create one!</Link></p>
          </div>
        ) : (
          <div className="events-grid">
            {events.map((e) => (
              <EventCard
                key={e.id}
                event={{
                  id: e.id,
                  emoji: e.emoji || '🎉',
                  date: e.event_date
                    ? new Date(e.event_date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Date TBA',
                  title: e.title,
                  location: e.location,
                  price: e.price > 0 ? `From ₦${Number(e.price).toLocaleString()}` : 'Free',
                }}
              />
            ))}
          </div>
        )}
      </section>

      <div className="cta">
        <h2>Hosting an event?</h2>
        <p>Create your event and start selling tickets in minutes.</p>
        <Link href="/create"><button>Create an event</button></Link>
      </div>

      <Footer />
    </>
  );
                  }
