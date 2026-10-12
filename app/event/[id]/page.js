import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { getEvent, getTicketTypes } from '../../../lib/events';

export default async function EventPage({ params }) {
  let event;
  let tickets = [];

  try {
    event = await getEvent(params.id);
    tickets = await getTicketTypes(params.id);
  } catch (err) {
    notFound();
  }

  if (!event) notFound();

  const formattedDate = event.event_date
    ? new Date(event.event_date).toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Date coming soon';

  return (
    <>
      <Navbar />
      <div className="event-detail">
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} className="event-hero-img" />
        ) : (
          <div className="event-hero">{event.emoji || '🎉'}</div>
        )}
        <div className="event-info">
          <h1>{event.title}</h1>
          <div className="event-meta">
            <div>📅 {formattedDate}</div>
            <div>🕐 {event.event_time || 'Time TBA'}</div>
            <div>📍 {event.location}</div>
          </div>
          <p className="event-desc">
            {event.description || 'Full details coming soon.'}
          </p>

          <h2 className="ticket-heading">Tickets</h2>
          <div className="ticket-list">
            {tickets.length === 0 ? (
              <p style={{ color: '#64748b' }}>No tickets available yet.</p>
            ) : (
              tickets.map((t) => {
                const remaining = t.capacity
                  ? t.capacity - (t.quantity_sold || 0)
                  : null;
                const soldOut = remaining !== null && remaining <= 0;

                return (
                  <div key={t.id} className="ticket-row">
                    <div>
                      <div className="ticket-name">{t.name}</div>
                      <div className="ticket-desc">
                        {t.description || 'General admission'}
                      </div>
                      {t.capacity && (
                        <div className={`ticket-remaining ${soldOut ? 'sold-out' : ''}`}>
                          {soldOut
                            ? 'Sold out'
                            : `${remaining} of ${t.capacity} remaining`}
                        </div>
                      )}
                    </div>
                    <div className="ticket-right">
                      <div className="ticket-price">
                        {t.price > 0 ? `₦${Number(t.price).toLocaleString()}` : 'Free'}
                      </div>
                      {soldOut ? (
                        <span className="ticket-soldout-btn">Sold out</span>
                      ) : (
                        <Link
                          href={`/checkout/${event.id}/${t.id}`}
                          className="ticket-buy"
                        >
                          Buy
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
                  }
