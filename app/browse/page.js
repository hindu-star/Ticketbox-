import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import EventCard from '../../components/EventCard';
import { getPublishedEvents, addSoldOutFlags } from '../../lib/events';

export const dynamic = 'force-dynamic';

export default async function BrowsePage() {
  let events = [];

  try {
    const all = await getPublishedEvents();
    events = await addSoldOutFlags(all);
  } catch (err) {
    console.error('Failed to load events:', err);
  }

  return (
    <>
      <Navbar />
      <section className="section">
        <h2>🎟️ All Events</h2>

        {events.length === 0 ? (
          <div className="empty-state">
            <p>No events yet. Be the first to create one!</p>
          </div>
        ) : (
          <div className="events-grid">
            {events.map((e) => (
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
        )}
      </section>
      <Footer />
    </>
  );
}
